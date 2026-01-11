"""
Data models for prediction market data.

These dataclasses define the structure of all market data flowing through
the platform. They provide type safety and clear documentation of data fields.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class MarketSource(Enum):
    """Supported prediction market platforms."""
    POLYMARKET = "polymarket"
    KALSHI = "kalshi"
    PREDICTIT = "predictit"
    METACULUS = "metaculus"


class MarketStatus(Enum):
    """Market lifecycle status."""
    ACTIVE = "active"
    CLOSED = "closed"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class OutcomeResult(Enum):
    """Resolution outcome."""
    YES = "yes"
    NO = "no"
    PARTIAL = "partial"
    CANCELLED = "cancelled"
    PENDING = "pending"


@dataclass
class OrderBookLevel:
    """Single level in an order book."""
    price: float  # 0-1 for probability
    size: float   # Size in base currency (USD)

    @property
    def implied_prob(self) -> float:
        return self.price


@dataclass
class OrderBook:
    """
    Full order book snapshot for a market.

    The order book reveals crucial structural information:
    - Liquidity depth at various price levels
    - Bid-ask spread (transaction cost)
    - Order imbalance (directional pressure)
    """
    market_id: str
    timestamp: datetime
    bids: List[OrderBookLevel]  # Sorted descending by price
    asks: List[OrderBookLevel]  # Sorted ascending by price

    @property
    def best_bid(self) -> Optional[float]:
        """Best (highest) bid price."""
        return self.bids[0].price if self.bids else None

    @property
    def best_ask(self) -> Optional[float]:
        """Best (lowest) ask price."""
        return self.asks[0].price if self.asks else None

    @property
    def mid_price(self) -> Optional[float]:
        """Mid-market price."""
        if self.best_bid is not None and self.best_ask is not None:
            return (self.best_bid + self.best_ask) / 2
        return None

    @property
    def spread(self) -> Optional[float]:
        """Bid-ask spread."""
        if self.best_bid is not None and self.best_ask is not None:
            return self.best_ask - self.best_bid
        return None

    @property
    def spread_percentage(self) -> Optional[float]:
        """Spread as percentage of mid price."""
        if self.mid_price and self.spread:
            return self.spread / self.mid_price
        return None

    @property
    def bid_liquidity(self) -> float:
        """Total liquidity on bid side."""
        return sum(level.size for level in self.bids)

    @property
    def ask_liquidity(self) -> float:
        """Total liquidity on ask side."""
        return sum(level.size for level in self.asks)

    @property
    def total_liquidity(self) -> float:
        """Total order book liquidity."""
        return self.bid_liquidity + self.ask_liquidity

    @property
    def order_imbalance(self) -> float:
        """
        Order book imbalance ratio.

        Positive = more bids (buying pressure)
        Negative = more asks (selling pressure)
        Range: -1 to 1
        """
        total = self.total_liquidity
        if total == 0:
            return 0
        return (self.bid_liquidity - self.ask_liquidity) / total

    def liquidity_at_price(self, price: float, tolerance: float = 0.01) -> float:
        """Get liquidity within tolerance of a price level."""
        liquidity = 0
        for level in self.bids + self.asks:
            if abs(level.price - price) <= tolerance:
                liquidity += level.size
        return liquidity


@dataclass
class MarketSnapshot:
    """
    Point-in-time snapshot of a prediction market.

    This is the core data structure for all analysis. Each snapshot
    captures the complete state of a market at a specific moment.
    """
    # Identifiers
    market_id: str
    source: MarketSource
    timestamp: datetime

    # Market metadata
    question: str
    description: str
    category: str
    tags: List[str] = field(default_factory=list)

    # Timing
    created_at: Optional[datetime] = None
    close_time: Optional[datetime] = None
    resolution_time: Optional[datetime] = None

    # Status
    status: MarketStatus = MarketStatus.ACTIVE
    outcome: OutcomeResult = OutcomeResult.PENDING

    # Pricing (all 0-1 scale)
    yes_price: float = 0.5
    no_price: float = 0.5
    last_trade_price: Optional[float] = None

    # Volume and liquidity
    volume_24h: float = 0.0
    total_volume: float = 0.0
    open_interest: float = 0.0
    liquidity: float = 0.0

    # Order book summary (detailed book stored separately)
    best_bid: Optional[float] = None
    best_ask: Optional[float] = None
    spread: Optional[float] = None

    # Additional metadata
    num_traders: int = 0
    comments_count: int = 0

    # Raw response (for debugging)
    raw_data: Optional[Dict[str, Any]] = None

    @property
    def mid_price(self) -> float:
        """Mid-market probability estimate."""
        if self.best_bid is not None and self.best_ask is not None:
            return (self.best_bid + self.best_ask) / 2
        return self.yes_price

    @property
    def hours_to_close(self) -> Optional[float]:
        """Hours until market closes."""
        if self.close_time is None:
            return None
        delta = self.close_time - datetime.utcnow()
        return max(0, delta.total_seconds() / 3600)

    @property
    def hours_to_resolution(self) -> Optional[float]:
        """Hours until expected resolution."""
        if self.resolution_time is None:
            return self.hours_to_close
        delta = self.resolution_time - datetime.utcnow()
        return max(0, delta.total_seconds() / 3600)

    @property
    def is_near_resolution(self) -> bool:
        """True if market resolves within 24 hours."""
        hours = self.hours_to_resolution
        return hours is not None and hours < 24

    @property
    def implied_vig(self) -> float:
        """Implied vigorish from yes/no prices."""
        return (self.yes_price + self.no_price) - 1

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            'market_id': self.market_id,
            'source': self.source.value,
            'timestamp': self.timestamp.isoformat(),
            'question': self.question,
            'description': self.description,
            'category': self.category,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'close_time': self.close_time.isoformat() if self.close_time else None,
            'resolution_time': self.resolution_time.isoformat() if self.resolution_time else None,
            'status': self.status.value,
            'outcome': self.outcome.value,
            'yes_price': self.yes_price,
            'no_price': self.no_price,
            'last_trade_price': self.last_trade_price,
            'volume_24h': self.volume_24h,
            'total_volume': self.total_volume,
            'open_interest': self.open_interest,
            'liquidity': self.liquidity,
            'best_bid': self.best_bid,
            'best_ask': self.best_ask,
            'spread': self.spread,
            'num_traders': self.num_traders,
            'comments_count': self.comments_count,
        }


@dataclass
class PriceHistory:
    """
    Historical price series for a market.

    Used for backtesting and temporal pattern analysis.
    """
    market_id: str
    source: MarketSource
    timestamps: List[datetime]
    prices: List[float]  # Mid prices
    volumes: List[float]  # Volume at each timestamp
    bids: Optional[List[float]] = None
    asks: Optional[List[float]] = None

    def __len__(self) -> int:
        return len(self.timestamps)

    @property
    def returns(self) -> List[float]:
        """Calculate price returns."""
        if len(self.prices) < 2:
            return []
        returns = []
        for i in range(1, len(self.prices)):
            if self.prices[i - 1] > 0:
                ret = (self.prices[i] - self.prices[i - 1]) / self.prices[i - 1]
                returns.append(ret)
            else:
                returns.append(0)
        return returns

    @property
    def volatility(self) -> float:
        """Calculate historical volatility."""
        rets = self.returns
        if not rets:
            return 0
        mean = sum(rets) / len(rets)
        variance = sum((r - mean) ** 2 for r in rets) / len(rets)
        return variance ** 0.5

    def price_at(self, timestamp: datetime) -> Optional[float]:
        """Get price closest to a timestamp."""
        if not self.timestamps:
            return None
        closest_idx = min(
            range(len(self.timestamps)),
            key=lambda i: abs((self.timestamps[i] - timestamp).total_seconds())
        )
        return self.prices[closest_idx]


@dataclass
class MarketResolution:
    """
    Resolution record for a market.

    Critical for backtesting - provides ground truth.
    """
    market_id: str
    source: MarketSource
    question: str
    resolution_time: datetime
    outcome: OutcomeResult
    final_price: float  # Last price before resolution
    settlement_value: float  # 0 or 1 (or partial)

    # Pre-resolution metrics (for analysis)
    price_1h_before: Optional[float] = None
    price_6h_before: Optional[float] = None
    price_24h_before: Optional[float] = None
    volume_24h_before: Optional[float] = None

    @property
    def convergence_error_1h(self) -> Optional[float]:
        """Price error 1 hour before resolution."""
        if self.price_1h_before is not None:
            return abs(self.price_1h_before - self.settlement_value)
        return None

    @property
    def convergence_error_24h(self) -> Optional[float]:
        """Price error 24 hours before resolution."""
        if self.price_24h_before is not None:
            return abs(self.price_24h_before - self.settlement_value)
        return None


@dataclass
class Signal:
    """
    Trading signal from a strategy.

    Signals are the output of edge detection strategies.
    They recommend positions but do NOT execute trades.
    """
    # Identification
    strategy_name: str
    market_id: str
    timestamp: datetime

    # Signal properties
    direction: str  # "buy_yes", "buy_no", "hold"
    strength: float  # Signal strength: -1 (strong sell) to 1 (strong buy)
    confidence: float  # Confidence in signal: 0 to 1

    # Value estimates
    expected_value: float  # Expected return
    probability_estimate: Optional[float] = None  # Strategy's prob estimate
    market_probability: Optional[float] = None  # Current market prob

    # Risk metrics
    kelly_fraction: Optional[float] = None  # Recommended position size
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

    # Context
    time_horizon_hours: Optional[float] = None
    explanation: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def edge(self) -> Optional[float]:
        """Edge as probability difference."""
        if self.probability_estimate and self.market_probability:
            return self.probability_estimate - self.market_probability
        return None


@dataclass
class Opportunity:
    """
    Ranked trading opportunity.

    Opportunities combine signals from multiple strategies with
    market context to produce actionable research insights.
    """
    # Identification
    rank: int
    market_id: str
    market_name: str
    source: MarketSource
    timestamp: datetime

    # Scoring
    composite_score: float  # Final weighted score
    expected_value: float
    confidence: float
    risk_score: float  # 0 = low risk, 1 = high risk

    # Market context
    current_price: float
    liquidity: float
    volume_24h: float
    hours_to_resolution: Optional[float]

    # Signal aggregation
    signals: List[Signal] = field(default_factory=list)
    signal_agreement: float = 0.0  # % of signals agreeing on direction

    # Recommendations (for research only)
    suggested_side: str = "hold"  # "buy_yes", "buy_no", "hold"
    suggested_size: float = 0.0  # Fraction of bankroll
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None

    # Analysis
    explanation: str = ""
    key_factors: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for reporting."""
        return {
            'rank': self.rank,
            'market_id': self.market_id,
            'market_name': self.market_name,
            'source': self.source.value,
            'composite_score': self.composite_score,
            'expected_value': self.expected_value,
            'confidence': self.confidence,
            'risk_score': self.risk_score,
            'current_price': self.current_price,
            'liquidity': self.liquidity,
            'hours_to_resolution': self.hours_to_resolution,
            'suggested_side': self.suggested_side,
            'suggested_size': self.suggested_size,
            'explanation': self.explanation,
            'key_factors': self.key_factors,
            'risks': self.risks,
        }


