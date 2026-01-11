"""
Slow-Updating Market Strategy.

Identifies markets that are slow to incorporate new information.

================================================================================
WHY THIS EDGE EXISTS - EMPIRICAL EVIDENCE
================================================================================

Some markets update slower than others, creating temporary mispricings:

1. THE PHENOMENON
   - Information arrives but prices don't move
   - Low attention = slow price discovery
   - Stale prices diverge from fair value

2. EMPIRICAL EVIDENCE

   PREDICTION MARKETS:
   - Low-volume markets lag high-volume markets
   - Information cascades from liquid to illiquid markets
   - Lag time: 15 minutes to several hours

   DOCUMENTED PATTERNS:
   - News hits major market first
   - Related low-volume markets lag
   - Edge: Trade lagging market in direction of lead market

3. CAUSES OF SLOW UPDATING

   a) Low Attention
      - Fewer traders watching
      - Slower information incorporation
      - Price discovery is a function of attention

   b) Liquidity Constraints
      - Informed traders can't easily take positions
      - Wide spreads discourage trading
      - Position limits bind

   c) Information Barriers
      - Not obvious which markets are related
      - Requires analysis to connect dots
      - Most traders don't do this work

================================================================================
STRATEGY MECHANICS
================================================================================

Detection:
1. Monitor for price movements in lead markets
2. Check related/similar markets for price response
3. Identify markets that haven't responded
4. Trade the expected catch-up

Signal:
- Lead market moved UP: BUY YES on lagging market
- Lead market moved DOWN: BUY NO on lagging market
- Expected edge: 50-70% of lead market move

Timing:
- Detect within minutes to hours of lead market move
- Exit when price converges OR after 6-12 hours

================================================================================
RISKS AND LIMITATIONS
================================================================================

1. FALSE LEADS
   - Lead market move may be noise
   - Lagging market may be more informed
   - Need to verify relationship

2. TIMING
   - Hard to know when lag will resolve
   - May need to hold position
   - Opportunity cost

3. STRUCTURAL DIFFERENCES
   - Markets may have legitimate price differences
   - Resolution criteria variations
"""

from typing import Optional, List
from datetime import datetime

from ..base import Strategy, StrategyConfig, StrategyResult, SignalDirection
from ...engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketStatus
)


