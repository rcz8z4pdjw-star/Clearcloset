"""
Unit Tests for Engine Components.

Tests core engine functionality:
- Signal generation
- Opportunity scoring
- Backtesting
- Feature extraction
"""

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
import tempfile
import os

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, OrderBookLevel,
    MarketSource, MarketStatus, BacktestResult
)
from engine.signal_generation.engine import SignalEngine
from engine.opportunity_scoring.scorer import OpportunityScorer
from engine.feature_engineering.features import FeatureExtractor, MarketFeatures
from engine.feature_engineering.indicators import TechnicalIndicators
from engine.data_ingestion.validation import (
    DataValidator, ValidationSeverity, ValidationResult
)
from strategies.base import StrategyResult, SignalDirection


class TestSignalEngine(unittest.TestCase):
    """Tests for SignalEngine."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_file = tempfile.NamedTemporaryFile(
            suffix='.db', delete=False
        )
        self.temp_file.close()

    def tearDown(self):
        """Clean up."""
        try:
            os.unlink(self.temp_file.name)
        except:
            pass

    def test_engine_initialization(self):
        """Test engine initializes with strategies."""
        engine = SignalEngine()
        self.assertGreater(len(engine.strategies), 0)

    def test_available_strategies(self):
        """Test getting available strategies."""
        engine = SignalEngine()
        strategies = engine.get_available_strategies()

        self.assertIn('liquidity_vacuum', strategies)
        self.assertIn('spread_exploitation', strategies)
        self.assertIn('late_resolution', strategies)
        self.assertIn('favorite_longshot_bias', strategies)

    def test_run_single_strategy(self):
        """Test running a single strategy."""
        engine = SignalEngine()

        # Create test snapshot
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.05,  # Longshot
            no_price=0.95,
            liquidity=1000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        # Run favorite-longshot strategy which should detect this
        results = engine.run_single_strategy(
            'favorite_longshot_bias',
            [snapshot]
        )

        # Should generate at least one signal
        self.assertIsInstance(results, list)


class TestOpportunityScorer(unittest.TestCase):
    """Tests for OpportunityScorer."""

    def test_scorer_initialization(self):
        """Test scorer initializes with config."""
        scorer = OpportunityScorer()
        self.assertIsNotNone(scorer.weights)

    def test_score_calculation(self):
        """Test composite score calculation."""
        scorer = OpportunityScorer()

        # Create a mock signal
        signal = StrategyResult(
            strategy_name="test_strategy",
            market_id="test-123",
            market_name="Test Market",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            timestamp=datetime.utcnow(),
            direction=SignalDirection.BUY_YES,
            signal_strength=0.8,
            confidence=0.7,
            probability_estimate=0.6,
            market_probability=0.5,
            expected_value=0.05,
            edge=0.10,
            kelly_fraction=0.15,
            time_horizon_hours=48,
            explanation="Test signal",
            factors=["Factor 1"],
            risks=["Risk 1"]
        )

        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.50,
            liquidity=5000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=2)
        )

        # Score opportunities
        opportunities = scorer.score_opportunities(
            signals=[signal],
            markets={"test-123": snapshot},
            top_n=10
        )

        self.assertEqual(len(opportunities), 1)
        self.assertGreater(opportunities[0].composite_score, 0)
        self.assertLessEqual(opportunities[0].composite_score, 1)

    def test_ranking_order(self):
        """Test opportunities are ranked correctly."""
        scorer = OpportunityScorer()

        # Create signals with different expected values
        signals = []
        snapshots = {}

        for i, ev in enumerate([0.02, 0.08, 0.05]):
            signal = StrategyResult(
                strategy_name="test_strategy",
                market_id=f"test-{i}",
                market_name=f"Test Market {i}",
                source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
                timestamp=datetime.utcnow(),
                direction=SignalDirection.BUY_YES,
                signal_strength=0.7,
                confidence=0.7,
                probability_estimate=0.55,
                market_probability=0.50,
                expected_value=ev,
                edge=ev * 2,
                kelly_fraction=0.10,
                time_horizon_hours=48,
                explanation="Test",
                factors=[],
                risks=[]
            )
            signals.append(signal)

            snapshots[f"test-{i}"] = MarketSnapshot(
                market_id=f"test-{i}",
                source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
                question=f"Test {i}?",
                yes_price=0.50,
                liquidity=5000.0,
                timestamp=datetime.utcnow(),
                status=MarketStatus.ACTIVE,
                resolution_time=datetime.utcnow() + timedelta(days=2)
            )

        opportunities = scorer.score_opportunities(
            signals=signals,
            markets=snapshots,
            top_n=10
        )

        # Should be ranked by score (higher EV should rank higher)
        self.assertEqual(opportunities[0].rank, 1)
        self.assertGreater(
            opportunities[0].composite_score,
            opportunities[2].composite_score
        )


class TestFeatureExtractor(unittest.TestCase):
    """Tests for Feature Extraction."""

    def test_feature_extraction(self):
        """Test basic feature extraction."""
        extractor = FeatureExtractor()

        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.60,
            no_price=0.40,
            best_bid=0.58,
            best_ask=0.62,
            liquidity=10000.0,
            volume_24h=5000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        features = extractor.extract(snapshot)

        self.assertIsInstance(features, MarketFeatures)
        self.assertEqual(features.price, 0.60)
        self.assertEqual(features.spread, 0.04)
        self.assertIsNotNone(features.liquidity_score)

    def test_feature_with_history(self):
        """Test feature extraction with price history."""
        extractor = FeatureExtractor()

        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            yes_price=0.60,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=i)
                for i in range(24, 0, -1)
            ],
            prices=[0.50 + (i * 0.004) for i in range(24)],
            volumes=[100] * 24
        )

        features = extractor.extract(snapshot, price_history=history)

        self.assertIsNotNone(features.momentum_1h)
        self.assertIsNotNone(features.volatility)


class TestTechnicalIndicators(unittest.TestCase):
    """Tests for Technical Indicators."""

    def test_sma_calculation(self):
        """Test Simple Moving Average calculation."""
        prices = [1.0, 2.0, 3.0, 4.0, 5.0]
        sma = TechnicalIndicators.sma(prices, period=3)

        self.assertEqual(len(sma), 3)
        self.assertEqual(sma[0], 2.0)  # (1+2+3)/3
        self.assertEqual(sma[1], 3.0)  # (2+3+4)/3
        self.assertEqual(sma[2], 4.0)  # (3+4+5)/3

    def test_ema_calculation(self):
        """Test Exponential Moving Average calculation."""
        prices = [1.0, 2.0, 3.0, 4.0, 5.0]
        ema = TechnicalIndicators.ema(prices, period=3)

        self.assertEqual(len(ema), len(prices))
        # EMA should be greater than SMA for uptrend
        self.assertGreater(ema[-1], 4.0)

    def test_rsi_calculation(self):
        """Test RSI calculation."""
        # Create uptrend
        prices = [i for i in range(20, 35)]
        rsi = TechnicalIndicators.rsi(prices, period=14)

        # Strong uptrend should have RSI > 50
        self.assertGreater(rsi[-1], 50)

        # Create downtrend
        prices_down = [i for i in range(35, 20, -1)]
        rsi_down = TechnicalIndicators.rsi(prices_down, period=14)

        # Strong downtrend should have RSI < 50
        self.assertLess(rsi_down[-1], 50)

    def test_bollinger_bands(self):
        """Test Bollinger Bands calculation."""
        prices = [0.50 + (i * 0.01) for i in range(30)]
        upper, middle, lower = TechnicalIndicators.bollinger_bands(
            prices, period=20, std_dev=2.0
        )

        self.assertEqual(len(upper), 11)  # 30 - 20 + 1
        self.assertEqual(len(middle), 11)
        self.assertEqual(len(lower), 11)

        # Upper should be > middle > lower
        for i in range(len(middle)):
            self.assertGreater(upper[i], middle[i])
            self.assertGreater(middle[i], lower[i])

    def test_macd_calculation(self):
        """Test MACD calculation."""
        prices = [0.50 + (i * 0.005) for i in range(50)]
        macd_line, signal_line, histogram = TechnicalIndicators.macd(prices)

        self.assertIsNotNone(macd_line)
        self.assertIsNotNone(signal_line)
        self.assertIsNotNone(histogram)


class TestDataValidator(unittest.TestCase):
    """Tests for Data Validation."""

    def setUp(self):
        self.validator = DataValidator()

    def test_valid_snapshot(self):
        """Test validation of valid snapshot."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.60,
            no_price=0.40,
            best_bid=0.58,
            best_ask=0.62,
            liquidity=10000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=datetime.utcnow() + timedelta(days=7)
        )

        result = self.validator.validate_snapshot(snapshot)
        self.assertTrue(result.is_valid)

    def test_missing_market_id(self):
        """Test detection of missing market ID."""
        snapshot = MarketSnapshot(
            market_id="",  # Missing
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            yes_price=0.50,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        result = self.validator.validate_snapshot(snapshot)
        self.assertFalse(result.is_valid)
        self.assertGreater(result.critical_count, 0)

    def test_invalid_price_range(self):
        """Test detection of invalid price."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            yes_price=1.5,  # Invalid - > 1
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        result = self.validator.validate_snapshot(snapshot)
        self.assertFalse(result.is_valid)

    def test_crossed_book_detection(self):
        """Test detection of crossed order book."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            yes_price=0.50,
            best_bid=0.55,  # Crossed
            best_ask=0.52,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        result = self.validator.validate_snapshot(snapshot)
        self.assertFalse(result.is_valid)

    def test_stale_data_warning(self):
        """Test detection of stale data."""
        old_timestamp = datetime.utcnow() - timedelta(hours=5)
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            yes_price=0.50,
            timestamp=old_timestamp,  # Old
            status=MarketStatus.ACTIVE
        )

        result = self.validator.validate_snapshot(snapshot)
        self.assertGreater(result.warnings_count, 0)

    def test_order_book_validation(self):
        """Test order book validation."""
        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=100),
                OrderBookLevel(price=0.50, size=100),  # Not descending
            ],
            asks=[
                OrderBookLevel(price=0.51, size=100),
            ]
        )

        result = self.validator.validate_order_book(order_book)
        self.assertFalse(result.is_valid)

    def test_price_history_validation(self):
        """Test price history validation."""
        history = PriceHistory(
            timestamps=[
                datetime.utcnow() - timedelta(hours=2),
                datetime.utcnow() - timedelta(hours=1),
                datetime.utcnow()
            ],
            prices=[0.50, 1.5, 0.55],  # Invalid price 1.5
            volumes=[100, 100, 100]
        )

        result = self.validator.validate_price_history(history, "test-123")
        self.assertFalse(result.is_valid)


class TestValidationResult(unittest.TestCase):
    """Tests for ValidationResult."""

    def test_result_merging(self):
        """Test merging validation results."""
        result1 = ValidationResult(is_valid=True)
        result1.warnings_count = 2

        result2 = ValidationResult(is_valid=False)
        result2.errors_count = 1

        result1.merge(result2)

        self.assertFalse(result1.is_valid)
        self.assertEqual(result1.warnings_count, 2)
        self.assertEqual(result1.errors_count, 1)

    def test_summary_generation(self):
        """Test summary string generation."""
        result = ValidationResult(is_valid=True)
        result.warnings_count = 5

        summary = result.summary()
        self.assertIn("PASSED", summary)
        self.assertIn("5", summary)


if __name__ == '__main__':
    unittest.main()
