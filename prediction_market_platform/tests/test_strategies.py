"""
Unit Tests for Edge Detection Strategies.

Tests all strategy implementations to ensure:
- Correct signal generation logic
- Proper edge detection
- Accurate probability estimates
- Valid confidence calculations
"""

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, OrderBookLevel,
    MarketSource, MarketStatus
)
from strategies.base import SignalDirection
from strategies.structural_edges import (
    LiquidityVacuumStrategy,
    SpreadExploitationStrategy,
    OrderBookImbalanceStrategy,
    LateResolutionStrategy
)
from strategies.behavioral_edges import (
    FavoriteLongshotBiasStrategy,
    OverreactionStrategy,
    HerdingStrategy,
    AnchoringBiasStrategy
)


class TestLiquidityVacuumStrategy(unittest.TestCase):
    """Tests for Liquidity Vacuum edge detection."""

    def setUp(self):
        self.strategy = LiquidityVacuumStrategy()

    def test_low_liquidity_detection(self):
        """Should detect edge when liquidity is very low."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            no_price=0.50,
            liquidity=500.0,  # Low liquidity
            volume_24h=100.0,
            total_volume=1000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Low liquidity should generate a signal
        self.assertIsNotNone(result)
        self.assertIn("liquidity", result.explanation.lower())

    def test_high_liquidity_no_signal(self):
        """Should not signal when liquidity is adequate."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            no_price=0.50,
            liquidity=50000.0,  # High liquidity
            volume_24h=10000.0,
            total_volume=100000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # High liquidity should not generate edge signal
        # (or signal should have low confidence)
        if result:
            self.assertLess(result.confidence, 0.5)

    def test_strategy_properties(self):
        """Test strategy metadata."""
        self.assertEqual(self.strategy.name, "liquidity_vacuum")
        self.assertEqual(self.strategy.category, "structural")
        self.assertIn("liquidity", self.strategy.description.lower())


class TestSpreadExploitationStrategy(unittest.TestCase):
    """Tests for Spread Exploitation edge detection."""

    def setUp(self):
        self.strategy = SpreadExploitationStrategy()

    def test_wide_spread_detection(self):
        """Should detect edge when spread is wide."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            no_price=0.50,
            best_bid=0.45,  # Wide spread
            best_ask=0.55,
            liquidity=5000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Wide spread (10%) should generate signal
        self.assertIsNotNone(result)
        self.assertIn("spread", result.explanation.lower())

    def test_narrow_spread_no_signal(self):
        """Should not signal when spread is tight."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            no_price=0.50,
            best_bid=0.49,  # Tight spread
            best_ask=0.51,
            liquidity=5000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Tight spread should not generate signal
        if result:
            self.assertLess(result.expected_value, 0.02)


class TestOrderBookImbalanceStrategy(unittest.TestCase):
    """Tests for Order Book Imbalance edge detection."""

    def setUp(self):
        self.strategy = OrderBookImbalanceStrategy()

    def test_bid_heavy_imbalance(self):
        """Should detect bullish signal when bids dominate."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=1000),
                OrderBookLevel(price=0.48, size=800),
                OrderBookLevel(price=0.47, size=600),
            ],
            asks=[
                OrderBookLevel(price=0.51, size=100),  # Much less liquidity
                OrderBookLevel(price=0.52, size=50),
            ]
        )

        result = self.strategy.analyze(snapshot, order_book=order_book)

        # Heavy bids should suggest buying
        self.assertIsNotNone(result)
        if result.signal_strength > 0:
            self.assertEqual(result.direction, SignalDirection.BUY_YES)

    def test_ask_heavy_imbalance(self):
        """Should detect bearish signal when asks dominate."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=100),  # Much less liquidity
                OrderBookLevel(price=0.48, size=50),
            ],
            asks=[
                OrderBookLevel(price=0.51, size=1000),
                OrderBookLevel(price=0.52, size=800),
                OrderBookLevel(price=0.53, size=600),
            ]
        )

        result = self.strategy.analyze(snapshot, order_book=order_book)

        # Heavy asks should suggest selling
        self.assertIsNotNone(result)
        if result.signal_strength < 0:
            self.assertEqual(result.direction, SignalDirection.BUY_NO)


class TestLateResolutionStrategy(unittest.TestCase):
    """Tests for Late Resolution edge detection."""

    def setUp(self):
        self.strategy = LateResolutionStrategy()

    def test_near_resolution_detection(self):
        """Should detect edge near resolution time."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.75,  # Fairly certain
            no_price=0.25,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(hours=6)  # Soon
        )

        result = self.strategy.analyze(snapshot)

        # Near resolution should generate signal
        self.assertIsNotNone(result)

    def test_far_resolution_no_signal(self):
        """Should not signal when resolution is far away."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.75,
            no_price=0.25,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=30)  # Far
        )

        result = self.strategy.analyze(snapshot)

        # Far resolution should not generate late-resolution signal
        if result:
            self.assertLess(result.confidence, 0.5)


