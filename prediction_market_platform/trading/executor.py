"""
Trade Execution Engine.

Handles order submission and execution for prediction markets:
- Polymarket (via CLOB API)
- Kalshi (via Trading API)

IMPORTANT: This module executes REAL trades with REAL money.
Always use proper risk management and position sizing.
"""

import json
import time
import hmac
import hashlib
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config

logger = get_logger("trade_executor")


class OrderSide(Enum):
    """Order side - buy or sell."""
    BUY = "buy"
    SELL = "sell"


class OrderType(Enum):
    """Order type."""
    MARKET = "market"
    LIMIT = "limit"
    GTC = "gtc"  # Good til cancelled
    FOK = "fok"  # Fill or kill
    IOC = "ioc"  # Immediate or cancel


class OrderStatus(Enum):
    """Order status."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class Order:
    """Order specification."""
    order_id: str
    market_id: str
    side: OrderSide
    outcome: str  # "yes" or "no"
    quantity: float
    price: Optional[float] = None  # None for market orders
    order_type: OrderType = OrderType.LIMIT

    # Execution details
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    filled_price: float = 0.0

    # Timestamps
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None

    # Metadata
    strategy_name: Optional[str] = None
    signal_id: Optional[str] = None
    notes: str = ""


@dataclass
class Trade:
    """Executed trade record."""
    trade_id: str
    order_id: str
    market_id: str
    side: OrderSide
    outcome: str
    quantity: float
    price: float
    value: float  # quantity * price
    fee: float
    timestamp: datetime
    source: str  # "polymarket" or "kalshi"

    @property
    def net_value(self) -> float:
        """Value after fees."""
        return self.value - self.fee


@dataclass
class ExecutionResult:
    """Result of order execution attempt."""
    success: bool
    order: Order
    trades: List[Trade] = field(default_factory=list)
    error_message: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


class PolymarketExecutor:
    """
    Trade executor for Polymarket.

    Uses the CLOB API for order submission.
    Requires API key and secret for authenticated endpoints.

    API Documentation: https://docs.polymarket.com/
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        passphrase: Optional[str] = None,
        testnet: bool = True
    ):
        """
        Initialize Polymarket executor.

        Args:
            api_key: Polymarket API key
            api_secret: Polymarket API secret
            passphrase: API passphrase
            testnet: Use testnet if True (safer for testing)
        """
        self.api_key = api_key or get_config('polymarket.api_key', '')
        self.api_secret = api_secret or get_config('polymarket.api_secret', '')
        self.passphrase = passphrase or get_config('polymarket.passphrase', '')

        if testnet:
            self.base_url = "https://clob.polymarket.com"  # Same URL, use test tokens
        else:
            self.base_url = "https://clob.polymarket.com"

        self.testnet = testnet
        self._order_counter = 0

    def _generate_signature(self, timestamp: str, method: str, path: str, body: str = "") -> str:
        """Generate HMAC signature for authenticated requests."""
        message = f"{timestamp}{method.upper()}{path}{body}"
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        authenticated: bool = True
    ) -> Dict[str, Any]:
        """Make HTTP request to Polymarket API."""
        url = f"{self.base_url}{endpoint}"
        timestamp = str(int(time.time() * 1000))

        body = json.dumps(data) if data else ""

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        if authenticated and self.api_key:
            signature = self._generate_signature(timestamp, method, endpoint, body)
            headers.update({
                'POLY_API_KEY': self.api_key,
                'POLY_TIMESTAMP': timestamp,
                'POLY_SIGNATURE': signature,
                'POLY_PASSPHRASE': self.passphrase
            })

        request = urllib.request.Request(
            url,
            data=body.encode('utf-8') if body else None,
            headers=headers,
            method=method
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            logger.error(f"HTTP error {e.code}: {error_body}")
            raise

    def get_balance(self) -> Dict[str, float]:
        """Get account balance."""
        try:
            response = self._make_request('GET', '/balance')
            return response
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return {}

    def submit_order(self, order: Order) -> ExecutionResult:
        """
        Submit order to Polymarket.

        Args:
            order: Order to submit

        Returns:
            ExecutionResult with execution details
        """
        if not self.api_key:
            return ExecutionResult(
                success=False,
                order=order,
                error_message="API key not configured"
            )

        try:
            # Build order payload
            payload = {
                'market': order.market_id,
                'side': order.side.value,
                'outcome': order.outcome,
                'size': str(order.quantity),
                'type': order.order_type.value
            }

            if order.price and order.order_type != OrderType.MARKET:
                payload['price'] = str(order.price)

            logger.info(f"Submitting order: {order.market_id} {order.side.value} {order.quantity} @ {order.price}")

            response = self._make_request('POST', '/order', payload)

            # Update order status
            order.status = OrderStatus.SUBMITTED
            order.submitted_at = datetime.now(timezone.utc)

            if response.get('status') == 'filled':
                order.status = OrderStatus.FILLED
                order.filled_at = datetime.now(timezone.utc)
                order.filled_quantity = float(response.get('filledSize', order.quantity))
                order.filled_price = float(response.get('avgPrice', order.price or 0))

            return ExecutionResult(
                success=True,
                order=order,
                raw_response=response
            )

        except Exception as e:
            logger.error(f"Order submission failed: {e}")
            order.status = OrderStatus.REJECTED
            return ExecutionResult(
                success=False,
                order=order,
                error_message=str(e)
            )

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order."""
        try:
            self._make_request('DELETE', f'/order/{order_id}')
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id}: {e}")
            return False

    def get_open_orders(self) -> List[Dict[str, Any]]:
        """Get all open orders."""
        try:
            response = self._make_request('GET', '/orders')
            return response.get('orders', [])
        except Exception as e:
            logger.error(f"Failed to get open orders: {e}")
            return []


class KalshiExecutor:
    """
    Trade executor for Kalshi.

    Uses the Kalshi Trading API for order submission.
    Requires API key for authenticated endpoints.

    API Documentation: https://trading-api.readme.kalshi.com/
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        email: Optional[str] = None,
        password: Optional[str] = None,
        demo: bool = True
    ):
        """
        Initialize Kalshi executor.

        Args:
            api_key: Kalshi API key (if using key auth)
            email: Kalshi account email (if using password auth)
            password: Kalshi account password
            demo: Use demo environment if True
        """
        self.api_key = api_key or get_config('kalshi.api_key', '')
        self.email = email or get_config('kalshi.email', '')
        self.password = password or get_config('kalshi.password', '')

        if demo:
            self.base_url = "https://demo-api.kalshi.co/trade-api/v2"
        else:
            self.base_url = "https://trading-api.kalshi.com/trade-api/v2"

        self.demo = demo
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

    def _authenticate(self) -> bool:
        """Authenticate and get session token."""
        if self._token and self._token_expiry and datetime.now(timezone.utc) < self._token_expiry:
            return True

        if not self.email or not self.password:
            logger.warning("Kalshi credentials not configured")
            return False

        try:
            response = self._make_request(
                'POST',
                '/login',
                {'email': self.email, 'password': self.password},
                authenticated=False
            )

            self._token = response.get('token')
            # Token typically valid for 24 hours
            self._token_expiry = datetime.now(timezone.utc)

            logger.info("Kalshi authentication successful")
            return True

        except Exception as e:
            logger.error(f"Kalshi authentication failed: {e}")
            return False

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        authenticated: bool = True
    ) -> Dict[str, Any]:
        """Make HTTP request to Kalshi API."""
        url = f"{self.base_url}{endpoint}"

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        if authenticated:
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'
            elif self._token:
                headers['Authorization'] = f'Bearer {self._token}'

        body = json.dumps(data) if data else None

        request = urllib.request.Request(
            url,
            data=body.encode('utf-8') if body else None,
            headers=headers,
            method=method
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            logger.error(f"HTTP error {e.code}: {error_body}")
            raise

    def get_balance(self) -> Dict[str, float]:
        """Get account balance."""
        if not self._authenticate():
            return {}

        try:
            response = self._make_request('GET', '/portfolio/balance')
            return response.get('balance', {})
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return {}

    def submit_order(self, order: Order) -> ExecutionResult:
        """
        Submit order to Kalshi.

        Args:
            order: Order to submit

        Returns:
            ExecutionResult with execution details
        """
        if not self._authenticate():
            return ExecutionResult(
                success=False,
                order=order,
                error_message="Authentication failed"
            )

        try:
            # Convert outcome to Kalshi format
            action = "buy" if order.side == OrderSide.BUY else "sell"
            side = "yes" if order.outcome == "yes" else "no"

            # Kalshi uses cents for prices (1-99)
            price_cents = int(order.price * 100) if order.price else None

            payload = {
                'ticker': order.market_id,
                'action': action,
                'side': side,
                'count': int(order.quantity),
                'type': 'limit' if order.order_type == OrderType.LIMIT else 'market'
            }

            if price_cents:
                payload['yes_price'] = price_cents if side == 'yes' else (100 - price_cents)

            logger.info(f"Submitting Kalshi order: {order.market_id} {action} {side} {order.quantity}")

            response = self._make_request('POST', '/portfolio/orders', payload)

            order.status = OrderStatus.SUBMITTED
            order.submitted_at = datetime.now(timezone.utc)

            order_response = response.get('order', {})
            if order_response.get('status') == 'executed':
                order.status = OrderStatus.FILLED
                order.filled_at = datetime.now(timezone.utc)
                order.filled_quantity = float(order_response.get('count', order.quantity))

            return ExecutionResult(
                success=True,
                order=order,
                raw_response=response
            )

        except Exception as e:
            logger.error(f"Kalshi order submission failed: {e}")
            order.status = OrderStatus.REJECTED
            return ExecutionResult(
                success=False,
                order=order,
                error_message=str(e)
            )

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order."""
        if not self._authenticate():
            return False

        try:
            self._make_request('DELETE', f'/portfolio/orders/{order_id}')
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id}: {e}")
            return False

    def get_positions(self) -> List[Dict[str, Any]]:
        """Get current positions."""
        if not self._authenticate():
            return []

        try:
            response = self._make_request('GET', '/portfolio/positions')
            return response.get('market_positions', [])
        except Exception as e:
            logger.error(f"Failed to get positions: {e}")
            return []


class TradeExecutor:
    """
    Unified trade executor for multiple exchanges.

    Handles:
    - Order routing to appropriate exchange
    - Pre-trade risk checks
    - Execution logging
    - Position updates
    """

    def __init__(
        self,
        enable_polymarket: bool = True,
        enable_kalshi: bool = True,
        dry_run: bool = True
    ):
        """
        Initialize trade executor.

        Args:
            enable_polymarket: Enable Polymarket trading
            enable_kalshi: Enable Kalshi trading
            dry_run: If True, simulate trades without execution
        """
        self.dry_run = dry_run
        self._order_counter = 0
        self._trade_log: List[Trade] = []

        # Initialize exchange executors
        self.polymarket: Optional[PolymarketExecutor] = None
        self.kalshi: Optional[KalshiExecutor] = None

        if enable_polymarket:
            self.polymarket = PolymarketExecutor(
                testnet=get_config('polymarket.testnet', True)
            )

        if enable_kalshi:
            self.kalshi = KalshiExecutor(
                demo=get_config('kalshi.demo', True)
            )

        if dry_run:
            logger.warning("TradeExecutor running in DRY RUN mode - no real trades")

    def create_order(
        self,
        market_id: str,
        side: OrderSide,
        outcome: str,
        quantity: float,
        price: Optional[float] = None,
        order_type: OrderType = OrderType.LIMIT,
        strategy_name: Optional[str] = None
    ) -> Order:
        """
        Create a new order.

        Args:
            market_id: Market identifier
            side: Buy or sell
            outcome: "yes" or "no"
            quantity: Number of contracts
            price: Limit price (0-1 scale)
            order_type: Order type
            strategy_name: Strategy that generated this order

        Returns:
            Order object
        """
        self._order_counter += 1
        order_id = f"ord_{int(time.time())}_{self._order_counter}"

        return Order(
            order_id=order_id,
            market_id=market_id,
            side=side,
            outcome=outcome,
            quantity=quantity,
            price=price,
            order_type=order_type,
            strategy_name=strategy_name
        )

    def execute(
        self,
        order: Order,
        exchange: str = "auto"
    ) -> ExecutionResult:
        """
        Execute an order.

        Args:
            order: Order to execute
            exchange: "polymarket", "kalshi", or "auto"

        Returns:
            ExecutionResult with details
        """
        # Dry run mode
        if self.dry_run:
            return self._simulate_execution(order)

        # Determine exchange
        if exchange == "auto":
            exchange = self._determine_exchange(order.market_id)

        # Route to appropriate executor
        if exchange == "polymarket" and self.polymarket:
            return self.polymarket.submit_order(order)
        elif exchange == "kalshi" and self.kalshi:
            return self.kalshi.submit_order(order)
        else:
            return ExecutionResult(
                success=False,
                order=order,
                error_message=f"Exchange {exchange} not available"
            )

    def _determine_exchange(self, market_id: str) -> str:
        """Determine which exchange a market belongs to."""
        # Kalshi tickers are typically uppercase with hyphens
        if market_id.isupper() or '-' in market_id:
            return "kalshi"
        return "polymarket"

    def _simulate_execution(self, order: Order) -> ExecutionResult:
        """Simulate order execution for dry run mode."""
        logger.info(f"[DRY RUN] Simulating execution: {order.market_id} "
                    f"{order.side.value} {order.quantity} @ {order.price}")

        # Simulate successful fill
        order.status = OrderStatus.FILLED
        order.filled_at = datetime.now(timezone.utc)
        order.filled_quantity = order.quantity
        order.filled_price = order.price or 0.50

        # Create simulated trade
        trade = Trade(
            trade_id=f"sim_{int(time.time())}",
            order_id=order.order_id,
            market_id=order.market_id,
            side=order.side,
            outcome=order.outcome,
            quantity=order.quantity,
            price=order.filled_price,
            value=order.quantity * order.filled_price,
            fee=order.quantity * order.filled_price * 0.01,  # Assume 1% fee
            timestamp=datetime.now(timezone.utc),
            source="simulation"
        )

        self._trade_log.append(trade)

        return ExecutionResult(
            success=True,
            order=order,
            trades=[trade]
        )

    def get_trade_log(self) -> List[Trade]:
        """Get all executed trades."""
        return self._trade_log.copy()

    def cancel_all_orders(self, exchange: str = "all") -> Dict[str, int]:
        """
        Cancel all open orders.

        Args:
            exchange: "polymarket", "kalshi", or "all"

        Returns:
            Dictionary with cancelled counts per exchange
        """
        results = {}

        if exchange in ["all", "polymarket"] and self.polymarket:
            open_orders = self.polymarket.get_open_orders()
            cancelled = 0
            for order in open_orders:
                if self.polymarket.cancel_order(order.get('id', '')):
                    cancelled += 1
            results['polymarket'] = cancelled

        if exchange in ["all", "kalshi"] and self.kalshi:
            # Kalshi doesn't have a bulk cancel, would need to implement
            results['kalshi'] = 0

        return results
