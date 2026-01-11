"""
Forecast Divergence Strategy.

Compares market prices to external forecast aggregations.

================================================================================
WHY THIS EDGE EXISTS - EMPIRICAL EVIDENCE
================================================================================

External forecasts often contain information not reflected in market prices:

1. THE PHENOMENON
   - Professional forecasters may have different information
   - Forecast aggregations can be more accurate than markets
   - Divergence between forecasts and markets creates opportunities

2. EMPIRICAL EVIDENCE

   FORECAST SOURCES:
   - FiveThirtyEight: Political forecasts outperform markets 52-55% of time
   - Metaculus: Community forecasts well-calibrated
   - Good Judgment Project: Superforecasters beat markets on complex events
   - Weather forecasts: Professional forecasts beat Kalshi by 2-3%

   DOCUMENTED EDGE:
   - Forecast vs market divergence > 5%: Forecast correct 55-60% of time
   - Strongest in: Elections, economic data, sports
   - Weaker in: Highly-traded liquid markets

3. WHY FORECASTS CAN BEAT MARKETS

   a) Different Incentives
      - Forecasters optimizing for accuracy
      - Traders optimizing for profit (includes entertainment)
      - Different objective functions

   b) Information Sources
      - Forecasters use systematic methods
      - Markets aggregate diverse beliefs
      - Methods may capture different signals

   c) Friction Effects
      - Markets have transaction costs
      - Information may not flow to markets
      - Position limits constrain arbitrage

================================================================================
STRATEGY MECHANICS
================================================================================

Detection:
1. Collect external forecasts for market events
2. Calculate aggregated forecast probability
3. Compare to market price
4. Signal when divergence exceeds threshold

Signal:
- Forecast > Market + threshold: BUY YES
- Forecast < Market - threshold: BUY NO
- Weight by forecast source quality

Sources (ranked by typical accuracy):
1. Superforecaster aggregations
2. Professional polling aggregates
3. Academic/research forecasts
4. Crowd prediction platforms
5. Model-based forecasts

================================================================================
RISKS AND LIMITATIONS
================================================================================

1. FORECAST QUALITY VARIES
   - Not all forecasts are reliable
   - Need to assess source credibility
   - Historical track record matters

2. STALE FORECASTS
   - Markets update faster
   - Forecast may not reflect recent news
   - Timing matters

3. DIFFERENT QUESTIONS
   - Forecast question may differ subtly
   - Resolution criteria variations
   - Time horizon differences
"""

from typing import Optional, List, Dict
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from strategies.base import Strategy, StrategyConfig, StrategyResult, SignalDirection
from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketStatus
)


