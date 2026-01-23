"""
Position Tracking System.

Tracks:
- Open positions across markets
- P&L calculations
- Portfolio analytics
- Trade history
"""

import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config
from engine.data_ingestion.models import MarketSource
from .executor import Trade, OrderSide

logger = get_logger("position_tracker")


@dataclass
class Position:
    """Single market position."""
    market_id: str
    market_name: str
    source: MarketSource
    outcome: str  # "yes" or "no"

    # Position details
    quantity: float = 0.0
    avg_entry_price: float = 0.0
    current_price: float = 0.0

    # P&L
    cost_basis: float = 0.0
    market_value: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0

    # Tracking
    opened_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    trade_count: int = 0

    @property
    def total_pnl(self) -> float:
        """Total P&L (realized + unrealized)."""
        return self.realized_pnl + self.unrealized_pnl

    @property
    def return_pct(self) -> float:
        """Return percentage."""
        if self.cost_basis == 0:
            return 0.0
        return self.total_pnl / self.cost_basis

    def update_price(self, new_price: float):
        """Update current price and recalculate P&L."""
        self.current_price = new_price
        self.market_value = self.quantity * new_price
        self.unrealized_pnl = self.market_value - self.cost_basis
        self.last_updated = datetime.now(timezone.utc)

    def add_trade(self, quantity: float, price: float, side: OrderSide):
        """
        Add a trade to this position.

        Args:
            quantity: Trade quantity
            price: Trade price
            side: Buy or sell
        """
        if side == OrderSide.BUY:
            # Adding to position
            new_quantity = self.quantity + quantity
            if new_quantity > 0:
                # Update average entry price
                self.avg_entry_price = (
                    (self.quantity * self.avg_entry_price + quantity * price)
                    / new_quantity
                )
            self.quantity = new_quantity
            self.cost_basis += quantity * price

        else:
            # Reducing position
            if quantity <= self.quantity:
                # Calculate realized P&L
                realized = quantity * (price - self.avg_entry_price)
                self.realized_pnl += realized
                self.quantity -= quantity
                self.cost_basis -= quantity * self.avg_entry_price
            else:
                # Closing and reversing (simplified: just close)
                self.realized_pnl += self.quantity * (price - self.avg_entry_price)
                self.quantity = 0
                self.cost_basis = 0

        self.trade_count += 1
        self.last_updated = datetime.now(timezone.utc)

        # Update market value
        self.market_value = self.quantity * self.current_price
        self.unrealized_pnl = self.market_value - self.cost_basis

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'market_id': self.market_id,
            'market_name': self.market_name,
            'source': self.source.value,
            'outcome': self.outcome,
            'quantity': self.quantity,
            'avg_entry_price': self.avg_entry_price,
            'current_price': self.current_price,
            'cost_basis': self.cost_basis,
            'market_value': self.market_value,
            'unrealized_pnl': self.unrealized_pnl,
            'realized_pnl': self.realized_pnl,
            'total_pnl': self.total_pnl,
            'return_pct': self.return_pct,
            'opened_at': self.opened_at.isoformat(),
            'last_updated': self.last_updated.isoformat(),
            'trade_count': self.trade_count
        }


@dataclass
class PortfolioSummary:
    """Portfolio summary statistics."""
    timestamp: datetime
    total_value: float
    cash_balance: float
    positions_value: float
    total_pnl: float
    realized_pnl: float
    unrealized_pnl: float
    return_pct: float
    position_count: int
    winning_positions: int
    losing_positions: int

    # Risk metrics
    largest_position: float
    largest_position_pct: float
    concentration_score: float  # 0-1, higher = more concentrated

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'total_value': self.total_value,
            'cash_balance': self.cash_balance,
            'positions_value': self.positions_value,
            'total_pnl': self.total_pnl,
            'realized_pnl': self.realized_pnl,
            'unrealized_pnl': self.unrealized_pnl,
            'return_pct': self.return_pct,
            'position_count': self.position_count,
            'winning_positions': self.winning_positions,
            'losing_positions': self.losing_positions,
            'largest_position': self.largest_position,
            'largest_position_pct': self.largest_position_pct,
            'concentration_score': self.concentration_score
        }