class SlowUpdatingMarketStrategy(Strategy):
    """
    Trades markets that are slow to incorporate information.

    When lead markets move and related markets don't follow,
    the lagging market often catches up.
    """

    DEFAULT_MIN_LEAD_MOVE = 0.05  # 5% minimum lead market move
    DEFAULT_MAX_LAG = 0.03  # Lagging market should have moved more
    DEFAULT_STALENESS_HOURS = 6

    def __init__(self, config: Optional[StrategyConfig] = None):
        super().__init__(config)

        self.min_lead_move = self.config.get('min_lead_move', self.DEFAULT_MIN_LEAD_MOVE)
        self.max_lag = self.config.get('max_lag', self.DEFAULT_MAX_LAG)
        self.staleness_hours = self.config.get('staleness_hours', self.DEFAULT_STALENESS_HOURS)

    @property
    def name(self) -> str:
        return "slow_updating_market"

    @property
    def category(self) -> str:
        return "informational"

    @property
    def description(self) -> str:
        return """
        SLOW-UPDATING MARKET STRATEGY

        Trades markets slow to incorporate information.

        WHY IT WORKS:
        - Low attention = slow price discovery
        - Information cascades from liquid to illiquid
        - Lag time: 15 minutes to several hours

        EMPIRICAL EVIDENCE:
        - News hits major markets first
        - Related low-volume markets lag
        - Expected catch-up: 50-70% of lead move

        DETECTION:
        - Monitor lead market movements
        - Check related markets for response
        - Flag non-responsive markets

        STRATEGY:
        - Lead market UP: BUY YES on lagging
        - Lead market DOWN: BUY NO on lagging
        - Exit when converged OR after 6-12h
        """

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """Analyze for slow-updating opportunity."""

        if snapshot.status != MarketStatus.ACTIVE:
            return None

        if not related_markets or len(related_markets) == 0:
            return None

        # Find lead market (typically highest volume)
        lead_market = self._find_lead_market(snapshot, related_markets)
        if lead_market is None:
            return None

        # Check if this market is lagging
        lag_info = self._calculate_lag(snapshot, lead_market, price_history)
        if lag_info is None:
            return None

        expected_move, lead_direction = lag_info

        # Check minimum expected move
        if abs(expected_move) < self.min_lead_move * 0.5:
            return None

        # Determine direction
        if lead_direction > 0:  # Lead market higher
            direction = SignalDirection.BUY_YES
            probability_estimate = snapshot.mid_price + expected_move
        else:  # Lead market lower
            direction = SignalDirection.BUY_NO
            probability_estimate = 1 - (snapshot.mid_price - expected_move)

        edge = abs(expected_move)

        confidence = self._calculate_confidence(
            edge=edge,
            lead_market=lead_market,
            snapshot=snapshot
        )

        signal_strength = min(edge * 10, 1.0)

        factors = [
            f"Lead market: {lead_market.market_id}",
            f"Lead price: {lead_market.mid_price:.1%}",
            f"This market: {snapshot.mid_price:.1%}",
            f"Expected catch-up: {expected_move:+.1%}",
            f"Lead 24h volume: ${lead_market.volume_24h:.0f}",
            f"This 24h volume: ${snapshot.volume_24h:.0f}",
            "Pattern: Information cascade lag"
        ]

        risks = [
            "Lead market move may be noise",
            "This market may be correctly priced",
            "Timing of convergence uncertain",
            "Relationship may not be causal"
        ]

        explanation = (
            f"SLOW UPDATE DETECTED: Lead market {lead_market.market_id} at {lead_market.mid_price:.1%} "
            f"while this market at {snapshot.mid_price:.1%}. Expected catch-up of {expected_move:+.1%} "
            f"as information diffuses from liquid to illiquid markets."
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
                'lead_market_id': lead_market.market_id,
                'lead_price': lead_market.mid_price,
                'expected_move': expected_move,
                'lead_direction': lead_direction
            },
            time_horizon_hours=self.staleness_hours
        )

    def _find_lead_market(
        self,
        snapshot: MarketSnapshot,
        related_markets: List[MarketSnapshot]
    ) -> Optional[MarketSnapshot]:
        """Find the lead (most liquid) market."""
        best_lead = None
        best_volume = snapshot.volume_24h or 0

        for market in related_markets:
            if market.status != MarketStatus.ACTIVE:
                continue

            volume = market.volume_24h or 0
            if volume > best_volume * 1.5:  # Must be significantly more liquid
                best_lead = market
                best_volume = volume

        return best_lead

    def _calculate_lag(
        self,
        snapshot: MarketSnapshot,
        lead_market: MarketSnapshot,
        price_history: Optional[PriceHistory]
    ) -> Optional[tuple]:
        """
        Calculate how much this market should catch up.

        Returns: (expected_move, direction) or None
        """
        # Price difference
        price_diff = lead_market.mid_price - snapshot.mid_price

        # Expected catch-up (markets typically converge 50-70%)
        expected_move = price_diff * 0.6  # 60% convergence expected

        if abs(expected_move) < 0.02:  # Too small
            return None

        direction = 1 if price_diff > 0 else -1

        return (expected_move, direction)

    def _calculate_confidence(
        self,
        edge: float,
        lead_market: MarketSnapshot,
        snapshot: MarketSnapshot
    ) -> float:
        """Calculate confidence in lag signal."""
        confidence = 0.45

        # Volume ratio - larger difference = more confident
        if lead_market.volume_24h and snapshot.volume_24h:
            volume_ratio = lead_market.volume_24h / snapshot.volume_24h
            if volume_ratio > 5:
                confidence += 0.15
            elif volume_ratio > 2:
                confidence += 0.10

        # Edge size
        if edge > 0.05:
            confidence += 0.10
        elif edge > 0.03:
            confidence += 0.05

        return max(0.35, min(0.70, confidence))
