"""
Portfolio Optimizer with Kelly Criterion.

Provides optimal position sizing using Kelly criterion
and portfolio-level risk management.

KEY FEATURES:
- Full Kelly and fractional Kelly sizing
- Multi-position portfolio optimization
- Correlation-aware allocation
- Drawdown protection
- Risk limits enforcement
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import math
import json

from utils.logging_setup import get_logger

logger = get_logger("portfolio_optimizer")


@dataclass
class Position:
    """Represents a portfolio position."""
    position_id: str
    market_id: str
    market_name: str
    side: str  # YES or NO

    # Position details
    entry_price: float
    current_price: float
    shares: float
    cost_basis: float

    # Timing
    entry_time: datetime
    last_update: datetime

    # Expected outcome
    estimated_prob: float  # Our probability estimate
    market_prob: float     # Market-implied probability

    # Risk metrics
    max_loss: float = 0.0
    max_gain: float = 0.0
    current_pnl: float = 0.0
    pnl_percent: float = 0.0

    def __post_init__(self):
        self.calculate_metrics()

    def calculate_metrics(self):
        """Calculate position metrics."""
        # Cost basis
        self.cost_basis = self.entry_price * self.shares

        # Max outcomes
        if self.side == "YES":
            self.max_gain = (1.0 - self.entry_price) * self.shares
            self.max_loss = self.entry_price * self.shares
        else:
            self.max_gain = self.entry_price * self.shares
            self.max_loss = (1.0 - self.entry_price) * self.shares

        # Current P&L
        if self.side == "YES":
            self.current_pnl = (self.current_price - self.entry_price) * self.shares
        else:
            self.current_pnl = (self.entry_price - self.current_price) * self.shares

        self.pnl_percent = self.current_pnl / self.cost_basis if self.cost_basis > 0 else 0

    def update_price(self, new_price: float):
        """Update position with new market price."""
        self.current_price = new_price
        self.last_update = datetime.now(timezone.utc)
        self.calculate_metrics()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'position_id': self.position_id,
            'market_id': self.market_id,
            'market_name': self.market_name,
            'side': self.side,
            'entry_price': round(self.entry_price, 4),
            'current_price': round(self.current_price, 4),
            'shares': round(self.shares, 2),
            'cost_basis': round(self.cost_basis, 2),
            'entry_time': self.entry_time.isoformat(),
            'last_update': self.last_update.isoformat(),
            'estimated_prob': round(self.estimated_prob, 4),
            'market_prob': round(self.market_prob, 4),
            'max_loss': round(self.max_loss, 2),
            'max_gain': round(self.max_gain, 2),
            'current_pnl': round(self.current_pnl, 2),
            'pnl_percent': round(self.pnl_percent, 4)
        }


@dataclass
class PortfolioState:
    """Current portfolio state and metrics."""
    total_value: float = 0.0
    cash_balance: float = 0.0
    positions_value: float = 0.0

    # Performance
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0

    # Risk metrics
    total_exposure: float = 0.0
    max_drawdown: float = 0.0
    current_drawdown: float = 0.0
    sharpe_ratio: float = 0.0

    # Position stats
    num_positions: int = 0
    winning_positions: int = 0
    losing_positions: int = 0

    # High watermark
    high_watermark: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'total_value': round(self.total_value, 2),
            'cash_balance': round(self.cash_balance, 2),
            'positions_value': round(self.positions_value, 2),
            'total_pnl': round(self.total_pnl, 2),
            'total_pnl_percent': round(self.total_pnl_percent, 4),
            'unrealized_pnl': round(self.unrealized_pnl, 2),
            'realized_pnl': round(self.realized_pnl, 2),
            'total_exposure': round(self.total_exposure, 2),
            'max_drawdown': round(self.max_drawdown, 4),
            'current_drawdown': round(self.current_drawdown, 4),
            'num_positions': self.num_positions,
            'winning_positions': self.winning_positions,
            'losing_positions': self.losing_positions,
            'high_watermark': round(self.high_watermark, 2)
        }


def kelly_fraction(
    win_prob: float,
    win_payout: float,
    loss_payout: float = 1.0
) -> float:
    """
    Calculate Kelly criterion fraction.

    The Kelly criterion gives the optimal fraction of bankroll
    to bet for maximum long-term growth.

    Formula: f* = (p * b - q) / b
    where:
        p = probability of winning
        q = probability of losing (1 - p)
        b = odds (win_payout / loss_payout)

    Args:
        win_prob: Probability of winning (0-1)
        win_payout: Payout multiple if win (e.g., 2.0 for 2:1)
        loss_payout: Amount lost if lose (default 1.0 = full stake)

    Returns:
        Optimal fraction to bet (can be negative = don't bet)
    """
    if win_prob <= 0 or win_prob >= 1:
        return 0.0

    if win_payout <= 0:
        return 0.0

    q = 1.0 - win_prob
    b = win_payout / loss_payout

    kelly = (win_prob * b - q) / b

    return max(0.0, kelly)


def optimal_kelly_bet(
    bankroll: float,
    win_prob: float,
    current_price: float,
    kelly_multiplier: float = 0.25
) -> Tuple[float, float]:
    """
    Calculate optimal bet size for a prediction market.

    For binary markets:
    - Buying YES at price p pays (1-p)/p if YES wins
    - Buying NO at price p pays p/(1-p) if NO wins

    Args:
        bankroll: Total available capital
        win_prob: Estimated probability of YES outcome
        current_price: Current YES price (0-1)
        kelly_multiplier: Fraction of full Kelly to use (0.25 = quarter Kelly)

    Returns:
        Tuple of (bet_amount, suggested_side)
    """
    # Calculate edge for YES side
    yes_payout = (1.0 - current_price) / current_price if current_price > 0 else 0
    yes_kelly = kelly_fraction(win_prob, yes_payout)

    # Calculate edge for NO side
    no_prob = 1.0 - win_prob
    no_price = 1.0 - current_price
    no_payout = (1.0 - no_price) / no_price if no_price > 0 else 0
    no_kelly = kelly_fraction(no_prob, no_payout)

    # Choose better side
    if yes_kelly > no_kelly and yes_kelly > 0:
        bet_fraction = yes_kelly * kelly_multiplier
        bet_amount = bankroll * bet_fraction
        return (bet_amount, "YES")
    elif no_kelly > 0:
        bet_fraction = no_kelly * kelly_multiplier
        bet_amount = bankroll * bet_fraction
        return (bet_amount, "NO")
    else:
        return (0.0, "NONE")


class PortfolioOptimizer:
    """
    Portfolio optimization and management system.

    Features:
    - Kelly criterion position sizing
    - Portfolio-level allocation
    - Risk management and limits
    - Position tracking
    - Performance analytics
    """

    def __init__(
        self,
        initial_capital: float = 10000.0,
        kelly_fraction: float = 0.25,
        max_position_size: float = 0.20,
        max_portfolio_exposure: float = 0.80,
        max_correlation_group: float = 0.40,
        storage_path: Optional[str] = None
    ):
        """
        Initialize portfolio optimizer.

        Args:
            initial_capital: Starting capital
            kelly_fraction: Fraction of full Kelly to use (0.25 = quarter Kelly)
            max_position_size: Maximum single position as fraction of portfolio
            max_portfolio_exposure: Maximum total exposure
            max_correlation_group: Maximum exposure to correlated positions
            storage_path: Path for persistence
        """
        self.initial_capital = initial_capital
        self.kelly_fraction = kelly_fraction
        self.max_position_size = max_position_size
        self.max_portfolio_exposure = max_portfolio_exposure
        self.max_correlation_group = max_correlation_group
        self.storage_path = storage_path or "data/portfolio_state.json"

        # State
        self.cash_balance = initial_capital
        self.positions: Dict[str, Position] = {}
        self.closed_positions: List[Position] = []
        self.high_watermark = initial_capital
        self.value_history: List[Tuple[datetime, float]] = []

        # Correlation groups (markets that move together)
        self.correlation_groups: Dict[str, List[str]] = {}

        # Load existing state
        self._load_state()

    def _load_state(self):
        """Load portfolio state from disk."""
        try:
            path = Path(self.storage_path)
            if path.exists():
                with open(path, 'r') as f:
                    data = json.load(f)
                    self.cash_balance = data.get('cash_balance', self.initial_capital)
                    self.high_watermark = data.get('high_watermark', self.initial_capital)
                    # Load positions etc.
                logger.info("Loaded portfolio state")
        except Exception as e:
            logger.warning(f"Could not load state: {e}")

    def _save_state(self):
        """Save portfolio state to disk."""
        try:
            path = Path(self.storage_path)
            path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                'cash_balance': self.cash_balance,
                'high_watermark': self.high_watermark,
                'positions': [p.to_dict() for p in self.positions.values()],
                'last_updated': datetime.now(timezone.utc).isoformat()
            }

            with open(path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save state: {e}")

    def calculate_position_size(
        self,
        estimated_prob: float,
        market_price: float,
        market_id: str,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate optimal position size for an opportunity.

        Args:
            estimated_prob: Our probability estimate for YES
            market_price: Current YES market price
            market_id: Market identifier
            category: Category for correlation grouping

        Returns:
            Position sizing recommendation
        """
        # Get current portfolio value
        portfolio_value = self.get_portfolio_value()

        # Calculate Kelly-optimal bet
        bet_amount, suggested_side = optimal_kelly_bet(
            bankroll=portfolio_value,
            win_prob=estimated_prob,
            current_price=market_price,
            kelly_multiplier=self.kelly_fraction
        )

        if bet_amount <= 0:
            return {
                'recommended': False,
                'reason': 'No positive edge detected',
                'suggested_side': 'NONE',
                'bet_amount': 0,
                'kelly_fraction': 0
            }

        # Apply position size limit
        max_bet = portfolio_value * self.max_position_size
        constrained_bet = min(bet_amount, max_bet)

        # Check portfolio exposure limit
        current_exposure = self._calculate_exposure()
        remaining_capacity = (portfolio_value * self.max_portfolio_exposure) - current_exposure
        constrained_bet = min(constrained_bet, max(0, remaining_capacity))

        # Check correlation group limit
        if category:
            group_exposure = self._get_category_exposure(category)
            group_capacity = (portfolio_value * self.max_correlation_group) - group_exposure
            constrained_bet = min(constrained_bet, max(0, group_capacity))

        # Check available cash
        constrained_bet = min(constrained_bet, self.cash_balance)

        # Calculate shares
        price = market_price if suggested_side == "YES" else (1.0 - market_price)
        shares = constrained_bet / price if price > 0 else 0

        # Calculate expected value
        if suggested_side == "YES":
            ev = estimated_prob * (1.0 - market_price) - (1 - estimated_prob) * market_price
        else:
            ev = (1 - estimated_prob) * market_price - estimated_prob * (1.0 - market_price)

        return {
            'recommended': constrained_bet > 0,
            'suggested_side': suggested_side,
            'bet_amount': round(constrained_bet, 2),
            'shares': round(shares, 2),
            'entry_price': round(price, 4),
            'kelly_fraction': round(bet_amount / portfolio_value, 4) if portfolio_value > 0 else 0,
            'constrained_fraction': round(constrained_bet / portfolio_value, 4) if portfolio_value > 0 else 0,
            'expected_value': round(ev, 4),
            'max_loss': round(constrained_bet, 2),
            'max_gain': round(constrained_bet * ((1.0 - price) / price), 2) if price > 0 else 0,
            'constraints_applied': {
                'position_size_limit': bet_amount > max_bet,
                'exposure_limit': remaining_capacity < bet_amount,
                'correlation_limit': category is not None and group_capacity < bet_amount,
                'cash_limit': constrained_bet < bet_amount
            }
        }

    def open_position(
        self,
        market_id: str,
        market_name: str,
        side: str,
        shares: float,
        entry_price: float,
        estimated_prob: float,
        position_id: Optional[str] = None
    ) -> Position:
        """
        Open a new position.

        Args:
            market_id: Market identifier
            market_name: Human-readable name
            side: YES or NO
            shares: Number of shares
            entry_price: Entry price per share
            estimated_prob: Our probability estimate
            position_id: Optional position ID

        Returns:
            The opened position
        """
        cost = shares * entry_price

        if cost > self.cash_balance:
            raise ValueError(f"Insufficient funds: need {cost}, have {self.cash_balance}")

        now = datetime.now(timezone.utc)
        pos_id = position_id or f"{market_id}_{now.timestamp()}"

        position = Position(
            position_id=pos_id,
            market_id=market_id,
            market_name=market_name,
            side=side,
            entry_price=entry_price,
            current_price=entry_price,
            shares=shares,
            cost_basis=cost,
            entry_time=now,
            last_update=now,
            estimated_prob=estimated_prob,
            market_prob=entry_price if side == "YES" else (1 - entry_price)
        )

        self.positions[pos_id] = position
        self.cash_balance -= cost

        self._save_state()
        logger.info(f"Opened position {pos_id}: {shares} {side} @ {entry_price}")

        return position

    def close_position(
        self,
        position_id: str,
        exit_price: float,
        resolved: bool = False
    ) -> Dict[str, Any]:
        """
        Close an existing position.

        Args:
            position_id: Position to close
            exit_price: Exit price
            resolved: Whether market resolved (vs sold early)

        Returns:
            Close result with P&L
        """
        if position_id not in self.positions:
            raise ValueError(f"Position not found: {position_id}")

        position = self.positions[position_id]

        # Calculate proceeds
        if resolved:
            # Market resolved to YES (1) or NO (0)
            if position.side == "YES":
                proceeds = position.shares if exit_price > 0.5 else 0
            else:
                proceeds = position.shares if exit_price < 0.5 else 0
        else:
            # Sold on market
            proceeds = position.shares * exit_price

        pnl = proceeds - position.cost_basis
        pnl_percent = pnl / position.cost_basis if position.cost_basis > 0 else 0

        # Update cash
        self.cash_balance += proceeds

        # Move to closed positions
        self.closed_positions.append(position)
        del self.positions[position_id]

        # Update high watermark
        portfolio_value = self.get_portfolio_value()
        if portfolio_value > self.high_watermark:
            self.high_watermark = portfolio_value

        self._save_state()
        logger.info(f"Closed position {position_id}: P&L = {pnl:.2f} ({pnl_percent:.1%})")

        return {
            'position_id': position_id,
            'exit_price': exit_price,
            'proceeds': round(proceeds, 2),
            'pnl': round(pnl, 2),
            'pnl_percent': round(pnl_percent, 4),
            'resolved': resolved
        }

    def get_portfolio_value(self) -> float:
        """Get total portfolio value."""
        positions_value = sum(
            p.shares * p.current_price
            for p in self.positions.values()
        )
        return self.cash_balance + positions_value

    def get_portfolio_state(self) -> PortfolioState:
        """Get current portfolio state and metrics."""
        state = PortfolioState()

        # Values
        state.cash_balance = self.cash_balance
        state.positions_value = sum(
            p.shares * p.current_price
            for p in self.positions.values()
        )
        state.total_value = state.cash_balance + state.positions_value

        # P&L
        state.unrealized_pnl = sum(p.current_pnl for p in self.positions.values())
        state.realized_pnl = sum(
            p.current_pnl for p in self.closed_positions
        )
        state.total_pnl = state.total_value - self.initial_capital
        state.total_pnl_percent = state.total_pnl / self.initial_capital if self.initial_capital > 0 else 0

        # Risk
        state.total_exposure = self._calculate_exposure()
        state.high_watermark = self.high_watermark

        if self.high_watermark > 0:
            state.current_drawdown = (self.high_watermark - state.total_value) / self.high_watermark

        # Position stats
        state.num_positions = len(self.positions)
        state.winning_positions = sum(1 for p in self.positions.values() if p.current_pnl > 0)
        state.losing_positions = sum(1 for p in self.positions.values() if p.current_pnl < 0)

        return state

    def _calculate_exposure(self) -> float:
        """Calculate total portfolio exposure."""
        return sum(p.cost_basis for p in self.positions.values())

    def _get_category_exposure(self, category: str) -> float:
        """Get exposure to a specific category/correlation group."""
        if category not in self.correlation_groups:
            return 0.0

        market_ids = self.correlation_groups[category]
        return sum(
            p.cost_basis for p in self.positions.values()
            if p.market_id in market_ids
        )

    def add_to_correlation_group(self, group_name: str, market_id: str):
        """Add a market to a correlation group."""
        if group_name not in self.correlation_groups:
            self.correlation_groups[group_name] = []

        if market_id not in self.correlation_groups[group_name]:
            self.correlation_groups[group_name].append(market_id)

    def update_prices(self, prices: Dict[str, float]):
        """
        Update position prices from market data.

        Args:
            prices: Dict of market_id to current YES price
        """
        for position in self.positions.values():
            if position.market_id in prices:
                new_price = prices[position.market_id]
                if position.side == "NO":
                    new_price = 1.0 - new_price
                position.update_price(new_price)

        # Record value history
        self.value_history.append(
            (datetime.now(timezone.utc), self.get_portfolio_value())
        )

        # Update high watermark
        current_value = self.get_portfolio_value()
        if current_value > self.high_watermark:
            self.high_watermark = current_value

    def get_allocation_recommendations(
        self,
        opportunities: List[Dict[str, Any]],
        max_new_positions: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get position sizing recommendations for opportunities.

        Args:
            opportunities: List of opportunity dicts with estimated_prob, market_price, market_id
            max_new_positions: Maximum new positions to recommend

        Returns:
            List of sizing recommendations sorted by expected value
        """
        recommendations = []

        for opp in opportunities:
            sizing = self.calculate_position_size(
                estimated_prob=opp.get('estimated_prob', 0.5),
                market_price=opp.get('market_price', opp.get('current_price', 0.5)),
                market_id=opp.get('market_id', ''),
                category=opp.get('category')
            )

            if sizing['recommended']:
                recommendations.append({
                    **opp,
                    **sizing
                })

        # Sort by expected value
        recommendations.sort(key=lambda x: x.get('expected_value', 0), reverse=True)

        return recommendations[:max_new_positions]

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive portfolio report."""
        state = self.get_portfolio_state()

        return {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'summary': state.to_dict(),
            'positions': [p.to_dict() for p in self.positions.values()],
            'closed_positions_count': len(self.closed_positions),
            'configuration': {
                'initial_capital': self.initial_capital,
                'kelly_fraction': self.kelly_fraction,
                'max_position_size': self.max_position_size,
                'max_portfolio_exposure': self.max_portfolio_exposure
            },
            'risk_metrics': {
                'current_exposure': self._calculate_exposure(),
                'exposure_utilization': self._calculate_exposure() / (self.get_portfolio_value() * self.max_portfolio_exposure) if self.get_portfolio_value() > 0 else 0,
                'position_concentration': max([p.cost_basis for p in self.positions.values()], default=0) / self.get_portfolio_value() if self.get_portfolio_value() > 0 else 0
            }
        }


def create_portfolio_optimizer(
    initial_capital: float = 10000.0,
    kelly_fraction: float = 0.25,
    storage_path: Optional[str] = None
) -> PortfolioOptimizer:
    """
    Create a portfolio optimizer instance.

    Args:
        initial_capital: Starting capital
        kelly_fraction: Fraction of Kelly to use
        storage_path: Optional path for persistence

    Returns:
        Configured PortfolioOptimizer
    """
    return PortfolioOptimizer(
        initial_capital=initial_capital,
        kelly_fraction=kelly_fraction,
        storage_path=storage_path
    )