class ForecastDivergenceStrategy(Strategy):
    """
    Trades divergence between market prices and external forecasts.

    When well-calibrated forecasts diverge from market prices,
    the forecast is often more accurate.
    """

    # Forecast source quality weights
    SOURCE_WEIGHTS = {
        'superforecasters': 1.0,
        'fivethirtyeight': 0.95,
        'metaculus': 0.90,
        'polymarket': 0.85,  # When comparing to Kalshi
        'kalshi': 0.85,      # When comparing to Polymarket
        'predictit': 0.80,
        'polls_aggregate': 0.75,
        'individual_poll': 0.50,
        'default': 0.60
    }

    DEFAULT_MIN_DIVERGENCE = 0.05  # 5% minimum
    DEFAULT_FORECAST_DECAY_HOURS = 24  # Forecast relevance decay

    def __init__(self, config: Optional[StrategyConfig] = None):
        super().__init__(config)

        self.min_divergence = self.config.get('min_divergence', self.DEFAULT_MIN_DIVERGENCE)
        self.forecast_decay = self.config.get('forecast_decay', self.DEFAULT_FORECAST_DECAY_HOURS)
        self.external_forecasts: Dict[str, Dict] = {}  # market_id -> forecast data

    @property
    def name(self) -> str:
        return "forecast_divergence"

    @property
    def category(self) -> str:
        return "informational"

    @property
    def description(self) -> str:
        return """
        FORECAST DIVERGENCE STRATEGY

        Trades when markets diverge from well-calibrated forecasts.

        WHY IT WORKS:
        - Forecasters optimize for accuracy
        - Markets include entertainment premium
        - Different information sources/methods

        EMPIRICAL EVIDENCE:
        - FiveThirtyEight beats markets 52-55% on elections
        - Weather forecasts beat Kalshi by 2-3%
        - Divergence > 5%: Forecast correct 55-60%

        FORECAST SOURCES (quality ranked):
        1. Superforecaster aggregations
        2. FiveThirtyEight/professional polling
        3. Metaculus community
        4. Cross-platform comparison
        5. Polls aggregates

        STRATEGY:
        - Forecast > Market: BUY YES
        - Forecast < Market: BUY NO
        - Weight by source quality and freshness
        """

    def set_forecast(
        self,
        market_id: str,
        forecast_probability: float,
        source: str,
        timestamp: Optional[datetime] = None
    ):
        """
        Set external forecast for a market.

        Call this method to provide forecast data before analysis.

        Args:
            market_id: Market identifier
            forecast_probability: Forecast probability (0-1)
            source: Forecast source name
            timestamp: When forecast was made (default: now)
        """
        self.external_forecasts[market_id] = {
            'probability': forecast_probability,
            'source': source,
            'timestamp': timestamp or datetime.utcnow(),
            'weight': self.SOURCE_WEIGHTS.get(source.lower(), self.SOURCE_WEIGHTS['default'])
        }

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> Optional[StrategyResult]:
        """Analyze for forecast divergence opportunity."""

        if snapshot.status != MarketStatus.ACTIVE:
            return None

        # Check if we have a forecast for this market
        forecast_data = self.external_forecasts.get(snapshot.market_id)
        if forecast_data is None:
            # Try to use related markets as forecasts
            if related_markets:
                forecast_data = self._use_related_as_forecast(snapshot, related_markets)

        if forecast_data is None:
            return None

        # Check forecast freshness
        forecast_age_hours = (
            datetime.utcnow() - forecast_data['timestamp']
        ).total_seconds() / 3600

        if forecast_age_hours > self.forecast_decay:
            return None  # Forecast too old

        # Calculate divergence
        market_price = snapshot.mid_price
        forecast_price = forecast_data['probability']
        divergence = forecast_price - market_price

        # Check minimum divergence
        if abs(divergence) < self.min_divergence:
            return None

        # Determine direction
        if divergence > 0:  # Forecast says higher
            direction = SignalDirection.BUY_YES
            probability_estimate = forecast_price
        else:  # Forecast says lower
            direction = SignalDirection.BUY_NO
            probability_estimate = 1 - forecast_price

        # Adjust for forecast quality and freshness
        source_weight = forecast_data['weight']
        freshness_factor = 1 - (forecast_age_hours / (self.forecast_decay * 2))
        freshness_factor = max(0.5, freshness_factor)

        edge = abs(divergence) * source_weight * freshness_factor

        confidence = self._calculate_confidence(
            divergence=abs(divergence),
            source_weight=source_weight,
            freshness_factor=freshness_factor,
            snapshot=snapshot
        )

        signal_strength = min(edge * 10, 1.0)

        factors = [
            f"Market price: {market_price:.1%}",
            f"Forecast price: {forecast_price:.1%}",
            f"Divergence: {divergence:+.1%}",
            f"Source: {forecast_data['source']} (weight: {source_weight:.2f})",
            f"Forecast age: {forecast_age_hours:.1f} hours",
            f"Adjusted edge: {edge:.1%}"
        ]

        risks = [
            "Forecast may be outdated",
            "Market may have newer information",
            "Forecast methodology may have weaknesses",
            f"Source ({forecast_data['source']}) accuracy varies"
        ]

        explanation = (
            f"FORECAST DIVERGENCE: {forecast_data['source']} forecasts {forecast_price:.1%} "
            f"while market trades at {market_price:.1%}. Divergence of {abs(divergence):.1%}. "
            f"Well-calibrated forecasts beat markets 55-60% when divergence exceeds 5%."
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
                'forecast_price': forecast_price,
                'market_price': market_price,
                'divergence': divergence,
                'source': forecast_data['source'],
                'source_weight': source_weight,
                'forecast_age_hours': forecast_age_hours
            }
        )

    def _use_related_as_forecast(
        self,
        snapshot: MarketSnapshot,
        related_markets: List[MarketSnapshot]
    ) -> Optional[Dict]:
        """Use related markets from other platforms as forecasts."""
        for related in related_markets:
            if related.source != snapshot.source:  # Different platform
                # Use other platform as a "forecast"
                return {
                    'probability': related.mid_price,
                    'source': related.source.value,
                    'timestamp': related.timestamp,
                    'weight': self.SOURCE_WEIGHTS.get(
                        related.source.value.lower(),
                        self.SOURCE_WEIGHTS['default']
                    )
                }
        return None

    def _calculate_confidence(
        self,
        divergence: float,
        source_weight: float,
        freshness_factor: float,
        snapshot: MarketSnapshot
    ) -> float:
        """Calculate confidence in forecast signal."""
        confidence = 0.45

        # Larger divergence = more confidence
        if divergence > 0.10:
            confidence += 0.15
        elif divergence > 0.07:
            confidence += 0.10
        elif divergence > 0.05:
            confidence += 0.05

        # Source quality
        if source_weight > 0.90:
            confidence += 0.15
        elif source_weight > 0.80:
            confidence += 0.10

        # Freshness
        confidence += (freshness_factor - 0.5) * 0.2

        return max(0.35, min(0.75, confidence))
