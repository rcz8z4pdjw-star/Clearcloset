"""
Advanced Edge Detection Algorithms.

Machine learning and statistical models for identifying market inefficiencies:
- Bayesian probability estimation
- Ensemble signal aggregation
- Cross-market correlation analysis
- Dynamic edge decay models
- Real-time accuracy scoring
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketSource
)
from strategies.base import StrategyResult, SignalDirection


@dataclass
class BayesianEstimate:
    """Bayesian probability estimate with uncertainty."""
    mean: float  # Point estimate
    lower_bound: float  # 95% CI lower
    upper_bound: float  # 95% CI upper
    alpha: float  # Beta distribution alpha
    beta: float  # Beta distribution beta
    sample_size: int  # Effective sample size

    @property
    def confidence_width(self) -> float:
        """Width of confidence interval."""
        return self.upper_bound - self.lower_bound

    @property
    def uncertainty(self) -> float:
        """Uncertainty score (0-1, lower is more certain)."""
        return self.confidence_width / 2


@dataclass
class EdgeSignal:
    """Enhanced edge signal with confidence metrics."""
    strategy_name: str
    market_id: str
    direction: SignalDirection
    raw_edge: float  # Raw edge estimate
    adjusted_edge: float  # Edge after adjustments
    confidence: float  # Signal confidence
    decay_factor: float  # Time decay applied
    sample_quality: float  # Data quality score
    model_agreement: float  # Agreement across models
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class MarketEfficiency:
    """Market efficiency metrics."""
    market_id: str
    efficiency_score: float  # 0-1, higher = more efficient
    spread_efficiency: float
    depth_efficiency: float
    price_accuracy: float
    volatility_regime: str  # "low", "medium", "high"
    opportunity_window: float  # Hours until edge likely closes


class BayesianEdgeEstimator:
    """
    Bayesian estimator for true probability.

    Uses conjugate prior (Beta-Binomial) to estimate
    true event probability from noisy market prices.

    Key insight: Market prices are noisy signals of true probability.
    By combining multiple observations and prior knowledge, we can
    estimate the true probability with quantified uncertainty.
    """

    # Prior calibration from historical prediction market data
    # These represent typical bias patterns observed empirically
    CALIBRATION_PRIORS = {
        # (market_price_bucket): (alpha_adjustment, beta_adjustment)
        (0.00, 0.10): (0.5, 2.0),   # Longshots: true prob higher than market
        (0.10, 0.20): (0.8, 1.5),
        (0.20, 0.40): (1.0, 1.0),   # Mid-range: roughly calibrated
        (0.40, 0.60): (1.0, 1.0),
        (0.60, 0.80): (1.0, 1.0),
        (0.80, 0.90): (1.5, 0.8),
        (0.90, 1.00): (2.0, 0.5),   # Favorites: true prob lower than market
    }

    def __init__(self, prior_strength: float = 1.0):
        """
        Initialize estimator.

        Args:
            prior_strength: How strongly to weight priors (1.0 = default)
        """
        self.prior_strength = prior_strength
        self._observation_cache: Dict[str, List[float]] = defaultdict(list)

    def estimate(
        self,
        market_price: float,
        observations: Optional[List[float]] = None,
        liquidity: float = 1000.0,
        time_to_resolution_hours: Optional[float] = None
    ) -> BayesianEstimate:
        """
        Estimate true probability with uncertainty.

        Args:
            market_price: Current market price (0-1)
            observations: Historical price observations
            liquidity: Market liquidity (affects confidence)
            time_to_resolution_hours: Time until resolution

        Returns:
            BayesianEstimate with mean and confidence interval
        """
        # Get calibration prior based on price bucket
        alpha_prior, beta_prior = self._get_prior(market_price)

        # Scale prior by strength parameter
        alpha_prior *= self.prior_strength
        beta_prior *= self.prior_strength

        # Incorporate observations
        if observations and len(observations) > 0:
            # Treat observations as pseudo-counts
            n_obs = len(observations)
            mean_obs = sum(observations) / n_obs

            # Weight observations by recency and liquidity
            obs_weight = min(n_obs, 50) * (1 + math.log10(max(liquidity, 100)) / 4)

            alpha_data = mean_obs * obs_weight
            beta_data = (1 - mean_obs) * obs_weight
        else:
            # Use market price as single observation
            obs_weight = 1 + math.log10(max(liquidity, 100)) / 4
            alpha_data = market_price * obs_weight
            beta_data = (1 - market_price) * obs_weight

        # Posterior parameters
        alpha = alpha_prior + alpha_data
        beta = beta_prior + beta_data

        # Posterior mean
        mean = alpha / (alpha + beta)

        # 95% credible interval using normal approximation for large samples
        if alpha + beta > 10:
            variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
            std = math.sqrt(variance)
            z = 1.96  # 95% CI

            lower = max(0.0, mean - z * std)
            upper = min(1.0, mean + z * std)
        else:
            # For small samples, use wider interval
            lower = max(0.0, mean - 0.15)
            upper = min(1.0, mean + 0.15)

        # Adjust for time to resolution (convergence effect)
        if time_to_resolution_hours is not None and time_to_resolution_hours < 24:
            # Near resolution, market price is more accurate
            convergence_weight = max(0, 1 - time_to_resolution_hours / 24)
            mean = mean * (1 - convergence_weight) + market_price * convergence_weight
            # Also tighten interval
            interval_shrink = 1 - convergence_weight * 0.5
            mid = (lower + upper) / 2
            lower = mid - (mid - lower) * interval_shrink
            upper = mid + (upper - mid) * interval_shrink

        return BayesianEstimate(
            mean=mean,
            lower_bound=lower,
            upper_bound=upper,
            alpha=alpha,
            beta=beta,
            sample_size=int(alpha + beta)
        )

    def _get_prior(self, price: float) -> Tuple[float, float]:
        """Get calibration prior for price bucket."""
        for (low, high), (alpha, beta) in self.CALIBRATION_PRIORS.items():
            if low <= price < high:
                return alpha, beta
        return 1.0, 1.0


class EnsembleEdgeAggregator:
    """
    Aggregates signals from multiple strategies into unified edge estimate.

    Uses weighted ensemble approach considering:
    - Historical strategy accuracy
    - Signal correlation
    - Confidence levels
    - Market conditions
    """

    # Strategy weights based on empirical performance
    # Higher weight = historically more accurate
    STRATEGY_WEIGHTS = {
        'late_resolution': 1.5,      # Strong empirical edge
        'favorite_longshot_bias': 1.3,
        'liquidity_vacuum': 1.2,
        'spread_exploitation': 1.1,
        'cross_market_arbitrage': 1.4,
        'overreaction': 1.0,
        'order_book_imbalance': 0.9,
        'herding': 0.8,
        'anchoring': 0.8,
        'forecast_divergence': 1.1,
        'slow_updating': 0.9,
    }

    # Strategy correlation matrix (simplified - strategies that agree)
    # Correlated strategies should not double-count edge
    STRATEGY_CORRELATIONS = {
        ('late_resolution', 'favorite_longshot_bias'): 0.3,
        ('liquidity_vacuum', 'spread_exploitation'): 0.6,
        ('overreaction', 'herding'): 0.5,
        ('order_book_imbalance', 'liquidity_vacuum'): 0.4,
    }

    def __init__(self):
        """Initialize aggregator."""
        self._accuracy_history: Dict[str, List[bool]] = defaultdict(list)

    def aggregate(
        self,
        signals: List[StrategyResult],
        market_id: str
    ) -> Optional[EdgeSignal]:
        """
        Aggregate multiple strategy signals into unified edge.

        Args:
            signals: List of strategy results for the market
            market_id: Market identifier

        Returns:
            Aggregated EdgeSignal or None if no consensus
        """
        if not signals:
            return None

        # Filter to signals for this market
        market_signals = [s for s in signals if s.market_id == market_id]
        if not market_signals:
            return None

        # Separate by direction
        buy_yes_signals = [s for s in market_signals if s.direction == SignalDirection.BUY_YES]
        buy_no_signals = [s for s in market_signals if s.direction == SignalDirection.BUY_NO]

        # Determine dominant direction
        buy_yes_weight = self._calculate_weighted_sum(buy_yes_signals)
        buy_no_weight = self._calculate_weighted_sum(buy_no_signals)

        if buy_yes_weight > buy_no_weight:
            direction = SignalDirection.BUY_YES
            dominant_signals = buy_yes_signals
            agreement = buy_yes_weight / (buy_yes_weight + buy_no_weight) if (buy_yes_weight + buy_no_weight) > 0 else 0
        else:
            direction = SignalDirection.BUY_NO
            dominant_signals = buy_no_signals
            agreement = buy_no_weight / (buy_yes_weight + buy_no_weight) if (buy_yes_weight + buy_no_weight) > 0 else 0

        if not dominant_signals:
            return None

        # Calculate weighted average edge
        total_weight = 0.0
        weighted_edge = 0.0
        weighted_confidence = 0.0

        for signal in dominant_signals:
            weight = self._get_signal_weight(signal)

            # Apply correlation discount
            discount = self._get_correlation_discount(signal, dominant_signals)
            weight *= discount

            weighted_edge += signal.expected_value * weight
            weighted_confidence += signal.confidence * weight
            total_weight += weight

        if total_weight == 0:
            return None

        raw_edge = weighted_edge / total_weight
        confidence = weighted_confidence / total_weight

        # Apply ensemble shrinkage (conservative adjustment)
        # More strategies agreeing = less shrinkage
        shrinkage = 0.8 + 0.2 * min(len(dominant_signals) / 5, 1.0)
        adjusted_edge = raw_edge * shrinkage

        # Calculate sample quality from signal confidences
        sample_quality = sum(s.confidence for s in dominant_signals) / len(dominant_signals)

        return EdgeSignal(
            strategy_name="ensemble",
            market_id=market_id,
            direction=direction,
            raw_edge=raw_edge,
            adjusted_edge=adjusted_edge,
            confidence=confidence,
            decay_factor=1.0,  # Will be applied separately
            sample_quality=sample_quality,
            model_agreement=agreement
        )

    def _get_signal_weight(self, signal: StrategyResult) -> float:
        """Get weight for a signal based on strategy and confidence."""
        base_weight = self.STRATEGY_WEIGHTS.get(signal.strategy_name, 1.0)

        # Adjust by confidence
        confidence_adjustment = 0.5 + signal.confidence

        # Adjust by edge size (larger edges = higher weight, up to a point)
        edge_adjustment = min(1.5, 1.0 + abs(signal.expected_value) * 5)

        return base_weight * confidence_adjustment * edge_adjustment

    def _calculate_weighted_sum(self, signals: List[StrategyResult]) -> float:
        """Calculate weighted sum of signals."""
        return sum(self._get_signal_weight(s) * abs(s.expected_value) for s in signals)

    def _get_correlation_discount(
        self,
        signal: StrategyResult,
        all_signals: List[StrategyResult]
    ) -> float:
        """
        Calculate correlation discount to avoid double-counting.

        If correlated strategies both fire, we should discount their combined weight.
        """
        discount = 1.0

        for other in all_signals:
            if other.strategy_name == signal.strategy_name:
                continue

            # Check if correlated
            pair = tuple(sorted([signal.strategy_name, other.strategy_name]))
            correlation = self.STRATEGY_CORRELATIONS.get(pair, 0.0)

            if correlation > 0:
                # Reduce weight by correlation amount
                discount *= (1 - correlation * 0.5)

        return discount

    def update_accuracy(self, strategy_name: str, was_correct: bool):
        """Update accuracy history for a strategy."""
        history = self._accuracy_history[strategy_name]
        history.append(was_correct)

        # Keep last 100 observations
        if len(history) > 100:
            self._accuracy_history[strategy_name] = history[-100:]


class EdgeDecayModel:
    """
    Models how edges decay over time.

    Prediction market edges are not static - they decay as:
    1. More traders discover the edge
    2. The market approaches resolution
    3. New information arrives

    This model estimates remaining edge value over time.
    """

    # Decay parameters by edge type (half-life in hours)
    EDGE_HALF_LIVES = {
        'liquidity_vacuum': 4.0,      # Fast decay - others find thin markets
        'spread_exploitation': 2.0,    # Very fast - spreads close quickly
        'order_book_imbalance': 1.0,   # Fastest - order flow changes rapidly
        'late_resolution': 24.0,       # Slow - structural edge
        'favorite_longshot_bias': 168.0,  # Very slow - persistent bias
        'overreaction': 8.0,           # Medium - reversion takes time
        'herding': 12.0,
        'anchoring': 48.0,             # Slow - anchors persist
        'cross_market_arbitrage': 0.5,  # Instant - arb closes fast
        'forecast_divergence': 24.0,
        'slow_updating': 12.0,
    }

    def calculate_decay(
        self,
        strategy_name: str,
        hours_since_signal: float,
        time_to_resolution: Optional[float] = None
    ) -> float:
        """
        Calculate edge decay factor.

        Args:
            strategy_name: Strategy that generated the edge
            hours_since_signal: Hours since signal was generated
            time_to_resolution: Hours until market resolves

        Returns:
            Decay factor (0-1), multiply edge by this value
        """
        # Get half-life for this strategy
        half_life = self.EDGE_HALF_LIVES.get(strategy_name, 12.0)

        # Exponential decay: e^(-t * ln(2) / half_life)
        decay = math.exp(-hours_since_signal * math.log(2) / half_life)

        # Near resolution, decay accelerates (convergence)
        if time_to_resolution is not None:
            if time_to_resolution < 24:
                # Accelerate decay in final 24 hours
                convergence_factor = time_to_resolution / 24
                decay *= convergence_factor

        return max(0.0, min(1.0, decay))

    def estimate_opportunity_window(
        self,
        strategy_name: str,
        initial_edge: float,
        min_edge_threshold: float = 0.02
    ) -> float:
        """
        Estimate how long until edge decays below threshold.

        Args:
            strategy_name: Strategy name
            initial_edge: Initial edge size
            min_edge_threshold: Minimum worthwhile edge

        Returns:
            Hours until edge decays below threshold
        """
        if initial_edge <= min_edge_threshold:
            return 0.0

        half_life = self.EDGE_HALF_LIVES.get(strategy_name, 12.0)

        # Solve: initial_edge * e^(-t * ln(2) / half_life) = min_threshold
        # t = -half_life * ln(min_threshold / initial_edge) / ln(2)
        ratio = min_edge_threshold / initial_edge
        hours = -half_life * math.log(ratio) / math.log(2)

        return max(0.0, hours)


class MarketEfficiencyAnalyzer:
    """
    Analyzes market efficiency to identify opportunity-rich markets.

    Efficient markets have:
    - Tight spreads
    - Deep order books
    - Stable prices
    - High volume

    Inefficient markets (our targets) have:
    - Wide spreads
    - Thin books
    - High volatility
    - Low volume
    """

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None
    ) -> MarketEfficiency:
        """
        Analyze market efficiency.

        Args:
            snapshot: Current market snapshot
            order_book: Current order book
            price_history: Historical prices

        Returns:
            MarketEfficiency with detailed metrics
        """
        # Spread efficiency (tighter = more efficient)
        spread_efficiency = self._calculate_spread_efficiency(snapshot, order_book)

        # Depth efficiency (deeper = more efficient)
        depth_efficiency = self._calculate_depth_efficiency(order_book)

        # Price accuracy (stable near true value = more efficient)
        price_accuracy = self._calculate_price_accuracy(snapshot, price_history)

        # Volatility regime
        volatility_regime = self._determine_volatility_regime(price_history)

        # Overall efficiency score
        efficiency_score = (
            spread_efficiency * 0.3 +
            depth_efficiency * 0.3 +
            price_accuracy * 0.4
        )

        # Opportunity window (inverse of efficiency)
        # Less efficient markets = longer opportunity windows
        if efficiency_score > 0:
            base_window = 24 * (1 - efficiency_score)  # Hours
        else:
            base_window = 48

        # Adjust by time to resolution
        if snapshot.hours_to_resolution:
            opportunity_window = min(base_window, snapshot.hours_to_resolution)
        else:
            opportunity_window = base_window

        return MarketEfficiency(
            market_id=snapshot.market_id,
            efficiency_score=efficiency_score,
            spread_efficiency=spread_efficiency,
            depth_efficiency=depth_efficiency,
            price_accuracy=price_accuracy,
            volatility_regime=volatility_regime,
            opportunity_window=opportunity_window
        )

    def _calculate_spread_efficiency(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook]
    ) -> float:
        """Calculate spread efficiency (0-1, higher = more efficient)."""
        spread = snapshot.spread
        if spread is None and order_book:
            spread = order_book.spread

        if spread is None or spread <= 0:
            return 0.5  # Unknown

        # Efficiency decreases with spread
        # <1% spread = highly efficient (0.9+)
        # >10% spread = very inefficient (<0.3)
        if spread < 0.01:
            return 0.95
        elif spread < 0.02:
            return 0.85
        elif spread < 0.05:
            return 0.65
        elif spread < 0.10:
            return 0.40
        else:
            return 0.20

    def _calculate_depth_efficiency(self, order_book: Optional[OrderBook]) -> float:
        """Calculate depth efficiency (0-1, higher = more efficient)."""
        if order_book is None:
            return 0.5  # Unknown

        total_depth = order_book.total_depth

        # More depth = more efficient
        # >$100k depth = highly efficient
        # <$1k depth = very inefficient
        if total_depth > 100000:
            return 0.95
        elif total_depth > 50000:
            return 0.85
        elif total_depth > 10000:
            return 0.70
        elif total_depth > 5000:
            return 0.55
        elif total_depth > 1000:
            return 0.40
        else:
            return 0.25

    def _calculate_price_accuracy(
        self,
        snapshot: MarketSnapshot,
        price_history: Optional[PriceHistory]
    ) -> float:
        """Calculate price accuracy/stability (0-1, higher = more accurate)."""
        if price_history is None or len(price_history.prices) < 5:
            return 0.5  # Unknown

        # Use volatility as proxy for accuracy
        volatility = price_history.volatility

        if volatility < 0.02:
            return 0.90  # Very stable
        elif volatility < 0.05:
            return 0.75
        elif volatility < 0.10:
            return 0.55
        elif volatility < 0.20:
            return 0.35
        else:
            return 0.20  # High volatility = low accuracy

    def _determine_volatility_regime(
        self,
        price_history: Optional[PriceHistory]
    ) -> str:
        """Determine current volatility regime."""
        if price_history is None or len(price_history.prices) < 5:
            return "medium"

        volatility = price_history.volatility

        if volatility < 0.03:
            return "low"
        elif volatility < 0.10:
            return "medium"
        else:
            return "high"


class RealTimeAccuracyTracker:
    """
    Tracks real-time accuracy of predictions and signals.

    Provides feedback loop for model calibration:
    - Tracks prediction vs outcome
    - Calculates rolling accuracy
    - Identifies systematic biases
    """

    def __init__(self, window_size: int = 100):
        """
        Initialize tracker.

        Args:
            window_size: Number of predictions to keep in rolling window
        """
        self.window_size = window_size
        self._predictions: List[Dict[str, Any]] = []
        self._outcomes: Dict[str, Dict[str, Any]] = {}  # market_id -> outcome

    def record_prediction(
        self,
        market_id: str,
        strategy_name: str,
        predicted_prob: float,
        direction: SignalDirection,
        confidence: float
    ):
        """Record a prediction for later evaluation."""
        self._predictions.append({
            'market_id': market_id,
            'strategy_name': strategy_name,
            'predicted_prob': predicted_prob,
            'direction': direction,
            'confidence': confidence,
            'timestamp': datetime.now(timezone.utc)
        })

        # Trim to window size
        if len(self._predictions) > self.window_size * 2:
            self._predictions = self._predictions[-self.window_size:]

    def record_outcome(
        self,
        market_id: str,
        actual_outcome: bool,  # True = YES resolved
        final_price: float
    ):
        """Record actual market outcome."""
        self._outcomes[market_id] = {
            'outcome': actual_outcome,
            'final_price': final_price,
            'timestamp': datetime.now(timezone.utc)
        }

    def calculate_brier_score(self, strategy_name: Optional[str] = None) -> float:
        """
        Calculate Brier score for predictions.

        Brier score = mean((predicted_prob - actual_outcome)^2)
        Lower is better. Perfect = 0, random = 0.25

        Args:
            strategy_name: Filter by strategy (None = all)

        Returns:
            Brier score
        """
        matched = self._match_predictions_to_outcomes(strategy_name)

        if not matched:
            return 0.25  # No data, return random baseline

        squared_errors = []
        for pred, outcome in matched:
            actual = 1.0 if outcome['outcome'] else 0.0
            error = (pred['predicted_prob'] - actual) ** 2
            squared_errors.append(error)

        return sum(squared_errors) / len(squared_errors)

    def calculate_calibration_error(
        self,
        strategy_name: Optional[str] = None,
        n_bins: int = 10
    ) -> float:
        """
        Calculate calibration error.

        Groups predictions into bins and compares predicted vs actual.
        Perfect calibration = 0.

        Args:
            strategy_name: Filter by strategy
            n_bins: Number of probability bins

        Returns:
            Mean absolute calibration error
        """
        matched = self._match_predictions_to_outcomes(strategy_name)

        if not matched:
            return 0.0

        # Bin predictions
        bins = defaultdict(list)
        for pred, outcome in matched:
            bin_idx = min(int(pred['predicted_prob'] * n_bins), n_bins - 1)
            bins[bin_idx].append((pred['predicted_prob'], 1.0 if outcome['outcome'] else 0.0))

        # Calculate calibration error per bin
        errors = []
        for bin_idx, preds in bins.items():
            if preds:
                avg_predicted = sum(p[0] for p in preds) / len(preds)
                avg_actual = sum(p[1] for p in preds) / len(preds)
                errors.append(abs(avg_predicted - avg_actual))

        return sum(errors) / len(errors) if errors else 0.0

    def get_strategy_accuracy(self) -> Dict[str, Dict[str, float]]:
        """
        Get accuracy metrics by strategy.

        Returns:
            Dictionary of strategy -> {brier_score, calibration_error, win_rate}
        """
        strategies = set(p['strategy_name'] for p in self._predictions)
        results = {}

        for strategy in strategies:
            matched = self._match_predictions_to_outcomes(strategy)

            if matched:
                brier = self.calculate_brier_score(strategy)
                calibration = self.calculate_calibration_error(strategy)

                # Win rate (direction was correct)
                wins = sum(
                    1 for pred, outcome in matched
                    if (pred['direction'] == SignalDirection.BUY_YES and outcome['outcome']) or
                       (pred['direction'] == SignalDirection.BUY_NO and not outcome['outcome'])
                )
                win_rate = wins / len(matched)

                results[strategy] = {
                    'brier_score': brier,
                    'calibration_error': calibration,
                    'win_rate': win_rate,
                    'sample_size': len(matched)
                }

        return results

    def _match_predictions_to_outcomes(
        self,
        strategy_name: Optional[str]
    ) -> List[Tuple[Dict, Dict]]:
        """Match predictions to their outcomes."""
        matched = []

        for pred in self._predictions:
            if strategy_name and pred['strategy_name'] != strategy_name:
                continue

            market_id = pred['market_id']
            if market_id in self._outcomes:
                matched.append((pred, self._outcomes[market_id]))

        return matched