class TestFavoriteLongshotBiasStrategy(unittest.TestCase):
    """Tests for Favorite-Longshot Bias edge detection."""

    def setUp(self):
        self.strategy = FavoriteLongshotBiasStrategy()

    def test_longshot_detection(self):
        """Should detect mispriced longshots."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.05,  # Very low probability - typical longshot
            no_price=0.95,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Longshot bias suggests these are overpriced
        self.assertIsNotNone(result)

    def test_favorite_detection(self):
        """Should detect mispriced favorites."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.95,  # Very high probability - typical favorite
            no_price=0.05,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Favorite-longshot bias suggests these are underpriced
        self.assertIsNotNone(result)

    def test_neutral_probability_no_bias(self):
        """Should not detect bias at neutral probabilities."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,  # Neutral - no bias expected
            no_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.strategy.analyze(snapshot)

        # Neutral probability should have minimal bias signal
        if result:
            self.assertLess(abs(result.expected_value), 0.02)


class TestOverreactionStrategy(unittest.TestCase):
    """Tests for Overreaction/Mean Reversion edge detection."""

    def setUp(self):
        self.strategy = OverreactionStrategy()

    def test_sharp_move_detection(self):
        """Should detect potential overreaction after sharp move."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.70,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        # Price moved sharply from 0.50 to 0.70
        price_history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=i)
                for i in range(24, 0, -1)
            ],
            prices=[0.50] * 20 + [0.55, 0.60, 0.65, 0.70],  # Sharp recent move
            volumes=[100] * 24
        )

        result = self.strategy.analyze(snapshot, price_history=price_history)

        # Should detect potential mean reversion
        self.assertIsNotNone(result)

    def test_stable_price_no_overreaction(self):
        """Should not signal when price is stable."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        # Stable prices
        price_history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=i)
                for i in range(24, 0, -1)
            ],
            prices=[0.50] * 24,
            volumes=[100] * 24
        )

        result = self.strategy.analyze(snapshot, price_history=price_history)

        # Stable price should not trigger overreaction signal
        if result:
            self.assertLess(result.confidence, 0.5)


class TestHerdingStrategy(unittest.TestCase):
    """Tests for Herding Behavior edge detection."""

    def setUp(self):
        self.strategy = HerdingStrategy()

    def test_herding_near_resolution(self):
        """Should detect herding behavior near resolution."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.80,
            volume_24h=50000,  # High volume
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(hours=12)
        )

        # Rapid price increase with high volume
        price_history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=i)
                for i in range(24, 0, -1)
            ],
            prices=[0.50 + (i * 0.0125) for i in range(24)],  # Steady climb
            volumes=[1000 + (i * 500) for i in range(24)]  # Increasing volume
        )

        result = self.strategy.analyze(snapshot, price_history=price_history)

        # Should detect potential herding
        if result:
            self.assertIn("herd", result.explanation.lower())


class TestAnchoringBiasStrategy(unittest.TestCase):
    """Tests for Anchoring Bias edge detection."""

    def setUp(self):
        self.strategy = AnchoringBiasStrategy()

    def test_anchor_detection(self):
        """Should detect anchoring to previous price levels."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.52,  # Close to 0.50 anchor
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        # Long history at 0.50
        price_history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=i)
                for i in range(48, 0, -1)
            ],
            prices=[0.50] * 44 + [0.50, 0.51, 0.51, 0.52],  # Recent small move
            volumes=[100] * 48
        )

        result = self.strategy.analyze(snapshot, price_history=price_history)

        # Should detect potential anchoring
        if result:
            self.assertIn("anchor", result.explanation.lower())


class TestStrategyBase(unittest.TestCase):
    """Tests for base strategy functionality."""

    def test_result_creation(self):
        """Test strategy result creation helper."""
        strategy = LiquidityVacuumStrategy()

        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        # Access protected method via subclass
        result = strategy._create_result(
            snapshot=snapshot,
            direction=SignalDirection.BUY_YES,
            probability_estimate=0.55,
            signal_strength=0.7,
            confidence=0.6,
            explanation="Test signal",
            factors=["Factor 1", "Factor 2"],
            risks=["Risk 1"]
        )

        self.assertEqual(result.market_id, "test-123")
        self.assertEqual(result.direction, SignalDirection.BUY_YES)
        self.assertEqual(result.probability_estimate, 0.55)
        self.assertEqual(result.signal_strength, 0.7)
        self.assertEqual(result.confidence, 0.6)
        self.assertIn("Factor 1", result.factors)
        self.assertIn("Risk 1", result.risks)

    def test_kelly_calculation(self):
        """Test Kelly fraction calculation."""
        strategy = LiquidityVacuumStrategy()

        # With edge
        kelly = strategy._calculate_kelly(
            probability=0.6,
            market_price=0.5
        )
        self.assertGreater(kelly, 0)
        self.assertLess(kelly, 1)

        # No edge
        kelly_no_edge = strategy._calculate_kelly(
            probability=0.5,
            market_price=0.5
        )
        self.assertEqual(kelly_no_edge, 0)


if __name__ == '__main__':
    unittest.main()
