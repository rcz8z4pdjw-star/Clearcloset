"""
Social Sentiment Analysis Module for Prediction Markets.

This module provides tools to monitor and analyze social media sentiment
related to prediction market topics. It aggregates data from X (Twitter)
and Reddit to generate sentiment signals that can be combined with
market data for enhanced opportunity detection.

COMPONENTS:
- SocialFeed: Unified interface for social data ingestion
- SentimentAnalyzer: Text sentiment analysis with PM-specific terms
- SocialAggregator: Aggregates and tracks sentiment over time
- RedditCollector: Collects posts from relevant subreddits
- TwitterCollector: Collects tweets from X/Twitter

USAGE:
    from engine.social import SocialFeed, create_social_feed

    # Create social feed
    feed = create_social_feed()

    # Set known markets for mention detection
    feed.set_known_markets({
        'market-123': 'Will Bitcoin reach $100k by 2025?',
        'market-456': 'Will the Fed cut rates in March?'
    })

    # Get market sentiment
    sentiment = feed.get_market_sentiment('market-123')
    print(f"Sentiment: {sentiment.avg_sentiment:.2f}")
    print(f"Mentions: {sentiment.total_posts}")

    # Get trading signal
    signal = feed.get_market_signal('market-123', 'Bitcoin $100k', 0.45)
    if signal:
        print(f"Direction: {signal.direction}")
        print(f"Strength: {signal.strength:.2f}")

KEY INSIGHTS FOR TRADING:
1. Volume spikes often precede market moves
2. Sentiment divergence from price can indicate mispricing
3. Viral discussions can cause temporary overreaction
4. Smart money often moves before social consensus forms
5. Reddit tends to be more bullish on retail-favored outcomes
6. Twitter verified accounts often have higher signal quality
"""

from .social_analyzer import (
    SocialFeed,
    SocialAggregator,
    SentimentAnalyzer,
    SocialPost,
    SocialMention,
    SocialSignal,
    SocialSource,
    SentimentLevel,
    create_social_feed,
)

from .reddit_collector import (
    RedditCollector,
    RedditMonitor,
    RedditConfig,
    create_reddit_collector,
    quick_reddit_scan,
)

from .twitter_collector import (
    TwitterCollector,
    TwitterMonitor,
    TwitterConfig,
    create_twitter_collector,
    quick_twitter_scan,
)

__all__ = [
    # Core components
    'SocialFeed',
    'SocialAggregator',
    'SentimentAnalyzer',

    # Data models
    'SocialPost',
    'SocialMention',
    'SocialSignal',
    'SocialSource',
    'SentimentLevel',

    # Reddit
    'RedditCollector',
    'RedditMonitor',
    'RedditConfig',
    'create_reddit_collector',
    'quick_reddit_scan',

    # Twitter
    'TwitterCollector',
    'TwitterMonitor',
    'TwitterConfig',
    'create_twitter_collector',
    'quick_twitter_scan',

    # Convenience
    'create_social_feed',
]