@dataclass
class BacktestTrade:
    """Record of a simulated trade in backtesting."""
    entry_time: datetime
    exit_time: datetime
    market_id: str
    strategy_name: str
    side: str  # "yes" or "no"
    entry_price: float
    exit_price: float
    position_size: float  # In base currency
    pnl: float  # Profit/loss
    return_pct: float  # Return percentage
    outcome: str  # "win", "loss", "push"


@dataclass
class BacktestResult:
    """
    Complete backtesting results for a strategy.

    Contains all metrics needed to evaluate strategy performance.
    """
    strategy_name: str
    start_date: datetime
    end_date: datetime

    # Trade history
    trades: List[BacktestTrade]
    total_trades: int

    # Performance metrics
    total_return: float  # Total return percentage
    annualized_return: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    win_rate: float  # Percentage of winning trades
    profit_factor: float  # Gross profit / gross loss

    # Calibration metrics
    brier_score: float
    calibration_error: float
    log_loss: float

    # Equity curve
    equity_curve: List[float]
    equity_timestamps: List[datetime]

    # Additional statistics
    avg_trade_duration_hours: float
    avg_profit_per_trade: float
    avg_loss_per_trade: float
    best_trade: float
    worst_trade: float
    consecutive_wins: int
    consecutive_losses: int

    def summary(self) -> str:
        """Generate summary text."""
        return f"""
Backtest Results: {self.strategy_name}
Period: {self.start_date.date()} to {self.end_date.date()}
====================================================
Total Trades:      {self.total_trades}
Win Rate:          {self.win_rate:.1%}
Total Return:      {self.total_return:.2%}
Annualized Return: {self.annualized_return:.2%}
Sharpe Ratio:      {self.sharpe_ratio:.2f}
Max Drawdown:      {self.max_drawdown:.2%}
Profit Factor:     {self.profit_factor:.2f}
Brier Score:       {self.brier_score:.4f}
Calibration Error: {self.calibration_error:.4f}
====================================================
        """
