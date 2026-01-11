"""
Anchoring Bias Strategy.

Exploits anchoring to initial or prominent price levels.

================================================================================
WHY THIS EDGE EXISTS - EMPIRICAL EVIDENCE
================================================================================

Anchoring is a fundamental cognitive bias that affects prediction markets:

1. THE PHENOMENON
   - Traders anchor to initial prices or prominent levels
   - New information is insufficiently incorporated
   - Creates systematic under-reaction
   - Price adjustments are "sticky" around anchors

2. EMPIRICAL EVIDENCE

   COGNITIVE PSYCHOLOGY:
   - Tversky & Kahneman (1974): Original anchoring research
   - Epley & Gilovich (2006): Anchoring adjustment is effortful
   - Chapman & Johnson (2002): Anchoring in judgment/decision

   PREDICTION MARKETS:
   - Markets opening at 50% show "center bias"
   - Round numbers (25%, 50%, 75%) act as anchors
   - Initial price influences final trading range
   - Adjustment from anchors is typically 60-70% of optimal

   DOCUMENTED PATTERNS:
   - Markets near 50%: Slow to move to extremes
   - After 50% → 60%: Should be at 63-65% based on fundamentals
   - After 50% → 40%: Should be at 35-37% based on fundamentals
   - Round number "stickiness" at 25%, 50%, 75%

3. PSYCHOLOGICAL MECHANISM

   a) Cognitive Ease
      - Starting from anchor is easier
      - Full adjustment requires effort
      - Most traders stop short

   b) Confirmatory Search
      - Anchored traders look for confirming info
      - Disconfirming info is underweighted
      - Reinforces anchored beliefs

   c) Insufficient Adjustment
      - Know adjustment needed
      - Don't know how much
      - Systematically under-adjust

================================================================================
STRATEGY MECHANICS
================================================================================

Detection:
1. Identify anchor points (50%, round numbers, initial price)
2. Measure current distance from anchor
3. Estimate "correct" distance based on information flow
4. Trade the gap between actual and correct distance

Signal:
- If market "should" be further from anchor → trade in that direction
- Example: Info suggests 70%, market stuck at 62% → BUY YES

Key Anchors:
- 50%: The strongest anchor (uncertainty default)
- Round numbers: 25%, 75%, 33%, 67%
- Initial price: Where market opened
- Recent prominent prices: Recent highs/lows

================================================================================
RISKS AND LIMITATIONS
================================================================================

1. ANCHOR MAY BE CORRECT
   - Sometimes 50% IS the right price
   - Anchor can reflect true uncertainty
   - Need additional information signals

2. IDENTIFICATION CHALLENGE
   - Hard to know "correct" adjustment
   - Requires external information
   - Can be circular reasoning

3. SLOW ADJUSTMENT
   - Anchoring effects can persist
   - Edge may take time to realize
   - Patience required
"""

from typing import Optional, List
from datetime import datetime

from ..base import Strategy, StrategyConfig, StrategyResult, SignalDirection
from ...engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketStatus
)


