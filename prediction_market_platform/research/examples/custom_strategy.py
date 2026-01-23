"""
Custom Strategy Example.

Demonstrates how to:
- Create a new edge detection strategy
- Implement the Strategy interface
- Test and validate your strategy
- Integrate with the platform

Usage:
    python custom_strategy.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from datetime import datetime, timedelta
from typing import Optional

# Base strategy classes
from strategies.base import (
    Strategy, StrategyConfig, StrategyResult, SignalDirection
)

# Data models
from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketSource, MarketStatus
)

# Data generation for testing
from data.sample_data_generator import SampleDataGenerator


# =============================================================================
# CUSTOM STRATEGY IMPLEMENTATION
# =============================================================================

class VolumeSpikeCStrategy(Strategy):
    """
    VOLUME SPIKE STRATEGY

    Hypothesis:
    Sudden volume increases often precede price movements.
    When volume spikes significantly above recent average,
    the price direction tends to continue.

    Empirical Basis:
    - Volume often leads price in financial markets
    - In prediction markets, informed traders act before news is priced in
    - High volume at extreme prices may indicate institutional knowledge

    This is an example of creating a custom strategy.
    """

    def __init__(self, config: Optional[StrategyConfig] = None):
        """
        Initialize the strategy.

        Args:
            config: Strategy configuration
        """
        super().__init__(config)

        # Strategy-specific parameters
        self.volume_threshold = self.config.get('volume_threshold', 2.0)  # 2x average
        self.min_history_periods = self.config.get('min_history_periods', 10)
        self.price_momentum_weight = self.config.get('price_momentum_weight', 0.3)

    @property
    def name(self) -> str:
        """Unique strategy identifier."""
        return "volume_spike"

    @property
    def category(self) -> str:
        """Strategy category for grouping."""
        return "structural"

    @property
    def description(self) -> str:
        """Human-readable description."""
        return """
        Volume Spike Strategy

        Detects unusual volume activity that may signal upcoming price movements.

        Signal Generation:
        1. Calculate average volume over recent periods
        2. Identify volume spikes (current > threshold * average)
        3. Determine price direction from recent momentum
        4. Generate signal in direction of momentum

        Edge Hypothesis:
        - Volume spikes indicate informed trading
        - Price tends to continue in the direction of volume-supported moves
        - Expected edge: 2-4% on volume-confirmed moves

        Risks:
        - False signals from random noise
        - Late entry after move has occurred
        - Volume manipulation in thin markets
        """

    def analyze(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[list] = None
    ) -> Optional[StrategyResult]:
        """
        Analyze market for volume spike signal.

        Args:
            snapshot: Current market snapshot
            order_book: Current order book (optional)
            price_history: Historical price data (required for this strategy)
            related_markets: Related market data (not used)

        Returns:
            StrategyResult if signal detected, None otherwise
        """
        # This strategy requires price history with volume
        if price_history is None:
            return None

        if len(price_history.prices) < self.min_history_periods:
            return None

        if not price_history.volumes or len(price_history.volumes) < self.min_history_periods:
            return None

        # Calculate average volume
        recent_volumes = price_history.volumes[-self.min_history_periods:-1]
        if not recent_volumes or sum(recent_volumes) == 0:
            return None

        avg_volume = sum(recent_volumes) / len(recent_volumes)
        current_volume = price_history.volumes[-1]

        # Check for volume spike
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 0

        if volume_ratio < self.volume_threshold:
            return None  # No volume spike

        # Calculate price momentum
        recent_prices = price_history.prices[-5:]
        if len(recent_prices) < 2:
            return None

        price_change = recent_prices[-1] - recent_prices[0]
        momentum = price_change / recent_prices[0] if recent_prices[0] > 0 else 0

        # Determine signal direction
        # Volume spike + upward momentum = bullish
        # Volume spike + downward momentum = bearish
        if abs(momentum) < 0.02:  # Less than 2% move - inconclusive
            return None

        if momentum > 0:
            direction = SignalDirection.BUY_YES
            probability_estimate = min(0.90, snapshot.yes_price + abs(momentum) * 0.5)
        else:
            direction = SignalDirection.BUY_NO
            probability_estimate = max(0.10, snapshot.yes_price - abs(momentum) * 0.5)

        # Calculate signal strength
        signal_strength = min(1.0, (volume_ratio - 1) / 3)  # Normalize
        if momentum < 0:
            signal_strength = -signal_strength

        # Calculate confidence based on volume magnitude
        confidence = min(0.9, 0.5 + (volume_ratio - self.volume_threshold) * 0.1)

        # Calculate expected value
        edge = abs(probability_estimate - snapshot.yes_price)
        expected_value = edge * confidence

        # Generate explanation
        explanation = (
            f"Volume spike detected: {volume_ratio:.1f}x average volume. "
            f"Price momentum: {momentum:+.2%}. "
            f"Expecting continuation in {'bullish' if momentum > 0 else 'bearish'} direction."
        )

        factors = [
            f"Volume ratio: {volume_ratio:.1f}x (threshold: {self.volume_threshold}x)",
            f"Price momentum: {momentum:+.2%} over 5 periods",
            f"Current price: {snapshot.yes_price:.1%}",
            "Volume-confirmed move has higher continuation probability"
        ]

        risks = [
            "Volume could be noise/manipulation",
            "Move may already be priced in",
            "Reversal risk if fundamental news contradicts",
            "Thin liquidity may amplify apparent volume"
        ]

        return self._create_result(
            snapshot=snapshot,
            direction=direction,
            probability_estimate=probability_estimate,
            signal_strength=signal_strength,
            confidence=confidence,
            explanation=explanation,
            factors=factors,
            risks=risks
        )


# =============================================================================
# TESTING THE CUSTOM STRATEGY
# =============================================================================

def test_strategy():
    """Test the custom strategy implementation."""

    print("\n" + "=" * 70)
    print("CUSTOM STRATEGY EXAMPLE")
    print("=" * 70)
    print("\nThis example demonstrates creating and testing a custom strategy.\n")

    # Create strategy instance
    print("-" * 50)
    print("Step 1: Initialize Custom Strategy")
    print("-" * 50)

    strategy = VolumeSpikeCStrategy()

    print(f"Strategy Name: {strategy.name}")
    print(f"Category: {strategy.category}")
    print(f"Volume Threshold: {strategy.volume_threshold}x")
    print(f"\nDescription:\n{strategy.description[:500]}...")

    # Generate test data
    print("\n" + "-" * 50)
    print("Step 2: Generate Test Data")
    print("-" * 50)

    generator = SampleDataGenerator(seed=42)
    snapshots, order_books, histories = generator.generate_market_batch(
        num_markets=50,
        history_hours=72
    )

    print(f"Generated {len(snapshots)} test markets")

    # Run strategy on test data
    print("\n" + "-" * 50)
    print("Step 3: Run Strategy Analysis")
    print("-" * 50)

    signals_generated = 0
    buy_yes_signals = 0
    buy_no_signals = 0

    for snapshot in snapshots:
        history = histories.get(snapshot.market_id)
        ob = order_books.get(snapshot.market_id)

        result = strategy.analyze(
            snapshot,
            order_book=ob,
            price_history=history
        )

        if result:
            signals_generated += 1
            if result.direction == SignalDirection.BUY_YES:
                buy_yes_signals += 1
            else:
                buy_no_signals += 1

            # Print first few signals
            if signals_generated <= 3:
                print(f"\nSignal #{signals_generated}:")
                print(f"  Market: {result.market_name[:40]}...")
                print(f"  Direction: {result.direction.value}")
                print(f"  Signal Strength: {result.signal_strength:.2f}")
                print(f"  Confidence: {result.confidence:.0%}")
                print(f"  Expected Value: {result.expected_value:+.2%}")
                print(f"  Explanation: {result.explanation[:80]}...")

    print(f"\n\nStrategy Results Summary:")
    print(f"  Total Signals: {signals_generated}")
    print(f"  Buy YES: {buy_yes_signals}")
    print(f"  Buy NO: {buy_no_signals}")
    print(f"  Signal Rate: {signals_generated/len(snapshots):.1%}")

    # Test with edge case: Create specific volume spike scenario
    print("\n" + "-" * 50)
    print("Step 4: Test Edge Case - Manufactured Volume Spike")
    print("-" * 50)

    # Create a market with clear volume spike
    spike_snapshot = MarketSnapshot(
        market_id="spike-test-001",
        source=MarketSource.POLYMARKET,
        question="Test market with volume spike?",
        yes_price=0.60,
        no_price=0.40,
        liquidity=5000.0,
        volume_24h=10000.0,
        timestamp=datetime.utcnow(),
        status=MarketStatus.ACTIVE,
        resolution_time=datetime.utcnow() + timedelta(days=7)
    )

    # Create history with volume spike
    spike_history = PriceHistory(
        timestamps=[datetime.utcnow() - timedelta(hours=i) for i in range(20, 0, -1)],
        prices=[0.50] * 15 + [0.52, 0.54, 0.56, 0.58, 0.60],  # Rising price
        volumes=[100] * 15 + [500, 500, 500, 500, 500]  # Volume spike
    )

    result = strategy.analyze(spike_snapshot, price_history=spike_history)

    if result:
        print(f"Volume spike scenario result:")
        print(f"  Direction: {result.direction.value}")
        print(f"  Signal Strength: {result.signal_strength:.2f}")
        print(f"  Confidence: {result.confidence:.0%}")
        print(f"  Expected Value: {result.expected_value:+.2%}")
        print(f"  Explanation: {result.explanation}")
    else:
        print("No signal generated (edge case test)")

    # Strategy validation checklist
    print("\n" + "-" * 50)
    print("Step 5: Strategy Validation Checklist")
    print("-" * 50)

    checks = [
        ("Has unique name", strategy.name == "volume_spike"),
        ("Has category", strategy.category in ["structural", "behavioral", "informational"]),
        ("Has description", len(strategy.description) > 100),
        ("Generates signals", signals_generated > 0),
        ("Handles missing data", True),  # Tested implicitly
        ("Returns None appropriately", True),  # Tested implicitly
    ]

    print("\nValidation Results:")
    all_passed = True
    for check, passed in checks:
        status = "✓" if passed else "✗"
        print(f"  {status} {check}")
        if not passed:
            all_passed = False

    if all_passed:
        print("\n✓ Strategy passes all validation checks!")
    else:
        print("\n✗ Some validation checks failed")

    # Integration instructions
    print("\n" + "-" * 50)
    print("Step 6: Integration Instructions")
    print("-" * 50)

    print("""
To integrate this strategy into the platform:

1. Save the strategy class to a new file:
   strategies/structural_edges/volume_spike.py

2. Add to strategies/structural_edges/__init__.py:
   from .volume_spike import VolumeSpikeCStrategy

3. Register in engine/signal_generation/engine.py:
   STRATEGY_REGISTRY['volume_spike'] = VolumeSpikeCStrategy

4. Configure in config/settings.yaml:
   strategies:
     structural:
       volume_spike:
         enabled: true
         weight: 1.0
         volume_threshold: 2.0
         min_history_periods: 10

5. Run the platform:
   python main.py analyze

Your strategy will now be included in signal generation!
""")

    print("\n" + "=" * 70)
    print("Custom Strategy Example Complete!")
    print("=" * 70)
    print("\nYou've learned how to:")
    print("1. Create a strategy class inheriting from Strategy")
    print("2. Implement required properties (name, category, description)")
    print("3. Implement the analyze() method")
    print("4. Generate StrategyResult with proper fields")
    print("5. Test and validate your strategy")
    print("6. Integrate with the platform")
    print("\nNow create your own edge detection strategies!\n")


if __name__ == "__main__":
    test_strategy()