class PositionTracker:
    """
    Tracks all trading positions and portfolio state.

    Features:
    - Real-time position tracking
    - P&L calculation
    - Portfolio analytics
    - Trade history
    - State persistence
    """

    def __init__(
        self,
        initial_balance: float = 10000.0,
        state_file: Optional[str] = None
    ):
        """
        Initialize position tracker.

        Args:
            initial_balance: Starting cash balance
            state_file: Path for state persistence
        """
        self.initial_balance = initial_balance
        self.cash_balance = initial_balance

        self.positions: Dict[str, Position] = {}
        self.closed_positions: List[Position] = []
        self.trade_history: List[Trade] = []

        if state_file:
            self.state_file = Path(state_file)
        else:
            self.state_file = Path(get_config(
                'trading.state_file',
                'data/trading_state.json'
            ))

        # Load existing state if available
        self.load_state()

    def open_position(
        self,
        market_id: str,
        market_name: str,
        source: MarketSource,
        outcome: str,
        quantity: float,
        price: float
    ) -> Position:
        """
        Open or add to a position.

        Args:
            market_id: Market identifier
            market_name: Human-readable market name
            source: Data source (Polymarket/Kalshi)
            outcome: "yes" or "no"
            quantity: Quantity to buy
            price: Entry price

        Returns:
            Updated Position
        """
        key = f"{market_id}_{outcome}"

        if key in self.positions:
            # Add to existing position
            position = self.positions[key]
            position.add_trade(quantity, price, OrderSide.BUY)
        else:
            # Create new position
            position = Position(
                market_id=market_id,
                market_name=market_name,
                source=source,
                outcome=outcome,
                quantity=quantity,
                avg_entry_price=price,
                current_price=price,
                cost_basis=quantity * price,
                market_value=quantity * price
            )
            self.positions[key] = position

        # Update cash
        cost = quantity * price
        self.cash_balance -= cost

        logger.info(f"Position opened: {market_name} {outcome} {quantity} @ {price:.2f}")

        self.save_state()
        return position

    def close_position(
        self,
        market_id: str,
        outcome: str,
        quantity: Optional[float] = None,
        price: Optional[float] = None
    ) -> Optional[float]:
        """
        Close or reduce a position.

        Args:
            market_id: Market identifier
            outcome: "yes" or "no"
            quantity: Quantity to close (None = close all)
            price: Exit price (None = use current price)

        Returns:
            Realized P&L or None if position not found
        """
        key = f"{market_id}_{outcome}"

        if key not in self.positions:
            logger.warning(f"Position not found: {key}")
            return None

        position = self.positions[key]
        close_qty = quantity or position.quantity
        close_price = price or position.current_price

        # Calculate P&L before closing
        pnl = close_qty * (close_price - position.avg_entry_price)

        # Update position
        position.add_trade(close_qty, close_price, OrderSide.SELL)

        # Update cash
        self.cash_balance += close_qty * close_price

        # Remove closed position
        if position.quantity <= 0:
            self.closed_positions.append(position)
            del self.positions[key]
            logger.info(f"Position closed: {position.market_name} {outcome}, P&L: ${pnl:.2f}")
        else:
            logger.info(f"Position reduced: {position.market_name} {outcome}, P&L: ${pnl:.2f}")

        self.save_state()
        return pnl

    def record_trade(self, trade: Trade):
        """Record a trade in history."""
        self.trade_history.append(trade)

        # Update position
        key = f"{trade.market_id}_{trade.outcome}"

        if key in self.positions:
            self.positions[key].add_trade(
                trade.quantity,
                trade.price,
                trade.side
            )

        self.save_state()

    def update_prices(self, prices: Dict[str, float]):
        """
        Update current prices for all positions.

        Args:
            prices: Dictionary of market_id -> current_price
        """
        for key, position in self.positions.items():
            market_id = position.market_id
            if market_id in prices:
                position.update_price(prices[market_id])

    def get_position(self, market_id: str, outcome: str) -> Optional[Position]:
        """Get a specific position."""
        key = f"{market_id}_{outcome}"
        return self.positions.get(key)

    def get_all_positions(self) -> List[Position]:
        """Get all open positions."""
        return list(self.positions.values())

    def get_portfolio_summary(self) -> PortfolioSummary:
        """
        Get current portfolio summary.

        Returns:
            PortfolioSummary with current statistics
        """
        positions_value = sum(p.market_value for p in self.positions.values())
        total_value = self.cash_balance + positions_value

        realized_pnl = sum(p.realized_pnl for p in self.positions.values())
        realized_pnl += sum(p.realized_pnl for p in self.closed_positions)

        unrealized_pnl = sum(p.unrealized_pnl for p in self.positions.values())
        total_pnl = realized_pnl + unrealized_pnl

        return_pct = total_pnl / self.initial_balance if self.initial_balance > 0 else 0

        winning = sum(1 for p in self.positions.values() if p.unrealized_pnl > 0)
        losing = sum(1 for p in self.positions.values() if p.unrealized_pnl < 0)

        # Calculate concentration
        largest_position = max(
            (p.market_value for p in self.positions.values()),
            default=0
        )
        largest_pct = largest_position / total_value if total_value > 0 else 0

        # Herfindahl index for concentration
        if total_value > 0 and len(self.positions) > 0:
            weights = [p.market_value / total_value for p in self.positions.values()]
            concentration = sum(w ** 2 for w in weights)
        else:
            concentration = 0

        return PortfolioSummary(
            timestamp=datetime.now(timezone.utc),
            total_value=total_value,
            cash_balance=self.cash_balance,
            positions_value=positions_value,
            total_pnl=total_pnl,
            realized_pnl=realized_pnl,
            unrealized_pnl=unrealized_pnl,
            return_pct=return_pct,
            position_count=len(self.positions),
            winning_positions=winning,
            losing_positions=losing,
            largest_position=largest_position,
            largest_position_pct=largest_pct,
            concentration_score=concentration
        )

    def get_pnl_by_market(self) -> Dict[str, float]:
        """Get P&L breakdown by market."""
        pnl = {}

        for position in self.positions.values():
            pnl[position.market_id] = position.total_pnl

        for position in self.closed_positions:
            if position.market_id in pnl:
                pnl[position.market_id] += position.realized_pnl
            else:
                pnl[position.market_id] = position.realized_pnl

        return pnl

    def get_pnl_by_strategy(self) -> Dict[str, float]:
        """Get P&L breakdown by strategy (from trade history)."""
        pnl = {}

        # Would need strategy tracking in trades
        # For now, return empty
        return pnl

    def save_state(self):
        """Save current state to file."""
        state = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'initial_balance': self.initial_balance,
            'cash_balance': self.cash_balance,
            'positions': {
                k: v.to_dict() for k, v in self.positions.items()
            },
            'closed_positions': [p.to_dict() for p in self.closed_positions[-100:]],  # Keep last 100
            'trade_count': len(self.trade_history)
        }

        self.state_file.parent.mkdir(parents=True, exist_ok=True)

        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)

    def load_state(self):
        """Load state from file."""
        if not self.state_file.exists():
            return

        try:
            with open(self.state_file) as f:
                state = json.load(f)

            self.initial_balance = state.get('initial_balance', self.initial_balance)
            self.cash_balance = state.get('cash_balance', self.cash_balance)

            # Restore positions
            for key, pos_dict in state.get('positions', {}).items():
                self.positions[key] = Position(
                    market_id=pos_dict['market_id'],
                    market_name=pos_dict['market_name'],
                    source=MarketSource(pos_dict['source']),
                    outcome=pos_dict['outcome'],
                    quantity=pos_dict['quantity'],
                    avg_entry_price=pos_dict['avg_entry_price'],
                    current_price=pos_dict['current_price'],
                    cost_basis=pos_dict['cost_basis'],
                    market_value=pos_dict['market_value'],
                    unrealized_pnl=pos_dict['unrealized_pnl'],
                    realized_pnl=pos_dict['realized_pnl'],
                    opened_at=datetime.fromisoformat(pos_dict['opened_at']),
                    last_updated=datetime.fromisoformat(pos_dict['last_updated']),
                    trade_count=pos_dict['trade_count']
                )

            logger.info(f"Loaded state: {len(self.positions)} positions, ${self.cash_balance:.2f} cash")

        except Exception as e:
            logger.error(f"Failed to load state: {e}")

    def reset(self):
        """Reset tracker to initial state."""
        self.cash_balance = self.initial_balance
        self.positions.clear()
        self.closed_positions.clear()
        self.trade_history.clear()
        self.save_state()
        logger.info("Position tracker reset")

    def print_summary(self):
        """Print portfolio summary to console."""
        summary = self.get_portfolio_summary()

        print("\n" + "=" * 60)
        print("PORTFOLIO SUMMARY")
        print("=" * 60)
        print(f"Total Value: ${summary.total_value:,.2f}")
        print(f"Cash Balance: ${summary.cash_balance:,.2f}")
        print(f"Positions Value: ${summary.positions_value:,.2f}")
        print(f"\nTotal P&L: ${summary.total_pnl:,.2f} ({summary.return_pct:+.1%})")
        print(f"  Realized: ${summary.realized_pnl:,.2f}")
        print(f"  Unrealized: ${summary.unrealized_pnl:,.2f}")
        print(f"\nPositions: {summary.position_count}")
        print(f"  Winning: {summary.winning_positions}")
        print(f"  Losing: {summary.losing_positions}")
        print(f"\nConcentration: {summary.concentration_score:.2f}")
        print(f"Largest Position: ${summary.largest_position:,.2f} ({summary.largest_position_pct:.1%})")
        print("=" * 60 + "\n")

        if self.positions:
            print("OPEN POSITIONS:")
            print("-" * 60)
            for position in self.positions.values():
                pnl_str = f"${position.total_pnl:+,.2f}" if position.total_pnl >= 0 else f"-${abs(position.total_pnl):,.2f}"
                print(f"  {position.market_name[:40]}")
                print(f"    {position.outcome.upper()}: {position.quantity:.0f} @ ${position.avg_entry_price:.2f} | P&L: {pnl_str}")
            print()
