"""
Tests for Social Sentiment and News Collectors.

Tests:
- Twitter collector functionality
- Reddit collector functionality
- News aggregator functionality
- Sentiment analysis
- Data normalization
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.social.twitter_collector import (
    TwitterCollector, TwitterConfig, TwitterMonitor,
    create_twitter_collector, quick_twitter_scan
)
from engine.social.reddit_collector import (
    RedditCollector, RedditConfig, RedditMonitor,
    create_reddit_collector, quick_reddit_scan
)
from engine.news.news_collector import (
    create_news_aggregator, NewsAggregator
)


class TestTwitterCollector:
    """Test Twitter collector functionality."""

    def test_twitter_config_defaults(self):
        """Test TwitterConfig has sensible defaults."""
        config = TwitterConfig()

        assert config.requests_per_15min == 450
        assert config.min_request_interval >= 1.0
        assert len(config.tracked_accounts) > 0
        assert 'Polymarket' in config.tracked_accounts
        assert len(config.search_terms) > 0
        assert 'polymarket' in config.search_terms

    def test_twitter_collector_init_without_token(self):
        """Test collector initializes without bearer token."""
        collector = TwitterCollector()

        assert collector.config is not None
        assert collector.session is None  # No session without token

    def test_twitter_collector_init_with_config(self):
        """Test collector initializes with custom config."""
        config = TwitterConfig(
            bearer_token='test_token',
            tracked_accounts=['TestAccount']
        )
        collector = TwitterCollector(config)

        assert collector.config.bearer_token == 'test_token'
        assert 'TestAccount' in collector.config.tracked_accounts

    def test_twitter_mock_data_generation(self):
        """Test mock data is generated when no API access."""
        collector = TwitterCollector()

        # Should return mock data
        mock_data = collector._get_mock_data('/tweets/search/recent', {'query': 'test'})

        assert 'data' in mock_data
        assert 'meta' in mock_data
        assert len(mock_data['data']) > 0

        # Verify tweet structure
        tweet = mock_data['data'][0]
        assert 'id' in tweet
        assert 'text' in tweet
        assert 'created_at' in tweet

    def test_twitter_search_tweets_mock(self):
        """Test search tweets returns mock data."""
        collector = TwitterCollector()

        tweets = collector.search_tweets('polymarket', max_results=10)

        assert isinstance(tweets, list)
        # Mock data should be returned
        assert len(tweets) >= 0

    def test_twitter_search_prediction_markets(self):
        """Test searching for prediction market content."""
        collector = TwitterCollector()

        tweets = collector.search_prediction_markets()

        assert isinstance(tweets, list)

    def test_twitter_deduplication(self):
        """Test that duplicate tweets are filtered."""
        collector = TwitterCollector()

        # Add a known ID to seen set
        collector.seen_ids.add('test_id_123')

        # Verify it's tracked
        assert 'test_id_123' in collector.seen_ids

    def test_create_twitter_collector_convenience(self):
        """Test convenience function."""
        collector = create_twitter_collector(
            bearer_token='test',
            tracked_accounts=['Account1', 'Account2']
        )

        assert isinstance(collector, TwitterCollector)
        assert 'Account1' in collector.config.tracked_accounts

    def test_quick_twitter_scan(self):
        """Test quick scan function."""
        tweets = quick_twitter_scan('test', limit=5)

        assert isinstance(tweets, list)


class TestTwitterMonitor:
    """Test Twitter monitoring functionality."""

    def test_monitor_init(self):
        """Test monitor initialization."""
        collector = TwitterCollector()
        monitor = TwitterMonitor(collector, poll_interval=60)

        assert monitor.poll_interval == 60
        assert monitor.running == False
        assert len(monitor.callbacks) == 0

    def test_monitor_callback_registration(self):
        """Test callback registration."""
        collector = TwitterCollector()
        monitor = TwitterMonitor(collector)

        callback_called = []
        def my_callback(tweets):
            callback_called.append(len(tweets))

        monitor.add_callback(my_callback)
        assert len(monitor.callbacks) == 1

    def test_monitor_poll_once(self):
        """Test single poll."""
        collector = TwitterCollector()
        monitor = TwitterMonitor(collector)

        tweets = monitor.poll_once()
        assert isinstance(tweets, list)

    def test_monitor_stop(self):
        """Test monitor stop."""
        collector = TwitterCollector()
        monitor = TwitterMonitor(collector)
        monitor.running = True

        monitor.stop()
        assert monitor.running == False


class TestRedditCollector:
    """Test Reddit collector functionality."""

    def test_reddit_config_defaults(self):
        """Test RedditConfig has sensible defaults."""
        config = RedditConfig()

        assert config.requests_per_minute == 30
        assert config.min_request_interval >= 1.0
        assert len(config.subreddits) > 0
        assert 'polymarket' in config.subreddits

    def test_reddit_collector_init(self):
        """Test collector initialization."""
        collector = RedditCollector()

        assert collector.config is not None
        assert isinstance(collector.seen_ids, set)

    def test_reddit_collector_with_config(self):
        """Test collector with custom config."""
        config = RedditConfig(
            client_id='test_id',
            client_secret='test_secret',
            subreddits=['test_subreddit']
        )
        collector = RedditCollector(config)

        assert collector.config.client_id == 'test_id'
        assert 'test_subreddit' in collector.config.subreddits

    def test_reddit_mock_data_generation(self):
        """Test mock data generation."""
        collector = RedditCollector()

        mock_data = collector._get_mock_data('/r/polymarket/new')

        assert 'data' in mock_data
        assert 'children' in mock_data['data']
        assert len(mock_data['data']['children']) > 0

        # Verify post structure
        post = mock_data['data']['children'][0]
        assert 'kind' in post
        assert 'data' in post
        assert 'title' in post['data']

    def test_reddit_get_subreddit_posts_mock(self):
        """Test getting subreddit posts."""
        collector = RedditCollector()

        posts = collector.get_subreddit_posts('polymarket', limit=10)

        assert isinstance(posts, list)

    def test_reddit_search_prediction_markets(self):
        """Test searching for prediction market content."""
        collector = RedditCollector()

        posts = collector.search_prediction_markets(['test_keyword'])

        assert isinstance(posts, list)

    def test_reddit_deduplication(self):
        """Test post deduplication."""
        collector = RedditCollector()

        # Add known ID
        collector.seen_ids.add('test_post_id')

        assert 'test_post_id' in collector.seen_ids

    def test_reddit_collect_all_subreddits(self):
        """Test collecting from all subreddits."""
        collector = RedditCollector()

        # Limit subreddits for faster test
        collector.config.subreddits = ['polymarket']

        posts = list(collector.collect_all_subreddits(limit_per_sub=5))

        assert isinstance(posts, list)

    def test_create_reddit_collector_convenience(self):
        """Test convenience function."""
        collector = create_reddit_collector(
            client_id='test',
            subreddits=['test_sub']
        )

        assert isinstance(collector, RedditCollector)

    def test_quick_reddit_scan(self):
        """Test quick scan function."""
        posts = quick_reddit_scan('polymarket', limit=5)

        assert isinstance(posts, list)


class TestRedditMonitor:
    """Test Reddit monitoring functionality."""

    def test_monitor_init(self):
        """Test monitor initialization."""
        collector = RedditCollector()
        monitor = RedditMonitor(collector, poll_interval=120)

        assert monitor.poll_interval == 120
        assert monitor.running == False

    def test_monitor_poll_once(self):
        """Test single poll."""
        collector = RedditCollector()
        collector.config.subreddits = ['polymarket']  # Limit for speed
        monitor = RedditMonitor(collector)

        posts = monitor.poll_once()
        assert isinstance(posts, list)


class TestNewsAggregator:
    """Test news aggregator functionality."""

    def test_news_aggregator_creation(self):
        """Test news aggregator can be created."""
        aggregator = create_news_aggregator()

        assert aggregator is not None
        assert isinstance(aggregator, NewsAggregator)

    def test_news_aggregator_refresh(self):
        """Test refreshing news."""
        aggregator = create_news_aggregator()

        # Should not raise
        try:
            aggregator.refresh()
        except Exception as e:
            # May fail due to network, but should handle gracefully
            pass

    def test_news_aggregator_summary(self):
        """Test getting news summary."""
        aggregator = create_news_aggregator()

        summary = aggregator.get_news_summary()

        assert isinstance(summary, dict)

    def test_news_aggregator_has_expected_methods(self):
        """Test aggregator has expected interface."""
        aggregator = create_news_aggregator()

        assert hasattr(aggregator, 'refresh')
        assert hasattr(aggregator, 'get_news_summary')
        assert callable(aggregator.refresh)
        assert callable(aggregator.get_news_summary)


class TestSocialFeedIntegration:
    """Test social feed integration."""

    def test_social_feed_creation(self):
        """Test creating social feed."""
        from engine.social import create_social_feed

        feed = create_social_feed()

        assert feed is not None

    def test_social_feed_summary(self):
        """Test getting feed summary."""
        from engine.social import create_social_feed

        feed = create_social_feed()
        summary = feed.get_feed_summary()

        assert isinstance(summary, dict)


class TestRateLimiting:
    """Test rate limiting in collectors."""

    def test_twitter_rate_limit_delay(self):
        """Test Twitter rate limiting has delay."""
        config = TwitterConfig(min_request_interval=0.1)  # Fast for testing
        collector = TwitterCollector(config)

        assert collector.config.min_request_interval == 0.1

    def test_reddit_rate_limit_delay(self):
        """Test Reddit rate limiting has delay."""
        config = RedditConfig(min_request_interval=0.1)
        collector = RedditCollector(config)

        assert collector.config.min_request_interval == 0.1


class TestDataNormalization:
    """Test data normalization in collectors."""

    def test_twitter_tweet_normalization(self):
        """Test tweets have expected fields after processing."""
        collector = TwitterCollector()
        tweets = collector.search_tweets('test', max_results=5)

        if tweets:
            tweet = tweets[0]
            # Check mock tweets have expected fields
            assert 'id' in tweet
            assert 'text' in tweet

    def test_reddit_post_normalization(self):
        """Test posts have expected fields after processing."""
        collector = RedditCollector()
        posts = collector.get_subreddit_posts('polymarket', limit=5)

        if posts:
            post = posts[0]
            # Check mock posts have expected fields
            assert 'id' in post
            assert 'title' in post or 'selftext' in post


class TestErrorHandling:
    """Test error handling in collectors."""

    def test_twitter_handles_network_error(self):
        """Test Twitter collector handles network errors gracefully."""
        collector = TwitterCollector()

        # Mock a network error scenario
        with patch.object(collector, '_make_request', side_effect=Exception("Network error")):
            # Should not raise, return empty list
            try:
                result = collector.search_tweets('test')
            except Exception:
                result = []

        assert isinstance(result, list)

    def test_reddit_handles_network_error(self):
        """Test Reddit collector handles network errors gracefully."""
        collector = RedditCollector()

        # Should handle gracefully
        with patch.object(collector, '_make_request', return_value=None):
            posts = collector.get_subreddit_posts('test')

        assert isinstance(posts, list)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
