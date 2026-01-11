"""
Base classes for prediction market strategies.

All edge detection strategies inherit from the Strategy base class.
This provides a consistent interface for signal generation, backtesting,
and ensemble combination.

IMPORTANT: These strategies are for RESEARCH ONLY.
They produce signals and insights, not trade executions.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from enum import Enum

from ..engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, Signal, MarketSource
)
from ..utils.helpers import calculate_expected_value, calculate_kelly_criterion


class SignalDirection(Enum):
    """Signal direction for trading."""
    BUY_YES = "buy_yes"   # Buy YES shares
    BUY_NO = "buy_no"     # Buy NO shares (sell YES)
    HOLD = "hold"         # No action


@dataclass
class StrategyConfig:
    """
    Configuration for a strategy.

    Allows runtime tuning of strategy parameters without code changes.
    """
    enabled: bool = True
    weight: float = 1.0  # Weight in ensemble
    min_confidence: float = 0.5  # Minimum confidence to emit signal
    min_expected_value: float = 0.02  # Minimum 2% edge to emit signal

    # Risk parameters
    max_position_size: float = 0.10  # Max 10% of capital
    kelly_fraction: float = 0.25  # Quarter Kelly

    # Custom parameters (strategy-specific)
    params: Dict[str, Any] = field(default_factory=dict)

    def get(self, key: str, default: Any = None) -> Any:
        """Get custom parameter value."""
        return self.params.get(key, default)


@dataclass
class StrategyResult:
    """
    Result from running a strategy on a market.

    Contains all information needed to rank and act on the signal.
    """
    # Identification
    strategy_name: str
    market_id: str
    market_name: str
    source: MarketSource
    timestamp: datetime

    # Signal
    direction: SignalDirection
    signal_strength: float  # -1 to 1
    confidence: float  # 0 to 1

    # Value metrics
    probability_estimate: float  # Strategy's probability estimate
    market_probability: float  # Current market price
    expected_value: float  # EV of the trade
    edge: float  # Prob estimate - market prob

    # Position sizing
    kelly_fraction: float = 0.0
    suggested_size: float = 0.0  # As fraction of capital

    # Context
    time_horizon_hours: Optional[float] = None
    explanation: str = ""
    factors: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_signal(self) -> Signal:
        """Convert to Signal object for storage."""
        return Signal(
            strategy_name=self.strategy_name,
            market_id=self.market_id,
            timestamp=self.timestamp,
            direction=self.direction.value,
            strength=self.signal_strength,
            confidence=self.confidence,
            expected_value=self.expected_value,
            probability_estimate=self.probability_estimate,
            market_probability=self.market_probability,
            kelly_fraction=self.kelly_fraction,
            time_horizon_hours=self.time_horizon_hours,
            explanation=self.explanation,
            metadata=self.metadata
        )


class Strategy(ABC):
    """
    Abstract base class for all edge detection strategies.

    Each strategy encapsulates:
    1. A theory of WHY an edge exists (documented)
    2. A method to DETECT the edge from market data
    3. A way to QUANTIFY the signal strength and confidence
    4. An explanation of RISKS and limitations

    Subclasses must implement:
    - name: Human-readable strategy name
    - description: Why this edge exists
    - analyze(): Core signal generation logic
    """

    def __init__(self, config: Optional[StrategyConfig] = None):
        """
        Initialize strategy.

        Args:
            config: Strategy configuration
        """
        self.config = config or StrategyConfig()

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable strategy name."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """
        Description of why this edge exists.

        This should explain the market inefficiency being exploited
        and provide empirical/theoretical justification.
        """
        pass

    @property
    def category(self) -> str:
        """Strategy category (structural, behavioral, temporal, informational)."""
        return "general"

    @abstractmethod
    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """
        Analyze a market and generate a signal.

        This is the core strategy logic. Implementations should:
        1. Check if conditions for the edge exist
        2. Estimate the true probability
        3. Calculate expected value
        4. Assess confidence in the signal
        5. Return a StrategyResult or None if no signal

        Args:
            snapshot: Current market state
            order_book: Order book data (if available)
            price_history: Historical price data (if available)
            related_markets: Related markets for cross-analysis

        Returns:
            StrategyResult if edge detected, None otherwise
        """
        pass

    def run(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """
        Run strategy with validation and filtering.

        This wraps analyze() with common validation logic.

        Args:
            snapshot: Current market state
            order_book: Order book data
            price_history: Historical price data
            related_markets: Related markets

        Returns:
            StrategyResult if edge detected and passes filters
        """
        if not self.config.enabled:
            return None

        # Run core analysis
        result = self.analyze(
            snapshot=snapshot,
            order_book=order_book,
            price_history=price_history,
            related_markets=related_markets
        )

        if result is None:
            return None

        # Apply confidence filter
        if result.confidence < self.config.min_confidence:
            return None

        # Apply EV filter
        if abs(result.expected_value) < self.config.min_expected_value:
            return None

        # Calculate position sizing
        result.kelly_fraction = calculate_kelly_criterion(
            result.probability_estimate,
            result.market_probability,
            self.config.kelly_fraction
        )

        result.suggested_size = min(
            result.kelly_fraction,
            self.config.max_position_size
        )

        return result

    def _create_result(
        self,
        snapshot: MarketSnapshot,
        direction: SignalDirection,
        probability_estimate: float,
        signal_strength: float,
        confidence: float,
        explanation: str,
        factors: Optional[List[str]] = None,
        risks: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        time_horizon_hours: Optional[float] = None
    ) -> StrategyResult:
        """
        Helper to create a StrategyResult.

        Handles common calculations like EV and edge.

        Args:
            snapshot: Market snapshot
            direction: Signal direction
            probability_estimate: Strategy's probability estimate
            signal_strength: Signal strength (-1 to 1)
            confidence: Confidence level (0 to 1)
            explanation: Human-readable explanation
            factors: List of key factors
            risks: List of risks
            metadata: Additional metadata
            time_horizon_hours: Expected time horizon

        Returns:
            Populated StrategyResult
        """
        market_prob = snapshot.mid_price

        # Calculate expected value for the recommended side
        if direction == SignalDirection.BUY_YES:
            ev = calculate_expected_value(probability_estimate, market_prob, "yes")
        elif direction == SignalDirection.BUY_NO:
            ev = calculate_expected_value(1 - probability_estimate, 1 - market_prob, "yes")
        else:
            ev = 0

        edge = probability_estimate - market_prob

        return StrategyResult(
            strategy_name=self.name,
            market_id=snapshot.market_id,
            market_name=snapshot.question,
            source=snapshot.source,
            timestamp=datetime.utcnow(),
            direction=direction,
            signal_strength=signal_strength,
            confidence=confidence,
            probability_estimate=probability_estimate,
            market_probability=market_prob,
            expected_value=ev,
            edge=edge,
            time_horizon_hours=time_horizon_hours or snapshot.hours_to_resolution,
            explanation=explanation,
            factors=factors or [],
            risks=risks or [],
            metadata=metadata or {}
        )


class EnsembleStrategy(Strategy):
    """
    Combines multiple strategies into an ensemble.

    Aggregates signals from constituent strategies using configurable
    weighting and voting schemes.
    """

    def __init__(
        self,
        strategies: List[Strategy],
        config: Optional[StrategyConfig] = None,
        voting_method: str = "weighted_average"
    ):
        """
        Initialize ensemble.

        Args:
            strategies: List of strategies to combine
            config: Ensemble configuration
            voting_method: How to combine signals
                - "weighted_average": Weight by strategy weight * confidence
                - "majority_vote": Simple majority
                - "unanimous": All must agree
        """
        super().__init__(config)
        self.strategies = strategies
        self.voting_method = voting_method

    @property
    def name(self) -> str:
        return "ensemble"

    @property
    def description(self) -> str:
        return f"Ensemble of {len(self.strategies)} strategies using {self.voting_method}"

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """
        Aggregate signals from all strategies.
        """
        results = []

        for strategy in self.strategies:
            result = strategy.run(
                snapshot=snapshot,
                order_book=order_book,
                price_history=price_history,
                related_markets=related_markets
            )
            if result:
                results.append((strategy.config.weight, result))

        if not results:
            return None

        if self.voting_method == "weighted_average":
            return self._weighted_average(snapshot, results)
        elif self.voting_method == "majority_vote":
            return self._majority_vote(snapshot, results)
        elif self.voting_method == "unanimous":
            return self._unanimous(snapshot, results)

        return None

    def _weighted_average(
        self,
        snapshot: MarketSnapshot,
        results: List[Tuple[float, StrategyResult]]
    ) -> Optional[StrategyResult]:
        """Compute weighted average of signals."""
        total_weight = 0
        weighted_prob = 0
        weighted_strength = 0
        weighted_confidence = 0

        all_factors = []
        all_risks = []
        explanations = []

        for weight, result in results:
            effective_weight = weight * result.confidence
            total_weight += effective_weight

            weighted_prob += effective_weight * result.probability_estimate
            weighted_strength += effective_weight * result.signal_strength
            weighted_confidence += effective_weight * result.confidence

            all_factors.extend(result.factors)
            all_risks.extend(result.risks)
            explanations.append(f"{result.strategy_name}: {result.explanation}")

        if total_weight == 0:
            return None

        avg_prob = weighted_prob / total_weight
        avg_strength = weighted_strength / total_weight
        avg_confidence = weighted_confidence / total_weight

        # Determine direction
        if avg_strength > 0.1:
            direction = SignalDirection.BUY_YES
        elif avg_strength < -0.1:
            direction = SignalDirection.BUY_NO
        else:
            direction = SignalDirection.HOLD

        return self._create_result(
            snapshot=snapshot,
            direction=direction,
            probability_estimate=avg_prob,
            signal_strength=avg_strength,
            confidence=avg_confidence,
            explanation=f"Ensemble of {len(results)} strategies: " + "; ".join(explanations[:3]),
            factors=list(set(all_factors)),
            risks=list(set(all_risks)),
            metadata={
                'num_strategies': len(results),
                'strategy_names': [r[1].strategy_name for r in results]
            }
        )

    def _majority_vote(
        self,
        snapshot: MarketSnapshot,
        results: List[Tuple[float, StrategyResult]]
    ) -> Optional[StrategyResult]:
        """Compute majority vote."""
        buy_yes_count = sum(1 for _, r in results if r.direction == SignalDirection.BUY_YES)
        buy_no_count = sum(1 for _, r in results if r.direction == SignalDirection.BUY_NO)

        total = len(results)
        if buy_yes_count > total / 2:
            direction = SignalDirection.BUY_YES
            agreement = buy_yes_count / total
        elif buy_no_count > total / 2:
            direction = SignalDirection.BUY_NO
            agreement = buy_no_count / total
        else:
            return None  # No majority

        # Average probability from agreeing strategies
        agreeing = [r for _, r in results if r.direction == direction]
        avg_prob = sum(r.probability_estimate for r in agreeing) / len(agreeing)
        avg_confidence = sum(r.confidence for r in agreeing) / len(agreeing)

        return self._create_result(
            snapshot=snapshot,
            direction=direction,
            probability_estimate=avg_prob,
            signal_strength=agreement * 2 - 1,  # Scale to -1 to 1
            confidence=avg_confidence * agreement,
            explanation=f"Majority vote: {int(agreement * 100)}% agreement ({len(agreeing)}/{total})",
            metadata={'agreement': agreement, 'num_agreeing': len(agreeing)}
        )

    def _unanimous(
        self,
        snapshot: MarketSnapshot,
        results: List[Tuple[float, StrategyResult]]
    ) -> Optional[StrategyResult]:
        """Require unanimous agreement."""
        if len(results) < 2:
            return None

        directions = set(r.direction for _, r in results)
        if len(directions) != 1:
            return None

        direction = list(directions)[0]
        if direction == SignalDirection.HOLD:
            return None

        # All agree - strong signal
        avg_prob = sum(r.probability_estimate for _, r in results) / len(results)
        avg_confidence = sum(r.confidence for _, r in results) / len(results)

        return self._create_result(
            snapshot=snapshot,
            direction=direction,
            probability_estimate=avg_prob,
            signal_strength=1.0 if direction == SignalDirection.BUY_YES else -1.0,
            confidence=avg_confidence,
            explanation=f"Unanimous: All {len(results)} strategies agree",
            metadata={'num_strategies': len(results)}
        )
