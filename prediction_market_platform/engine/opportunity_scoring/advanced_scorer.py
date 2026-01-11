"""
Advanced Opportunity Scorer.

Uses ML-based models to rank trading opportunities:
- Bayesian probability adjustment
- Ensemble signal aggregation
- Edge decay modeling
- Risk-adjusted scoring
- Cross-market analysis
"""

import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketSource,
    Opportunity
)
from engine.algorithms import (
    BayesianEdgeEstimator,
    EnsembleEdgeAggregator,
    EdgeDecayModel,
    MarketEfficiencyAnalyzer,
    RealTimeAccuracyTracker
)
from strategies.base import StrategyResult, SignalDirection
from utils.logging_setup import get_logger

logger = get_logger("advanced_scorer")


@dataclass
class ScoringFactors:
    """Detailed breakdown of scoring factors."""
    base_edge: float = 0.0
    bayesian_adjustment: float = 0.0
    ensemble_agreement: float = 0.0
    decay_factor: float = 1.0
    efficiency_bonus: float = 0.0
    liquidity_penalty: float = 0.0
    timing_bonus: float = 0.0
    risk_adjustment: float = 1.0
    final_score: float = 0.0


@dataclass
class RankedOpportunity:
    """Opportunity with detailed scoring breakdown."""
    opportunity: Opportunity
    scoring_factors: ScoringFactors
    bayesian_estimate: Any  # BayesianEstimate
    market_efficiency: Any  # MarketEfficiency
    contributing_signals: List[StrategyResult]


