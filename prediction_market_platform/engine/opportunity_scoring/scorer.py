"""
Opportunity Scoring System.

Ranks markets by combining multiple signals, market metrics,
and risk factors into a composite score.

This is the final output layer of the research platform - it produces
ranked opportunities for manual review and potential execution.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
from collections import defaultdict

from ..data_ingestion.models import (
    MarketSnapshot, Opportunity, Signal, MarketSource
)
from ..data_ingestion.database import Database, get_database
from ...strategies.base import StrategyResult, SignalDirection
from ...utils.config_loader import get_config
from ...utils.logging_setup import get_logger

logger = get_logger("opportunity_scorer")


@dataclass
class ScoringWeights:
    """Weights for opportunity scoring components."""
    expected_value: float = 0.30
    confidence: float = 0.20
    liquidity: float = 0.15
    time_horizon: float = 0.10
    historical_edge_strength: float = 0.15
    risk_profile: float = 0.10

    @classmethod
    def from_config(cls) -> 'ScoringWeights':
        """Load weights from configuration."""
        weights = get_config('scoring.weights', {})
        return cls(
            expected_value=weights.get('expected_value', 0.30),
            confidence=weights.get('confidence', 0.20),
            liquidity=weights.get('liquidity', 0.15),
            time_horizon=weights.get('time_horizon', 0.10),
            historical_edge_strength=weights.get('historical_edge_strength', 0.15),
            risk_profile=weights.get('risk_profile', 0.10)
        )


@dataclass
class ScoringThresholds:
    """Minimum thresholds for opportunity inclusion."""
    min_expected_value: float = 0.02
    min_confidence: float = 0.50
    min_liquidity_usd: float = 500
    max_time_to_resolution_days: float = 30

    @classmethod
    def from_config(cls) -> 'ScoringThresholds':
        """Load thresholds from configuration."""
        thresholds = get_config('scoring.thresholds', {})
        return cls(
            min_expected_value=thresholds.get('min_expected_value', 0.02),
            min_confidence=thresholds.get('min_confidence', 0.50),
            min_liquidity_usd=thresholds.get('min_liquidity_usd', 500),
            max_time_to_resolution_days=thresholds.get('max_time_to_resolution_days', 30)
        )


class OpportunityScorer:
    """
    Scores and ranks market opportunities.

    The scorer aggregates signals from multiple strategies and
    combines them with market metrics to produce a final ranking.

    Scoring Components:
    1. Expected Value: Potential profit margin
    2. Confidence: Agreement and certainty of signals
    3. Liquidity: Ability to enter/exit positions
    4. Time Horizon: Time until resolution
    5. Historical Edge: Track record of similar opportunities
    6. Risk Profile: Downside and uncertainty measures
    """

    def __init__(
        self,
        weights: Optional[ScoringWeights] = None,
        thresholds: Optional[ScoringThresholds] = None,
        db: Optional[Database] = None
    ):
        """
        Initialize scorer.

        Args:
            weights: Scoring component weights
            thresholds: Minimum inclusion thresholds
            db: Database for historical data
        """
        self.weights = weights or ScoringWeights.from_config()
        self.thresholds = thresholds or ScoringThresholds.from_config()
        self.db = db or get_database()

    def score_opportunities(
        self,
        signals: List[StrategyResult],
        markets: Dict[str, MarketSnapshot],
        top_n: int = 50
    ) -> List[Opportunity]:
        """
        Score and rank opportunities from signals.

        Args:
            signals: Strategy results/signals
            markets: Market snapshots keyed by market_id
            top_n: Number of top opportunities to return

        Returns:
            Ranked list of Opportunity objects
        """
        logger.info(f"Scoring {len(signals)} signals across {len(markets)} markets")

        # Group signals by market
        signals_by_market = self._group_signals_by_market(signals)

        # Score each market
        scored_markets = []
        for market_id, market_signals in signals_by_market.items():
            if market_id not in markets:
                continue

            snapshot = markets[market_id]
            opportunity = self._score_market(snapshot, market_signals)

            if opportunity is not None:
                scored_markets.append(opportunity)

        # Sort by composite score
        scored_markets.sort(key=lambda x: x.composite_score, reverse=True)

        # Assign ranks
        for i, opp in enumerate(scored_markets[:top_n]):
            opp.rank = i + 1

        logger.info(f"Ranked {len(scored_markets[:top_n])} opportunities")
        return scored_markets[:top_n]

    def _group_signals_by_market(
        self,
        signals: List[StrategyResult]
    ) -> Dict[str, List[StrategyResult]]:
        """Group signals by market ID."""
        grouped = defaultdict(list)
        for signal in signals:
            grouped[signal.market_id].append(signal)
        return dict(grouped)

    def _score_market(
        self,
        snapshot: MarketSnapshot,
        signals: List[StrategyResult]
    ) -> Optional[Opportunity]:
        """
        Score a single market based on its signals.

        Args:
            snapshot: Market snapshot
            signals: Signals for this market

        Returns:
            Opportunity or None if below thresholds
        """
        if not signals:
            return None

        # Calculate component scores
        ev_score = self._calculate_ev_score(signals)
        confidence_score = self._calculate_confidence_score(signals)
        liquidity_score = self._calculate_liquidity_score(snapshot)
        time_score = self._calculate_time_score(snapshot)
        historical_score = self._calculate_historical_score(snapshot, signals)
        risk_score = self._calculate_risk_score(snapshot, signals)

        # Apply thresholds
        avg_ev = sum(s.expected_value for s in signals) / len(signals)
        avg_confidence = sum(s.confidence for s in signals) / len(signals)

        if avg_ev < self.thresholds.min_expected_value:
            return None
        if avg_confidence < self.thresholds.min_confidence:
            return None
        if (snapshot.liquidity or 0) < self.thresholds.min_liquidity_usd:
            # Also check volume
            if (snapshot.volume_24h or 0) < self.thresholds.min_liquidity_usd:
                return None

        hours = snapshot.hours_to_resolution
        if hours and hours > self.thresholds.max_time_to_resolution_days * 24:
            return None

        # Calculate composite score
        composite_score = (
            ev_score * self.weights.expected_value +
            confidence_score * self.weights.confidence +
            liquidity_score * self.weights.liquidity +
            time_score * self.weights.time_horizon +
            historical_score * self.weights.historical_edge_strength +
            (1 - risk_score) * self.weights.risk_profile  # Lower risk = higher score
        )

        # Determine suggested direction
        direction_votes = defaultdict(float)
        for signal in signals:
            weight = signal.confidence
            direction_votes[signal.direction.value] += weight

        suggested_side = max(direction_votes.items(), key=lambda x: x[1])[0]

        # Calculate signal agreement
        total_weight = sum(direction_votes.values())
        signal_agreement = max(direction_votes.values()) / total_weight if total_weight > 0 else 0

        # Aggregate explanations
        key_factors = []
        risks = []
        for signal in signals[:5]:  # Top 5 signals
            key_factors.extend(signal.factors[:2])
            risks.extend(signal.risks[:2])

        explanation = self._build_explanation(
            snapshot, signals, composite_score, suggested_side
        )

        return Opportunity(
            rank=0,  # Will be assigned after sorting
            market_id=snapshot.market_id,
            market_name=snapshot.question,
            source=snapshot.source,
            timestamp=datetime.utcnow(),
            composite_score=composite_score,
            expected_value=avg_ev,
            confidence=avg_confidence,
            risk_score=risk_score,
            current_price=snapshot.mid_price,
            liquidity=snapshot.liquidity or 0,
            volume_24h=snapshot.volume_24h or 0,
            hours_to_resolution=snapshot.hours_to_resolution,
            signals=[s.to_signal() for s in signals],
            signal_agreement=signal_agreement,
            suggested_side=suggested_side,
            suggested_size=self._calculate_suggested_size(signals, risk_score),
            explanation=explanation,
            key_factors=list(set(key_factors))[:5],
            risks=list(set(risks))[:5]
        )

    def _calculate_ev_score(self, signals: List[StrategyResult]) -> float:
        """Calculate expected value score (0-1)."""
        if not signals:
            return 0

        # Weight by confidence
        total_weight = sum(s.confidence for s in signals)
        if total_weight == 0:
            return 0

        weighted_ev = sum(s.expected_value * s.confidence for s in signals) / total_weight

        # Normalize: 10% EV = score of 1.0
        return min(weighted_ev / 0.10, 1.0)

    def _calculate_confidence_score(self, signals: List[StrategyResult]) -> float:
        """Calculate confidence score (0-1)."""
        if not signals:
            return 0

        # Average confidence
        avg_confidence = sum(s.confidence for s in signals) / len(signals)

        # Bonus for multiple agreeing signals
        directions = [s.direction for s in signals]
        most_common = max(set(directions), key=directions.count)
        agreement_rate = directions.count(most_common) / len(directions)

        # Combined score
        score = (avg_confidence * 0.7) + (agreement_rate * 0.3)
        return min(score, 1.0)

    def _calculate_liquidity_score(self, snapshot: MarketSnapshot) -> float:
        """Calculate liquidity score (0-1)."""
        liquidity = snapshot.liquidity or snapshot.volume_24h or 0

        # $10,000 liquidity = score of 1.0
        score = min(liquidity / 10000, 1.0)

        # Penalty for very thin markets
        if liquidity < 500:
            score *= 0.5

        return score

    def _calculate_time_score(self, snapshot: MarketSnapshot) -> float:
        """Calculate time horizon score (0-1)."""
        hours = snapshot.hours_to_resolution

        if hours is None:
            return 0.5  # Unknown

        # Optimal: 12-72 hours
        if 12 <= hours <= 72:
            return 1.0
        elif 6 <= hours < 12:
            return 0.8
        elif 72 < hours <= 168:  # 1 week
            return 0.7
        elif hours < 6:
            return 0.5  # Too close
        else:
            # Decay for longer horizons
            return max(0.3, 1.0 - (hours - 168) / 720)

    def _calculate_historical_score(
        self,
        snapshot: MarketSnapshot,
        signals: List[StrategyResult]
    ) -> float:
        """
        Calculate historical edge strength score.

        Based on past performance of similar signals.
        """
        # This would ideally use backtesting results
        # For now, use signal strength as proxy
        if not signals:
            return 0.5

        avg_strength = sum(abs(s.signal_strength) for s in signals) / len(signals)
        return min(avg_strength, 1.0)

    def _calculate_risk_score(
        self,
        snapshot: MarketSnapshot,
        signals: List[StrategyResult]
    ) -> float:
        """Calculate risk score (0-1, higher = more risky)."""
        risk = 0.3  # Base risk

        # Price extremes increase risk
        price = snapshot.mid_price
        if price < 0.10 or price > 0.90:
            risk += 0.2
        if price < 0.05 or price > 0.95:
            risk += 0.1

        # Low liquidity increases risk
        liquidity = snapshot.liquidity or 0
        if liquidity < 1000:
            risk += 0.15
        if liquidity < 500:
            risk += 0.15

        # Near resolution increases risk
        hours = snapshot.hours_to_resolution
        if hours and hours < 6:
            risk += 0.1

        # Low confidence increases risk
        if signals:
            avg_confidence = sum(s.confidence for s in signals) / len(signals)
            if avg_confidence < 0.6:
                risk += 0.1

        return min(risk, 1.0)

    def _calculate_suggested_size(
        self,
        signals: List[StrategyResult],
        risk_score: float
    ) -> float:
        """Calculate suggested position size."""
        if not signals:
            return 0

        # Average kelly fraction
        kelly_fractions = [s.kelly_fraction for s in signals if s.kelly_fraction]
        if not kelly_fractions:
            return 0.02  # Default 2%

        avg_kelly = sum(kelly_fractions) / len(kelly_fractions)

        # Reduce for risk
        adjusted = avg_kelly * (1 - risk_score)

        # Cap at 10%
        return min(adjusted, 0.10)

    def _build_explanation(
        self,
        snapshot: MarketSnapshot,
        signals: List[StrategyResult],
        score: float,
        suggested_side: str
    ) -> str:
        """Build explanation for the opportunity."""
        strategy_names = list(set(s.strategy_name for s in signals))

        return (
            f"Score: {score:.2f}. "
            f"{len(signals)} signals from {len(strategy_names)} strategies "
            f"({', '.join(strategy_names[:3])}). "
            f"Suggested: {suggested_side.upper()} at {snapshot.mid_price:.1%}. "
            f"Resolution in {snapshot.hours_to_resolution:.0f}h."
            if snapshot.hours_to_resolution else
            f"Score: {score:.2f}. {len(signals)} signals. Suggested: {suggested_side.upper()}."
        )


def rank_opportunities(
    signals: List[StrategyResult],
    markets: Dict[str, MarketSnapshot],
    top_n: int = 50,
    db: Optional[Database] = None
) -> List[Opportunity]:
    """
    Convenience function to rank opportunities.

    Args:
        signals: Strategy signals
        markets: Market snapshots
        top_n: Number of top opportunities
        db: Database instance

    Returns:
        Ranked opportunities
    """
    scorer = OpportunityScorer(db=db)
    return scorer.score_opportunities(signals, markets, top_n)
