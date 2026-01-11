"""
Integration Tests for Prediction Market Research Platform.

Tests that all modules work together correctly.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from datetime import datetime, timezone, timedelta


class TestDataIngestion:
    """Test data ingestion module."""

    def test_database_initialization(self):
        """Test database initializes correctly."""
        from engine.data_ingestion import get_database

        db = get_database()
        assert db is not None
        assert hasattr(db, 'save_market')
        assert hasattr(db, 'get_all_markets')

    def test_market_models(self):
        """Test market data models."""
        from engine.data_ingestion.models import MarketSnapshot, MarketSource

        snapshot = MarketSnapshot(
            market_id="test-001",
            source=MarketSource.POLYMARKET,
            question="Test Market",
            description="A test market",
            category="politics",
            yes_price=0.65,
            no_price=0.35,
            volume_24h=50000,
            liquidity=100000,
            timestamp=datetime.now(timezone.utc)
        )

        assert snapshot.market_id == "test-001"
        assert snapshot.yes_price == 0.65
        assert snapshot.source == MarketSource.POLYMARKET


class TestStrategies:
    """Test strategy module."""

    def test_load_all_strategies(self):
        """Test loading all available strategies."""
        from strategies import get_all_strategies

        strategies = get_all_strategies()
        assert len(strategies) > 0
        assert isinstance(strategies, dict)

    def test_strategy_interface(self):
        """Test that strategies implement correct interface."""
        from strategies import get_all_strategies
        from engine.data_ingestion.models import MarketSnapshot, MarketSource

        strategies = get_all_strategies()

        # Create test market
        market = MarketSnapshot(
            market_id="test-strategy",
            source=MarketSource.POLYMARKET,
            question="Strategy Test Market",
            description="Test description",
            category="politics",
            yes_price=0.50,
            no_price=0.50,
            volume_24h=10000,
            liquidity=50000,
            timestamp=datetime.now(timezone.utc)
        )

        # Test each strategy
        for name, strategy in strategies.items():
            assert hasattr(strategy, 'analyze')
            assert hasattr(strategy, 'name')

            # Should be able to analyze without error
            try:
                result = strategy.analyze(market)
                # Result should be a signal or None
            except Exception as e:
                pytest.fail(f"Strategy {name} failed to analyze: {e}")


class TestSignalEngine:
    """Test signal generation engine."""

    def test_engine_initialization(self):
        """Test signal engine initializes with strategies."""
        from engine.signal_generation import SignalEngine

        engine = SignalEngine()
        assert engine is not None
        assert len(engine.strategies) > 0

    def test_signal_generation(self):
        """Test generating signals for a market."""
        from engine.signal_generation import SignalEngine
        from engine.data_ingestion.models import MarketSnapshot, MarketSource

        engine = SignalEngine()

        market = MarketSnapshot(
            market_id="signal-test",
            source=MarketSource.POLYMARKET,
            question="Signal Test Market",
            description="Test",
            category="politics",
            yes_price=0.70,
            no_price=0.30,
            volume_24h=25000,
            liquidity=75000,
            timestamp=datetime.now(timezone.utc)
        )

        signals = engine.analyze_market(market)
        assert isinstance(signals, list)


class TestOpportunityScoring:
    """Test opportunity scoring module."""

    def test_scorer_initialization(self):
        """Test scorer initializes correctly."""
        from engine.opportunity_scoring import OpportunityScorer

        scorer = OpportunityScorer()
        assert scorer is not None

    def test_advanced_scorer(self):
        """Test advanced scorer functionality."""
        from engine.opportunity_scoring.advanced_scorer import AdvancedOpportunityScorer

        scorer = AdvancedOpportunityScorer()
        assert scorer is not None
        assert hasattr(scorer, 'score_opportunity')


class TestSocialSentiment:
    """Test social sentiment module."""

    def test_social_feed_creation(self):
        """Test creating a social feed."""
        from engine.social import create_social_feed

        feed = create_social_feed()
        assert feed is not None
        assert hasattr(feed, 'aggregator')
        assert hasattr(feed, 'get_feed_summary')

    def test_sentiment_analysis(self):
        """Test sentiment analyzer."""
        from engine.social.social_analyzer import SentimentAnalyzer

        analyzer = SentimentAnalyzer()

        # Test bullish sentiment - returns (sentiment, confidence) tuple
        bullish_score, bullish_conf = analyzer.analyze("This is a guaranteed win, loading up!")
        assert bullish_score > 0

        # Test bearish sentiment
        bearish_score, bearish_conf = analyzer.analyze("This is overpriced garbage, total trap")
        assert bearish_score < 0

    def test_social_aggregator(self):
        """Test social aggregator."""
        from engine.social.social_analyzer import SocialAggregator

        aggregator = SocialAggregator()
        assert hasattr(aggregator, 'add_post')
        assert hasattr(aggregator, 'get_market_sentiment')


class TestNewsCollector:
    """Test news collection module."""

    def test_news_aggregator_creation(self):
        """Test creating a news aggregator."""
        from engine.news import create_news_aggregator

        aggregator = create_news_aggregator()
        assert aggregator is not None
        assert hasattr(aggregator, 'get_news_summary')

    def test_news_analyzer(self):
        """Test news analyzer."""
        from engine.news.news_collector import NewsAnalyzer

        analyzer = NewsAnalyzer()

        # Test categorization
        result = analyzer.analyze("Federal Reserve announces rate decision")
        assert result['impact_score'] > 0


class TestPerformanceTracker:
    """Test performance tracking module."""

    def test_tracker_creation(self):
        """Test creating a performance tracker."""
        from engine.performance import create_performance_tracker

        tracker = create_performance_tracker()
        assert tracker is not None
        assert hasattr(tracker, 'record_signal')
        assert hasattr(tracker, 'record_outcome')

    def test_signal_recording(self):
        """Test recording signals."""
        from engine.performance import create_performance_tracker
        from engine.performance.tracker import SignalRecord

        tracker = create_performance_tracker()

        signal = SignalRecord(
            signal_id="test-signal-001",
            timestamp=datetime.now(timezone.utc),
            market_id="test-market",
            strategy_name="TestStrategy",
            direction="BUY",
            strength=0.75,
            confidence=0.80,
            expected_value=0.15,
            market_price_at_signal=0.50
        )

        tracker.record_signal(signal)
        assert len(tracker.signals) > 0

    def test_report_generation(self):
        """Test generating performance report."""
        from engine.performance import create_performance_tracker

        tracker = create_performance_tracker()
        report = tracker.generate_report()

        assert isinstance(report, dict)
        assert 'generated_at' in report


class TestPortfolioOptimizer:
    """Test portfolio optimization module."""

    def test_optimizer_creation(self):
        """Test creating a portfolio optimizer."""
        from engine.portfolio import create_portfolio_optimizer

        optimizer = create_portfolio_optimizer(initial_capital=10000)
        assert optimizer is not None
        assert optimizer.cash_balance == 10000

    def test_kelly_calculation(self):
        """Test Kelly criterion calculation."""
        from engine.portfolio import kelly_fraction, optimal_kelly_bet

        # Test basic Kelly
        kelly = kelly_fraction(win_prob=0.60, win_payout=1.0)
        assert kelly > 0  # Should have positive edge
        assert kelly < 1  # Should never bet more than 100%

        # Test no edge case
        kelly_no_edge = kelly_fraction(win_prob=0.50, win_payout=1.0)
        assert kelly_no_edge == 0  # No edge = no bet

        # Test PM-specific Kelly
        bet_amount, side = optimal_kelly_bet(
            bankroll=10000,
            win_prob=0.65,
            current_price=0.50,
            kelly_multiplier=0.25
        )
        assert bet_amount > 0
        assert side == "YES"

    def test_position_sizing(self):
        """Test position sizing calculation."""
        from engine.portfolio import create_portfolio_optimizer

        optimizer = create_portfolio_optimizer(initial_capital=10000)

        sizing = optimizer.calculate_position_size(
            estimated_prob=0.65,
            market_price=0.50,
            market_id="test-market"
        )

        assert 'recommended' in sizing
        assert 'bet_amount' in sizing
        assert 'suggested_side' in sizing

    def test_portfolio_state(self):
        """Test portfolio state tracking."""
        from engine.portfolio import create_portfolio_optimizer

        optimizer = create_portfolio_optimizer(initial_capital=10000)
        state = optimizer.get_portfolio_state()

        assert state.total_value == 10000
        assert state.cash_balance == 10000
        assert state.num_positions == 0


class TestAlgorithms:
    """Test advanced algorithms module."""

    def test_live_data_validator(self):
        """Test live data validator."""
        from engine.algorithms import LiveDataValidator

        validator = LiveDataValidator()
        assert validator is not None
        assert hasattr(validator, 'validate')

    def test_arbitrage_detector(self):
        """Test arbitrage detector."""
        from engine.algorithms import ArbitrageDetector

        detector = ArbitrageDetector()
        assert detector is not None
        assert hasattr(detector, 'find_arbitrage')


class TestEndToEnd:
    """End-to-end integration tests."""

    def test_full_analysis_pipeline(self):
        """Test complete analysis pipeline."""
        from engine.data_ingestion.models import MarketSnapshot, MarketSource
        from engine.signal_generation import SignalEngine
        from engine.opportunity_scoring import OpportunityScorer

        # Create market
        market = MarketSnapshot(
            market_id="e2e-test",
            source=MarketSource.POLYMARKET,
            question="End-to-End Test Market",
            description="Full pipeline test",
            category="politics",
            yes_price=0.60,
            no_price=0.40,
            volume_24h=100000,
            liquidity=500000,
            timestamp=datetime.now(timezone.utc)
        )

        # Generate signals
        engine = SignalEngine()
        signals = engine.analyze_market(market)

        # Score opportunity
        scorer = OpportunityScorer()
        score = scorer.score_market(market, signals)

        assert score is not None

    def test_full_social_pipeline(self):
        """Test social sentiment pipeline."""
        from engine.social import create_social_feed
        from engine.social.social_analyzer import SocialPost, SocialSource

        feed = create_social_feed()

        # Add test post
        post = SocialPost(
            post_id="test-post-001",
            source=SocialSource.REDDIT,
            author="test_user",
            content="Polymarket election odds looking bullish!",
            timestamp=datetime.now(timezone.utc)
        )

        feed.aggregator.add_post(post)

        # Get summary
        summary = feed.get_feed_summary()
        assert isinstance(summary, dict)

    def test_full_portfolio_pipeline(self):
        """Test portfolio management pipeline."""
        from engine.portfolio import create_portfolio_optimizer

        optimizer = create_portfolio_optimizer(initial_capital=10000)

        # Calculate sizing
        sizing = optimizer.calculate_position_size(
            estimated_prob=0.70,
            market_price=0.55,
            market_id="portfolio-test"
        )

        # If recommended, open position
        if sizing['recommended']:
            position = optimizer.open_position(
                market_id="portfolio-test",
                market_name="Portfolio Test Market",
                side=sizing['suggested_side'],
                shares=sizing['shares'],
                entry_price=sizing['entry_price'],
                estimated_prob=0.70
            )

            assert position is not None
            assert optimizer.cash_balance < 10000  # Cash reduced

            # Get portfolio state
            state = optimizer.get_portfolio_state()
            assert state.num_positions == 1

            # Generate report
            report = optimizer.generate_report()
            assert len(report['positions']) == 1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