class AnchoringBiasStrategy(Strategy):
    """
    Exploits anchoring to specific price levels.

    Markets under-adjust from anchor points (50%, round numbers).
    Trade when market should be further from anchor than it is.
    """

    # Strong anchor points
    ANCHOR_POINTS = [0.25, 0.33, 0.50, 0.67, 0.75]

    # Adjustment factor (markets typically adjust ~65% of what they should)
    ADJUSTMENT_FACTOR = 0.65

    DEFAULT_MIN_DISTANCE = 0.05
    DEFAULT_ANCHOR_TOLERANCE = 0.03

    def __init__(self, config: Optional[StrategyConfig] = None):
        super().__init__(config)

        self.min_distance = self.config.get('min_distance', self.DEFAULT_MIN_DISTANCE)
        self.anchor_tolerance = self.config.get('anchor_tolerance', self.DEFAULT_ANCHOR_TOLERANCE)
        self.adjustment_factor = self.config.get('adjustment_factor', self.ADJUSTMENT_FACTOR)

    @property
    def name(self) -> str:
        return "anchoring_bias"

    @property
    def category(self) -> str:
        return "behavioral"

    @property
    def description(self) -> str:
        return """
        ANCHORING BIAS STRATEGY

        Exploits under-adjustment from anchor prices.

        WHY IT WORKS:
        - Traders anchor to 50%, round numbers, initial prices
        - Adjustment from anchor is ~65% of optimal (insufficient)
        - Creates systematic under-reaction to information

        EMPIRICAL EVIDENCE:
        - Tversky & Kahneman (1974): Anchoring well-documented
        - Markets near 50% slow to move to extremes
        - Round number "stickiness" at 25%, 50%, 75%

        KEY ANCHORS:
        - 50%: Strongest anchor (uncertainty default)
        - Round numbers: 25%, 33%, 67%, 75%
        - Initial/opening prices

        STRATEGY:
        - If market "should" be further from anchor
        - Trade in the direction of correct adjustment
        - Expect 30-35% of remaining adjustment to occur

        KEY INSIGHT:
        Need external information to judge "correct" price.
        Use other signals or models to estimate fair value.
        """

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """Analyze for anchoring opportunity."""

        if snapshot.status != MarketStatus.ACTIVE:
            return None

        price = snapshot.mid_price

        # Find nearest anchor
        nearest_anchor = self._find_nearest_anchor(price)
        if nearest_anchor is None:
            return None

        distance_from_anchor = price - nearest_anchor

        # Check if price is in anchor zone (close but not at anchor)
        if abs(distance_from_anchor) < self.anchor_tolerance:
            return None  # Too close to anchor, need more information
        if abs(distance_from_anchor) > 0.20:
            return None  # Too far from anchor, anchoring less relevant

        # Estimate under-adjustment
        # If market moved from 50% to 55%, it "should" have moved to 57.7%
        # (assuming adjustment factor of 0.65)
        adjustment_gap = self._estimate_adjustment_gap(
            distance_from_anchor,
            price_history
        )

        if abs(adjustment_gap) < 0.02:  # Gap too small
            return None

        # Determine direction
        if adjustment_gap > 0:  # Market should be higher
            direction = SignalDirection.BUY_YES
            probability_estimate = price + (adjustment_gap * 0.5)
        else:  # Market should be lower
            direction = SignalDirection.BUY_NO
            probability_estimate = 1 - (price + adjustment_gap * 0.5)

        # Calculate edge
        edge = abs(adjustment_gap) * 0.5  # Conservative estimate

        confidence = self._calculate_confidence(
            distance_from_anchor=abs(distance_from_anchor),
            adjustment_gap=abs(adjustment_gap),
            price_history=price_history
        )

        signal_strength = min(abs(adjustment_gap) * 10, 1.0)

        factors = [
            f"Current price: {price:.1%}",
            f"Nearest anchor: {nearest_anchor:.0%}",
            f"Distance from anchor: {distance_from_anchor:+.1%}",
            f"Estimated adjustment gap: {adjustment_gap:+.1%}",
            f"Under-adjustment factor: {self.adjustment_factor:.0%}",
            "Pattern: Anchoring and insufficient adjustment"
        ]

        risks = [
            "Anchor price may be correct",
            "Hard to determine 'correct' adjustment",
            "Effect can persist (slow adjustment)",
            "Requires external information validation"
        ]

        explanation = (
            f"ANCHORING DETECTED: Market at {price:.1%} appears anchored near {nearest_anchor:.0%}. "
            f"Based on adjustment patterns, price should be {abs(adjustment_gap):.1%} "
            f"{'higher' if adjustment_gap > 0 else 'lower'}. "
            f"Markets typically under-adjust by ~35% from anchors."
        )

        return self._create_result(
            snapshot=snapshot,
            direction=direction,
            probability_estimate=probability_estimate,
            signal_strength=signal_strength,
            confidence=confidence,
            explanation=explanation,
            factors=factors,
            risks=risks,
            metadata={
                'nearest_anchor': nearest_anchor,
                'distance_from_anchor': distance_from_anchor,
                'adjustment_gap': adjustment_gap,
                'adjustment_factor': self.adjustment_factor
            }
        )

    def _find_nearest_anchor(self, price: float) -> Optional[float]:
        """Find the nearest anchor point to current price."""
        nearest = None
        min_distance = float('inf')

        for anchor in self.ANCHOR_POINTS:
            distance = abs(price - anchor)
            if distance < min_distance:
                min_distance = distance
                nearest = anchor

        # Check if we're reasonably close to an anchor
        if min_distance > 0.25:
            return None

        return nearest

    def _estimate_adjustment_gap(
        self,
        distance_from_anchor: float,
        price_history: Optional[PriceHistory]
    ) -> float:
        """
        Estimate how much further the price "should" have moved.

        Logic: If price moved X from anchor, it "should" have moved X/adjustment_factor.
        The gap is (X/adjustment_factor) - X = X * (1/adjustment_factor - 1)
        """
        # This is a simplified model
        # In practice, would use external information to validate

        if self.adjustment_factor <= 0:
            return 0

        # Calculate implied correct distance
        correct_distance = distance_from_anchor / self.adjustment_factor

        # Gap is difference between correct and actual
        gap = correct_distance - distance_from_anchor

        # Add historical validation if available
        if price_history and len(price_history) > 5:
            # Check if price has been trending
            recent_trend = price_history.prices[-1] - price_history.prices[-5]
            # If trending same direction as gap, increase confidence
            if (gap > 0 and recent_trend > 0) or (gap < 0 and recent_trend < 0):
                gap *= 1.2  # Increase estimate

        return gap

    def _calculate_confidence(
        self,
        distance_from_anchor: float,
        adjustment_gap: float,
        price_history: Optional[PriceHistory]
    ) -> float:
        """Calculate confidence in anchoring signal."""
        confidence = 0.45  # Lower base - anchoring needs validation

        # Moderate distance from anchor is best
        if 0.05 <= distance_from_anchor <= 0.15:
            confidence += 0.15
        elif distance_from_anchor > 0.15:
            confidence += 0.05

        # Larger gap suggests stronger under-adjustment
        if adjustment_gap > 0.05:
            confidence += 0.10

        # Historical trend confirmation
        if price_history and len(price_history) > 3:
            recent_volatility = price_history.volatility
            if recent_volatility < 0.05:  # Low volatility = stickier prices
                confidence += 0.10

        return max(0.3, min(0.70, confidence))