class AdvancedOpportunityScorer:
    """
    Advanced ML-based opportunity scoring system.

    Combines multiple models:
    1. Bayesian probability estimation
    2. Ensemble signal aggregation
    3. Edge decay modeling
    4. Market efficiency analysis
    5. Risk-adjusted returns

    This scorer is designed to produce more accurate rankings
    than the basic scorer by accounting for:
    - Signal reliability
    - Market microstructure
    - Timing considerations
    - Historical accuracy
    """

    def __init__(
        self,
        bayesian_prior_strength: float = 1.0,
        ensemble_enabled: bool = True,
        decay_enabled: bool = True
    ):
        """
        Initialize advanced scorer.

        Args:
            bayesian_prior_strength: Strength of Bayesian priors
            ensemble_enabled: Use ensemble aggregation
            decay_enabled: Apply edge decay
        """
        self.bayesian = BayesianEdgeEstimator(prior_strength=bayesian_prior_strength)
        self.aggregator = EnsembleEdgeAggregator()
        self.decay_model = EdgeDecayModel()
        self.efficiency_analyzer = MarketEfficiencyAnalyzer()
        self.accuracy_tracker = RealTimeAccuracyTracker()

        self.ensemble_enabled = ensemble_enabled
        self.decay_enabled = decay_enabled

        # Scoring weights
        self.weights = {
            'edge': 0.35,           # Raw edge value
            'confidence': 0.20,     # Signal confidence
            'efficiency': 0.15,     # Market inefficiency bonus
            'timing': 0.10,         # Time to resolution
            'liquidity': 0.10,      # Liquidity score
            'agreement': 0.10       # Multi-signal agreement
        }

    def score_opportunities(
        self,
        signals: List[StrategyResult],
        markets: Dict[str, MarketSnapshot],
        order_books: Optional[Dict[str, OrderBook]] = None,
        price_histories: Optional[Dict[str, PriceHistory]] = None,
        top_n: int = 50
    ) -> List[RankedOpportunity]:
        """
        Score and rank all opportunities.

        Args:
            signals: List of strategy signals
            markets: Dictionary of market_id -> MarketSnapshot
            order_books: Dictionary of market_id -> OrderBook
            price_histories: Dictionary of market_id -> PriceHistory
            top_n: Number of top opportunities to return

        Returns:
            List of ranked opportunities
        """
        logger.info(f"Scoring {len(signals)} signals across {len(markets)} markets")

        order_books = order_books or {}
        price_histories = price_histories or {}

        # Group signals by market
        signals_by_market: Dict[str, List[StrategyResult]] = {}
        for signal in signals:
            if signal.market_id not in signals_by_market:
                signals_by_market[signal.market_id] = []
            signals_by_market[signal.market_id].append(signal)

        # Score each market
        scored_opportunities = []

        for market_id, market_signals in signals_by_market.items():
            if market_id not in markets:
                continue

            snapshot = markets[market_id]
            order_book = order_books.get(market_id)
            price_history = price_histories.get(market_id)

            # Score this market
            ranked_opp = self._score_market(
                snapshot=snapshot,
                signals=market_signals,
                order_book=order_book,
                price_history=price_history
            )

            if ranked_opp and ranked_opp.opportunity.composite_score > 0:
                scored_opportunities.append(ranked_opp)

        # Sort by score
        scored_opportunities.sort(
            key=lambda x: x.opportunity.composite_score,
            reverse=True
        )

        # Assign ranks
        for i, opp in enumerate(scored_opportunities[:top_n]):
            opp.opportunity.rank = i + 1

        logger.info(f"Scored {len(scored_opportunities)} opportunities, returning top {top_n}")

        return scored_opportunities[:top_n]

    def _score_market(
        self,
        snapshot: MarketSnapshot,
        signals: List[StrategyResult],
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None
    ) -> Optional[RankedOpportunity]:
        """Score a single market's opportunity."""
        if not signals:
            return None

        factors = ScoringFactors()

        # 1. Ensemble signal aggregation
        if self.ensemble_enabled:
            ensemble = self.aggregator.aggregate(signals, snapshot.market_id)
            if ensemble:
                factors.base_edge = ensemble.adjusted_edge
                factors.ensemble_agreement = ensemble.model_agreement
            else:
                # Use best single signal
                best_signal = max(signals, key=lambda s: abs(s.expected_value))
                factors.base_edge = best_signal.expected_value
                factors.ensemble_agreement = 0.5
        else:
            best_signal = max(signals, key=lambda s: abs(s.expected_value))
            factors.base_edge = best_signal.expected_value
            factors.ensemble_agreement = 0.5

        # 2. Bayesian probability adjustment
        observations = None
        if price_history and len(price_history.prices) > 0:
            observations = price_history.prices

        bayesian_estimate = self.bayesian.estimate(
            market_price=snapshot.yes_price,
            observations=observations,
            liquidity=snapshot.liquidity or 1000,
            time_to_resolution_hours=snapshot.hours_to_resolution
        )

        # Adjust edge based on Bayesian estimate
        market_price = snapshot.yes_price
        bayesian_edge = bayesian_estimate.mean - market_price

        # Blend raw edge with Bayesian edge
        blend_weight = min(bayesian_estimate.sample_size / 50, 1.0)
        factors.bayesian_adjustment = bayesian_edge * blend_weight * 0.3

        # 3. Edge decay (if signal is not fresh)
        if self.decay_enabled:
            # Assume signals are fresh for now
            # In production, track signal age
            primary_strategy = signals[0].strategy_name
            factors.decay_factor = self.decay_model.calculate_decay(
                strategy_name=primary_strategy,
                hours_since_signal=0.5,  # Assume 30 min old
                time_to_resolution=snapshot.hours_to_resolution
            )

        # 4. Market efficiency analysis
        market_efficiency = self.efficiency_analyzer.analyze(
            snapshot=snapshot,
            order_book=order_book,
            price_history=price_history
        )

        # Inefficient markets get a bonus
        factors.efficiency_bonus = (1 - market_efficiency.efficiency_score) * 0.1

        # 5. Liquidity penalty
        # Very thin markets have higher risk
        liq = snapshot.liquidity or 0
        if liq < 1000:
            factors.liquidity_penalty = 0.3
        elif liq < 5000:
            factors.liquidity_penalty = 0.15
        elif liq < 10000:
            factors.liquidity_penalty = 0.05
        else:
            factors.liquidity_penalty = 0.0

        # 6. Timing bonus
        # Near-resolution markets with clear direction get bonus
        if snapshot.hours_to_resolution is not None:
            if snapshot.hours_to_resolution < 24:
                # Late-stage bonus
                factors.timing_bonus = 0.1 * (1 - snapshot.hours_to_resolution / 24)
            elif snapshot.hours_to_resolution < 72:
                factors.timing_bonus = 0.05

        # 7. Risk adjustment
        # Higher uncertainty = lower score
        risk_factor = 1 - bayesian_estimate.uncertainty
        factors.risk_adjustment = max(0.5, risk_factor)

        # Calculate final score
        edge_component = (
            abs(factors.base_edge) + factors.bayesian_adjustment
        ) * factors.decay_factor

        confidence_component = sum(s.confidence for s in signals) / len(signals)

        factors.final_score = (
            edge_component * self.weights['edge'] * factors.risk_adjustment +
            confidence_component * self.weights['confidence'] +
            factors.efficiency_bonus * self.weights['efficiency'] +
            factors.timing_bonus * self.weights['timing'] +
            (1 - factors.liquidity_penalty) * self.weights['liquidity'] +
            factors.ensemble_agreement * self.weights['agreement']
        )

        # Ensure score is in valid range
        factors.final_score = max(0.0, min(1.0, factors.final_score))

        # Determine direction
        buy_yes_weight = sum(
            abs(s.expected_value)
            for s in signals
            if s.direction == SignalDirection.BUY_YES
        )
        buy_no_weight = sum(
            abs(s.expected_value)
            for s in signals
            if s.direction == SignalDirection.BUY_NO
        )

        suggested_side = "yes" if buy_yes_weight >= buy_no_weight else "no"

        # Calculate suggested position size (Kelly-inspired)
        avg_confidence = sum(s.confidence for s in signals) / len(signals)
        suggested_size = min(
            0.10,  # Max 10% of portfolio
            abs(factors.base_edge) * avg_confidence * 0.5
        )

        # Create opportunity
        opportunity = Opportunity(
            market_id=snapshot.market_id,
            market_name=snapshot.question[:200] if snapshot.question else snapshot.market_id,
            source=snapshot.source,
            timestamp=datetime.now(timezone.utc),
            composite_score=factors.final_score,
            expected_value=factors.base_edge + factors.bayesian_adjustment,
            confidence=avg_confidence,
            risk_score=1 - factors.risk_adjustment,
            current_price=snapshot.yes_price,
            liquidity=snapshot.liquidity or 0,
            volume_24h=snapshot.volume_24h or 0,
            hours_to_resolution=snapshot.hours_to_resolution,
            suggested_side=suggested_side,
            suggested_size=suggested_size,
            explanation=self._generate_explanation(factors, signals, market_efficiency),
            key_factors=self._extract_key_factors(factors, signals),
            risks=self._extract_risks(factors, market_efficiency, snapshot),
            signal_agreement=factors.ensemble_agreement,
            rank=0  # Will be assigned after sorting
        )

        return RankedOpportunity(
            opportunity=opportunity,
            scoring_factors=factors,
            bayesian_estimate=bayesian_estimate,
            market_efficiency=market_efficiency,
            contributing_signals=signals
        )

    def _generate_explanation(
        self,
        factors: ScoringFactors,
        signals: List[StrategyResult],
        efficiency: Any
    ) -> str:
        """Generate human-readable explanation."""
        parts = []

        # Signal count
        parts.append(f"{len(signals)} strategies detected edge")

        # Edge description
        if abs(factors.base_edge) > 0.05:
            parts.append(f"Strong {factors.base_edge:+.1%} edge identified")
        elif abs(factors.base_edge) > 0.02:
            parts.append(f"Moderate {factors.base_edge:+.1%} edge")

        # Agreement
        if factors.ensemble_agreement > 0.8:
            parts.append("High multi-strategy agreement")
        elif factors.ensemble_agreement > 0.6:
            parts.append("Moderate strategy agreement")

        # Efficiency
        if efficiency.efficiency_score < 0.4:
            parts.append(f"Inefficient market ({efficiency.volatility_regime} volatility)")

        # Timing
        if factors.timing_bonus > 0.05:
            parts.append("Near-resolution timing advantage")

        return ". ".join(parts) + "."

    def _extract_key_factors(
        self,
        factors: ScoringFactors,
        signals: List[StrategyResult]
    ) -> List[str]:
        """Extract key factors driving the score."""
        key_factors = []

        # Strategy names
        strategies = list(set(s.strategy_name for s in signals))
        key_factors.append(f"Strategies: {', '.join(strategies[:3])}")

        # Edge
        key_factors.append(f"Base edge: {factors.base_edge:+.2%}")

        # Bayesian adjustment
        if abs(factors.bayesian_adjustment) > 0.005:
            key_factors.append(f"Bayesian adjustment: {factors.bayesian_adjustment:+.2%}")

        # Agreement
        key_factors.append(f"Model agreement: {factors.ensemble_agreement:.0%}")

        # Decay
        if factors.decay_factor < 0.9:
            key_factors.append(f"Edge decay: {1 - factors.decay_factor:.0%}")

        return key_factors

    def _extract_risks(
        self,
        factors: ScoringFactors,
        efficiency: Any,
        snapshot: MarketSnapshot
    ) -> List[str]:
        """Extract key risks."""
        risks = []

        # Liquidity risk
        if factors.liquidity_penalty > 0.1:
            risks.append(f"Low liquidity (${snapshot.liquidity or 0:,.0f})")

        # Efficiency risk
        if efficiency.efficiency_score > 0.7:
            risks.append("Highly efficient market - edge may be priced in")

        # Timing risk
        if snapshot.hours_to_resolution and snapshot.hours_to_resolution < 6:
            risks.append("Very near resolution - limited time to act")

        # Uncertainty risk
        if factors.risk_adjustment < 0.7:
            risks.append("High uncertainty in probability estimate")

        # Spread risk
        if snapshot.spread and snapshot.spread > 0.05:
            risks.append(f"Wide spread ({snapshot.spread:.1%})")

        # Default risks
        if not risks:
            risks = [
                "Standard prediction market risks apply",
                "Past performance doesn't guarantee future results"
            ]

        return risks

    def get_scoring_summary(
        self,
        opportunities: List[RankedOpportunity]
    ) -> Dict[str, Any]:
        """Get summary statistics for scoring run."""
        if not opportunities:
            return {}

        scores = [o.opportunity.composite_score for o in opportunities]
        edges = [o.opportunity.expected_value for o in opportunities]

        return {
            'total_opportunities': len(opportunities),
            'avg_score': sum(scores) / len(scores),
            'max_score': max(scores),
            'min_score': min(scores),
            'avg_edge': sum(edges) / len(edges),
            'max_edge': max(edges),
            'high_confidence_count': sum(
                1 for o in opportunities
                if o.scoring_factors.ensemble_agreement > 0.7
            ),
            'by_source': {
                'polymarket': sum(
                    1 for o in opportunities
                    if o.opportunity.source == MarketSource.POLYMARKET
                ),
                'kalshi': sum(
                    1 for o in opportunities
                    if o.opportunity.source == MarketSource.KALSHI
                )
            }
        }
