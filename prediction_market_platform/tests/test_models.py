"""
Unit Tests for Data Models.

Tests data models and database operations:
- MarketSnapshot creation and validation
- OrderBook functionality
- PriceHistory operations
- Database CRUD operations
"""

import unittest
from datetime import datetime, timedelta
import tempfile
import os

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, OrderBookLevel,
    MarketSource, MarketStatus, Signal, Opportunity,
    BacktestResult, BacktestTrade
)
from engine.data_ingestion.database import Database


class TestMarketSnapshot(unittest.TestCase):
    """Tests for MarketSnapshot model."""

    def test_snapshot_creation(self):
        """Test basic snapshot creation."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Will it rain tomorrow?",
            yes_price=0.65,
            no_price=0.35,
            liquidity=10000.0,
            volume_24h=5000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        self.assertEqual(snapshot.market_id, "test-123")
        self.assertEqual(snapshot.source, MarketSource.POLYMARKET)
        self.assertEqual(snapshot.yes_price, 0.65)
        self.assertEqual(snapshot.no_price, 0.35)

    def test_snapshot_mid_price(self):
        """Test mid price calculation."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            best_bid=0.45,
            best_ask=0.55,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        self.assertEqual(snapshot.mid_price, 0.50)

    def test_snapshot_spread(self):
        """Test spread field."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            best_bid=0.45,
            best_ask=0.55,
            spread=0.10,  # Set explicitly as it's a field
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        self.assertEqual(snapshot.spread, 0.10)

    def test_snapshot_hours_to_resolution(self):
        """Test hours to resolution calculation."""
        resolution_time = datetime.utcnow() + timedelta(hours=24)
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test?",
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE,
            resolution_time=resolution_time
        )

        hours = snapshot.hours_to_resolution
        self.assertIsNotNone(hours)
        self.assertAlmostEqual(hours, 24, delta=0.1)


class TestOrderBook(unittest.TestCase):
    """Tests for OrderBook model."""

    def test_order_book_creation(self):
        """Test order book creation."""
        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=100),
                OrderBookLevel(price=0.48, size=200),
            ],
            asks=[
                OrderBookLevel(price=0.51, size=150),
                OrderBookLevel(price=0.52, size=250),
            ]
        )

        self.assertEqual(order_book.market_id, "test-123")
        self.assertEqual(len(order_book.bids), 2)
        self.assertEqual(len(order_book.asks), 2)

    def test_order_book_best_prices(self):
        """Test best bid/ask extraction."""
        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=100),
                OrderBookLevel(price=0.48, size=200),
            ],
            asks=[
                OrderBookLevel(price=0.51, size=150),
                OrderBookLevel(price=0.52, size=250),
            ]
        )

        self.assertEqual(order_book.best_bid, 0.49)
        self.assertEqual(order_book.best_ask, 0.51)
        # Use assertAlmostEqual for floating point comparison
        self.assertAlmostEqual(order_book.spread, 0.02, places=10)

    def test_order_book_liquidity(self):
        """Test liquidity calculation."""
        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[
                OrderBookLevel(price=0.49, size=100),
                OrderBookLevel(price=0.48, size=200),
            ],
            asks=[
                OrderBookLevel(price=0.51, size=150),
                OrderBookLevel(price=0.52, size=250),
            ]
        )

        self.assertEqual(order_book.bid_liquidity, 300)
        self.assertEqual(order_book.ask_liquidity, 400)
        self.assertEqual(order_book.total_liquidity, 700)

    def test_order_book_imbalance(self):
        """Test imbalance calculation."""
        # Bid heavy
        order_book = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[OrderBookLevel(price=0.49, size=300)],
            asks=[OrderBookLevel(price=0.51, size=100)]
        )

        imbalance = order_book.order_imbalance  # Correct property name
        self.assertGreater(imbalance, 0)  # Bid heavy = positive

        # Ask heavy
        order_book2 = OrderBook(
            market_id="test-123",
            timestamp=datetime.utcnow(),
            bids=[OrderBookLevel(price=0.49, size=100)],
            asks=[OrderBookLevel(price=0.51, size=300)]
        )

        imbalance2 = order_book2.order_imbalance
        self.assertLess(imbalance2, 0)  # Ask heavy = negative


class TestPriceHistory(unittest.TestCase):
    """Tests for PriceHistory model."""

    def test_price_history_creation(self):
        """Test price history creation."""
        timestamps = [
            datetime.utcnow() - timedelta(hours=i)
            for i in range(24, 0, -1)
        ]
        prices = [0.50 + (i * 0.01) for i in range(24)]
        volumes = [100] * 24

        history = PriceHistory(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            timestamps=timestamps,
            prices=prices,
            volumes=volumes
        )

        self.assertEqual(len(history), 24)
        self.assertEqual(len(history.timestamps), 24)
        self.assertEqual(len(history.prices), 24)

    def test_price_history_returns(self):
        """Test returns calculation."""
        history = PriceHistory(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            timestamps=[
                datetime.utcnow() - timedelta(hours=2),
                datetime.utcnow() - timedelta(hours=1),
                datetime.utcnow()
            ],
            prices=[1.0, 1.1, 1.21],  # 10% then 10%
            volumes=[100, 100, 100]
        )

        returns = history.returns
        self.assertEqual(len(returns), 2)
        self.assertAlmostEqual(returns[0], 0.10, places=5)
        self.assertAlmostEqual(returns[1], 0.10, places=5)

    def test_price_history_volatility(self):
        """Test volatility calculation."""
        # Constant prices should have zero volatility
        history = PriceHistory(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            timestamps=[datetime.utcnow() - timedelta(hours=i) for i in range(10)],
            prices=[0.50] * 10,
            volumes=[100] * 10
        )

        self.assertEqual(history.volatility, 0)

    def test_price_history_price_at(self):
        """Test price at timestamp lookup."""
        base_time = datetime.utcnow()
        history = PriceHistory(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            timestamps=[
                base_time - timedelta(hours=2),
                base_time - timedelta(hours=1),
                base_time
            ],
            prices=[0.50, 0.55, 0.60],
            volumes=[100, 100, 100]
        )

        # Get price at closest timestamp
        price = history.price_at(base_time - timedelta(hours=1))
        self.assertEqual(price, 0.55)


class TestSignal(unittest.TestCase):
    """Tests for Signal model."""

    def test_signal_creation(self):
        """Test signal creation."""
        signal = Signal(
            strategy_name="test_strategy",
            market_id="mkt-123",
            timestamp=datetime.utcnow(),
            direction="buy_yes",
            strength=0.75,
            confidence=0.8,
            expected_value=0.05
        )

        self.assertEqual(signal.strategy_name, "test_strategy")
        self.assertEqual(signal.direction, "buy_yes")
        self.assertEqual(signal.strength, 0.75)

    def test_signal_edge(self):
        """Test edge calculation."""
        signal = Signal(
            strategy_name="test_strategy",
            market_id="mkt-123",
            timestamp=datetime.utcnow(),
            direction="buy_yes",
            strength=0.75,
            confidence=0.8,
            expected_value=0.05,
            probability_estimate=0.65,
            market_probability=0.50
        )

        self.assertAlmostEqual(signal.edge, 0.15, places=5)


class TestOpportunity(unittest.TestCase):
    """Tests for Opportunity model."""

    def test_opportunity_creation(self):
        """Test opportunity creation."""
        opp = Opportunity(
            rank=1,
            market_id="mkt-123",
            market_name="Test Market",
            source=MarketSource.POLYMARKET,
            timestamp=datetime.utcnow(),
            composite_score=0.75,
            expected_value=0.05,
            confidence=0.8,
            risk_score=0.3,
            current_price=0.50,
            liquidity=10000.0,
            volume_24h=5000.0,
            hours_to_resolution=24.0,
            suggested_side="buy_yes",
            suggested_size=0.02,
            explanation="Test opportunity",
            key_factors=["Factor 1"],
            risks=["Risk 1"],
            signal_agreement=0.9
        )

        self.assertEqual(opp.market_id, "mkt-123")
        self.assertEqual(opp.composite_score, 0.75)
        self.assertEqual(opp.rank, 1)

    def test_opportunity_to_dict(self):
        """Test opportunity serialization."""
        opp = Opportunity(
            rank=1,
            market_id="mkt-123",
            market_name="Test Market",
            source=MarketSource.POLYMARKET,
            timestamp=datetime.utcnow(),
            composite_score=0.75,
            expected_value=0.05,
            confidence=0.8,
            risk_score=0.3,
            current_price=0.50,
            liquidity=10000.0,
            volume_24h=5000.0,
            hours_to_resolution=24.0
        )

        d = opp.to_dict()
        self.assertEqual(d['market_id'], "mkt-123")
        self.assertEqual(d['composite_score'], 0.75)


class TestBacktestModels(unittest.TestCase):
    """Tests for Backtest models."""

    def test_backtest_trade(self):
        """Test BacktestTrade creation."""
        trade = BacktestTrade(
            entry_time=datetime.utcnow() - timedelta(hours=24),
            exit_time=datetime.utcnow(),
            market_id="mkt-123",
            strategy_name="test",
            side="yes",
            entry_price=0.50,
            exit_price=0.60,
            position_size=100.0,
            pnl=10.0,
            return_pct=0.20,
            outcome="win"
        )

        self.assertEqual(trade.market_id, "mkt-123")
        self.assertEqual(trade.pnl, 10.0)
        self.assertEqual(trade.outcome, "win")

    def test_backtest_result(self):
        """Test BacktestResult creation."""
        result = BacktestResult(
            strategy_name="test_strategy",
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow(),
            trades=[],
            total_trades=100,
            total_return=0.15,
            annualized_return=0.50,
            sharpe_ratio=1.5,
            sortino_ratio=2.0,
            max_drawdown=0.10,
            win_rate=0.60,
            profit_factor=1.8,
            brier_score=0.18,
            calibration_error=0.05,
            log_loss=0.30,
            equity_curve=[1.0, 1.05, 1.10, 1.15],
            equity_timestamps=[datetime.utcnow() - timedelta(days=i) for i in range(4)],
            avg_trade_duration_hours=24.0,
            avg_profit_per_trade=15.0,
            avg_loss_per_trade=-10.0,
            best_trade=50.0,
            worst_trade=-25.0,
            consecutive_wins=5,
            consecutive_losses=3
        )

        self.assertEqual(result.strategy_name, "test_strategy")
        self.assertEqual(result.total_trades, 100)
        self.assertEqual(result.win_rate, 0.60)

    def test_backtest_result_summary(self):
        """Test BacktestResult summary generation."""
        result = BacktestResult(
            strategy_name="test_strategy",
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow(),
            trades=[],
            total_trades=100,
            total_return=0.15,
            annualized_return=0.50,
            sharpe_ratio=1.5,
            sortino_ratio=2.0,
            max_drawdown=0.10,
            win_rate=0.60,
            profit_factor=1.8,
            brier_score=0.18,
            calibration_error=0.05,
            log_loss=0.30,
            equity_curve=[1.0],
            equity_timestamps=[datetime.utcnow()],
            avg_trade_duration_hours=24.0,
            avg_profit_per_trade=15.0,
            avg_loss_per_trade=-10.0,
            best_trade=50.0,
            worst_trade=-25.0,
            consecutive_wins=5,
            consecutive_losses=3
        )

        summary = result.summary()
        self.assertIn("test_strategy", summary)
        self.assertIn("Win Rate", summary)


class TestDatabase(unittest.TestCase):
    """Tests for database operations."""

    def setUp(self):
        """Create temporary database."""
        self.temp_file = tempfile.NamedTemporaryFile(
            suffix='.db', delete=False
        )
        self.temp_file.close()
        self.db = Database(db_path=self.temp_file.name)

    def tearDown(self):
        """Clean up temporary database."""
        try:
            os.unlink(self.temp_file.name)
        except Exception:
            pass

    def test_save_and_load_snapshot(self):
        """Test saving and loading snapshots."""
        snapshot = MarketSnapshot(
            market_id="test-123",
            source=MarketSource.POLYMARKET,
            description="Test description",
            category="politics",
            question="Test market?",
            yes_price=0.65,
            no_price=0.35,
            liquidity=10000.0,
            timestamp=datetime.utcnow(),
            status=MarketStatus.ACTIVE
        )

        self.db.save_snapshot(snapshot)

        # Load back using get_latest_snapshot (the actual method name)
        loaded = self.db.get_latest_snapshot(
            "test-123",
            MarketSource.POLYMARKET
        )

        self.assertIsNotNone(loaded)
        self.assertEqual(loaded.market_id, "test-123")
        self.assertEqual(loaded.yes_price, 0.65)

    def test_get_active_markets(self):
        """Test getting active markets."""
        # Save some snapshots
        for i in range(5):
            snapshot = MarketSnapshot(
                market_id=f"test-{i}",
                source=MarketSource.POLYMARKET,
                description="Test description",
                category="politics",
                question=f"Test market {i}?",
                yes_price=0.50,
                timestamp=datetime.utcnow(),
                status=MarketStatus.ACTIVE
            )
            self.db.save_snapshot(snapshot)

        markets = self.db.get_active_markets()
        self.assertEqual(len(markets), 5)

    def test_save_and_load_signal(self):
        """Test saving and loading signals."""
        signal = Signal(
            strategy_name="test_strategy",
            market_id="mkt-123",
            timestamp=datetime.utcnow(),
            direction="buy_yes",
            strength=0.75,
            confidence=0.8,
            expected_value=0.05
        )

        self.db.save_signal(signal)

        # Load back
        signals = self.db.get_signals(market_id="mkt-123")
        self.assertGreaterEqual(len(signals), 1)


if __name__ == '__main__':
    unittest.main()
