"""
Risk Management System.

Enforces trading limits and risk controls:
- Position size limits
- Daily loss limits
- Exposure limits
- Order validation

CRITICAL: These controls should NEVER be disabled in production.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config
from .executor import Order, OrderSide

logger = get_logger("risk_manager")


class RiskViolation(Enum):
    """Types of risk violations."""
    POSITION_SIZE_EXCEEDED = "position_size_exceeded"
    DAILY_LOSS_EXCEEDED = "daily_loss_exceeded"
    MAX_POSITIONS_EXCEEDED = "max_positions_exceeded"
    INSUFFICIENT_BALANCE = "insufficient_balance"
    MARKET_NOT_ALLOWED = "market_not_allowed"
    INVALID_PRICE = "invalid_price"
    CONCENTRATION_EXCEEDED = "concentration_exceeded"
    COOLDOWN_ACTIVE = "cooldown_active"


@dataclass
class RiskLimits:
    """Risk limit configuration."""
    # Position limits
    max_position_size: float = 1000.0  # Max $ per position
    max_position_pct: float = 0.10  # Max % of portfolio per position
    max_open_positions: int = 20  # Max concurrent positions

    # Loss limits
    max_daily_loss: float = 500.0  # Max daily loss in $
    max_daily_loss_pct: float = 0.05  # Max daily loss as % of portfolio
    max_drawdown_pct: float = 0.20  # Max drawdown before halt

    # Order limits
    min_order_size: float = 1.0  # Minimum order size in $
    max_order_size: float = 500.0  # Maximum single order in $

    # Concentration limits
    max_category_exposure: float = 0.30  # Max exposure to single category
    max_market_correlation: float = 0.70  # Max correlation between positions

    # Timing limits
    min_time_between_orders: int = 5  # Seconds between orders
    trading_hours_only: bool = False  # Restrict to market hours

    # Safety
    require_confirmation: bool = True  # Require confirm for large orders
    confirmation_threshold: float = 100.0  # $ threshold for confirmation

    @classmethod
    def conservative(cls) -> 'RiskLimits':
        """Conservative risk limits for cautious trading."""
        return cls(
            max_position_size=200.0,
            max_position_pct=0.05,
            max_open_positions=10,
            max_daily_loss=100.0,
            max_daily_loss_pct=0.02,
            max_order_size=100.0,
            require_confirmation=True,
            confirmation_threshold=50.0
        )

    @classmethod
    def moderate(cls) -> 'RiskLimits':
        """Moderate risk limits for balanced trading."""
        return cls(
            max_position_size=500.0,
            max_position_pct=0.08,
            max_open_positions=15,
            max_daily_loss=250.0,
            max_daily_loss_pct=0.03,
            max_order_size=200.0,
            require_confirmation=True,
            confirmation_threshold=100.0
        )

    @classmethod
    def aggressive(cls) -> 'RiskLimits':
        """Aggressive risk limits for active trading."""
        return cls(
            max_position_size=1000.0,
            max_position_pct=0.15,
            max_open_positions=25,
            max_daily_loss=500.0,
            max_daily_loss_pct=0.05,
            max_order_size=500.0,
            require_confirmation=False
        )


@dataclass
class RiskCheck:
    """Result of a risk check."""
    passed: bool
    order: Order
    violations: List[RiskViolation] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    adjusted_size: Optional[float] = None  # Suggested reduced size if too large
    details: Dict[str, Any] = field(default_factory=dict)

    @property
    def has_violations(self) -> bool:
        return len(self.violations) > 0

    @property
    def has_warnings(self) -> bool:
        return len(self.warnings) > 0

    def add_violation(self, violation: RiskViolation, detail: str = ""):
        """Add a risk violation."""
        self.violations.append(violation)
        self.passed = False
        if detail:
            self.details[violation.value] = detail

    def add_warning(self, warning: str):
        """Add a warning."""
        self.warnings.append(warning)


@dataclass
class DailyStats:
    """Daily trading statistics."""
    date: datetime
    total_trades: int = 0
    total_volume: float = 0.0
    realized_pnl: float = 0.0
    unrealized_pnl: float = 0.0
    max_drawdown: float = 0.0
    win_count: int = 0
    loss_count: int = 0


class RiskManager:
    """
    Risk management system for trading operations.

    Enforces:
    - Position size limits
    - Daily loss limits
    - Concentration limits
    - Order validation

    IMPORTANT: Do not bypass these checks in production!
    """

    def __init__(
        self,
        limits: Optional[RiskLimits] = None,
        initial_balance: float = 10000.0
    ):
        """
        Initialize risk manager.

        Args:
            limits: Risk limit configuration
            initial_balance: Starting account balance
        """
        self.limits = limits or RiskLimits()
        self.initial_balance = initial_balance
        self.current_balance = initial_balance

        # Tracking state
        self._positions: Dict[str, float] = {}  # market_id -> position value
        self._daily_stats: Dict[str, DailyStats] = {}
        self._last_order_time: Optional[datetime] = None
        self._halted: bool = False
        self._halt_reason: str = ""

        # Blocked markets (can add markets to avoid)
        self._blocked_markets: set = set()

    def check_order(self, order: Order) -> RiskCheck:
        """
        Check if an order passes all risk checks.

        Args:
            order: Order to validate

        Returns:
            RiskCheck with pass/fail and details
        """
        check = RiskCheck(passed=True, order=order)

        # Check if trading is halted
        if self._halted:
            check.add_violation(
                RiskViolation.COOLDOWN_ACTIVE,
                f"Trading halted: {self._halt_reason}"
            )
            return check

        # Check blocked markets
        if order.market_id in self._blocked_markets:
            check.add_violation(
                RiskViolation.MARKET_NOT_ALLOWED,
                f"Market {order.market_id} is blocked"
            )

        # Check order size
        order_value = order.quantity * (order.price or 0.50)
        self._check_order_size(check, order_value)

        # Check position limits
        self._check_position_limits(check, order)

        # Check daily loss limits
        self._check_daily_limits(check)

        # Check timing
        self._check_timing(check)

        # Check price validity
        self._check_price(check, order)

        # Add warnings for borderline cases
        self._add_warnings(check, order_value)

        return check

    def _check_order_size(self, check: RiskCheck, order_value: float):
        """Check order size limits."""
        if order_value < self.limits.min_order_size:
            check.add_violation(
                RiskViolation.POSITION_SIZE_EXCEEDED,
                f"Order value ${order_value:.2f} below minimum ${self.limits.min_order_size:.2f}"
            )

        if order_value > self.limits.max_order_size:
            check.add_violation(
                RiskViolation.POSITION_SIZE_EXCEEDED,
                f"Order value ${order_value:.2f} exceeds maximum ${self.limits.max_order_size:.2f}"
            )
            # Suggest reduced size
            check.adjusted_size = self.limits.max_order_size / (check.order.price or 0.50)

    def _check_position_limits(self, check: RiskCheck, order: Order):
        """Check position size and count limits."""
        order_value = order.quantity * (order.price or 0.50)

        # Check single position size
        current_position = self._positions.get(order.market_id, 0)
        new_position = current_position + order_value if order.side == OrderSide.BUY else current_position - order_value

        if abs(new_position) > self.limits.max_position_size:
            check.add_violation(
                RiskViolation.POSITION_SIZE_EXCEEDED,
                f"Position would be ${abs(new_position):.2f}, max is ${self.limits.max_position_size:.2f}"
            )

        # Check position as % of portfolio
        position_pct = abs(new_position) / self.current_balance if self.current_balance > 0 else 1.0
        if position_pct > self.limits.max_position_pct:
            check.add_violation(
                RiskViolation.POSITION_SIZE_EXCEEDED,
                f"Position would be {position_pct:.1%} of portfolio, max is {self.limits.max_position_pct:.1%}"
            )

        # Check position count
        if order.market_id not in self._positions and len(self._positions) >= self.limits.max_open_positions:
            check.add_violation(
                RiskViolation.MAX_POSITIONS_EXCEEDED,
                f"Already at max {self.limits.max_open_positions} positions"
            )

        # Check balance
        if order.side == OrderSide.BUY and order_value > self.current_balance:
            check.add_violation(
                RiskViolation.INSUFFICIENT_BALANCE,
                f"Order ${order_value:.2f} exceeds balance ${self.current_balance:.2f}"
            )

    def _check_daily_limits(self, check: RiskCheck):
        """Check daily loss limits."""
        today = datetime.now(timezone.utc).date().isoformat()

        if today in self._daily_stats:
            stats = self._daily_stats[today]
            total_pnl = stats.realized_pnl + stats.unrealized_pnl

            # Check daily loss
            if total_pnl < -self.limits.max_daily_loss:
                check.add_violation(
                    RiskViolation.DAILY_LOSS_EXCEEDED,
                    f"Daily loss ${abs(total_pnl):.2f} exceeds limit ${self.limits.max_daily_loss:.2f}"
                )

            # Check daily loss percentage
            loss_pct = abs(total_pnl) / self.initial_balance if self.initial_balance > 0 else 0
            if total_pnl < 0 and loss_pct > self.limits.max_daily_loss_pct:
                check.add_violation(
                    RiskViolation.DAILY_LOSS_EXCEEDED,
                    f"Daily loss {loss_pct:.1%} exceeds limit {self.limits.max_daily_loss_pct:.1%}"
                )

    def _check_timing(self, check: RiskCheck):
        """Check order timing limits."""
        if self._last_order_time:
            elapsed = (datetime.now(timezone.utc) - self._last_order_time).total_seconds()
            if elapsed < self.limits.min_time_between_orders:
                check.add_violation(
                    RiskViolation.COOLDOWN_ACTIVE,
                    f"Must wait {self.limits.min_time_between_orders - elapsed:.0f}s between orders"
                )

    def _check_price(self, check: RiskCheck, order: Order):
        """Check price validity."""
        if order.price is not None:
            if order.price < 0.01 or order.price > 0.99:
                check.add_violation(
                    RiskViolation.INVALID_PRICE,
                    f"Price {order.price:.2f} outside valid range [0.01, 0.99]"
                )

    def _add_warnings(self, check: RiskCheck, order_value: float):
        """Add warnings for borderline cases."""
        # Large order warning
        if order_value > self.limits.confirmation_threshold:
            check.add_warning(
                f"Large order: ${order_value:.2f} (requires confirmation)"
            )

        # High position concentration
        total_exposure = sum(self._positions.values())
        if total_exposure > 0:
            new_concentration = order_value / (total_exposure + order_value)
            if new_concentration > 0.25:
                check.add_warning(
                    f"High concentration: {new_concentration:.1%} of portfolio in single position"
                )

        # Near daily limit
        today = datetime.now(timezone.utc).date().isoformat()
        if today in self._daily_stats:
            remaining = self.limits.max_daily_loss + self._daily_stats[today].realized_pnl
            if remaining < self.limits.max_daily_loss * 0.2:
                check.add_warning(
                    f"Near daily loss limit: ${remaining:.2f} remaining"
                )

    def record_trade(
        self,
        market_id: str,
        side: OrderSide,
        quantity: float,
        price: float,
        pnl: float = 0.0
    ):
        """
        Record an executed trade.

        Args:
            market_id: Market identifier
            side: Buy or sell
            quantity: Quantity traded
            price: Execution price
            pnl: Realized P&L
        """
        self._last_order_time = datetime.now(timezone.utc)

        # Update position
        trade_value = quantity * price
        if side == OrderSide.BUY:
            self._positions[market_id] = self._positions.get(market_id, 0) + trade_value
        else:
            self._positions[market_id] = self._positions.get(market_id, 0) - trade_value

        # Clean up closed positions
        if market_id in self._positions and abs(self._positions[market_id]) < 0.01:
            del self._positions[market_id]

        # Update daily stats
        today = datetime.now(timezone.utc).date().isoformat()
        if today not in self._daily_stats:
            self._daily_stats[today] = DailyStats(date=datetime.now(timezone.utc))

        stats = self._daily_stats[today]
        stats.total_trades += 1
        stats.total_volume += trade_value
        stats.realized_pnl += pnl

        if pnl > 0:
            stats.win_count += 1
        elif pnl < 0:
            stats.loss_count += 1

        # Update balance
        self.current_balance += pnl

        # Check for halt conditions
        self._check_halt_conditions()

        logger.info(f"Recorded trade: {market_id} {side.value} {quantity} @ {price}, PnL: ${pnl:.2f}")

    def _check_halt_conditions(self):
        """Check if trading should be halted."""
        # Check drawdown
        drawdown_pct = (self.initial_balance - self.current_balance) / self.initial_balance
        if drawdown_pct > self.limits.max_drawdown_pct:
            self.halt_trading(f"Max drawdown exceeded: {drawdown_pct:.1%}")
            return

        # Check daily loss
        today = datetime.now(timezone.utc).date().isoformat()
        if today in self._daily_stats:
            if self._daily_stats[today].realized_pnl < -self.limits.max_daily_loss:
                self.halt_trading(f"Max daily loss exceeded")

    def halt_trading(self, reason: str):
        """Halt all trading."""
        self._halted = True
        self._halt_reason = reason
        logger.warning(f"TRADING HALTED: {reason}")

    def resume_trading(self):
        """Resume trading after halt."""
        self._halted = False
        self._halt_reason = ""
        logger.info("Trading resumed")

    def block_market(self, market_id: str):
        """Block a market from trading."""
        self._blocked_markets.add(market_id)
        logger.info(f"Blocked market: {market_id}")

    def unblock_market(self, market_id: str):
        """Unblock a market."""
        self._blocked_markets.discard(market_id)
        logger.info(f"Unblocked market: {market_id}")

    def get_status(self) -> Dict[str, Any]:
        """Get current risk status."""
        today = datetime.now(timezone.utc).date().isoformat()
        daily = self._daily_stats.get(today, DailyStats(date=datetime.now(timezone.utc)))

        return {
            'halted': self._halted,
            'halt_reason': self._halt_reason,
            'current_balance': self.current_balance,
            'initial_balance': self.initial_balance,
            'total_pnl': self.current_balance - self.initial_balance,
            'drawdown_pct': (self.initial_balance - self.current_balance) / self.initial_balance,
            'open_positions': len(self._positions),
            'total_exposure': sum(self._positions.values()),
            'daily_trades': daily.total_trades,
            'daily_pnl': daily.realized_pnl,
            'daily_volume': daily.total_volume,
            'blocked_markets': len(self._blocked_markets)
        }

    def get_positions(self) -> Dict[str, float]:
        """Get current positions."""
        return self._positions.copy()

    def reset_daily_stats(self):
        """Reset daily statistics (call at start of new trading day)."""
        today = datetime.now(timezone.utc).date().isoformat()
        self._daily_stats[today] = DailyStats(date=datetime.now(timezone.utc))
        logger.info("Daily stats reset")


def create_risk_manager(profile: str = "moderate") -> RiskManager:
    """
    Create risk manager with preset profile.

    Args:
        profile: "conservative", "moderate", or "aggressive"

    Returns:
        Configured RiskManager
    """
    initial_balance = get_config('trading.initial_balance', 10000.0)

    if profile == "conservative":
        limits = RiskLimits.conservative()
    elif profile == "aggressive":
        limits = RiskLimits.aggressive()
    else:
        limits = RiskLimits.moderate()

    return RiskManager(limits=limits, initial_balance=initial_balance)
