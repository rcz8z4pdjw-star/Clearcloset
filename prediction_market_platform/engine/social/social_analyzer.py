"""
Social Sentiment Analyzer for Prediction Markets.

Monitors X (Twitter) and Reddit for discussions about prediction market
topics and calculates sentiment scores to identify social momentum.

KEY INSIGHTS:
- High social volume often precedes market moves
- Sentiment divergence from price can indicate mispricing
- Viral discussions can cause temporary overreaction
- Smart money often moves before social consensus forms
"""

import re
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
from collections import defaultdict
import hashlib

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger

logger = get_logger("social_analyzer")


class SentimentLevel(Enum):
    """Sentiment classification levels."""
    VERY_BEARISH = -2
    BEARISH = -1
    NEUTRAL = 0
    BULLISH = 1
    VERY_BULLISH = 2


class SocialSource(Enum):
    """Social media data sources."""
    TWITTER = "twitter"
    REDDIT = "reddit"
    DISCORD = "discord"
    TELEGRAM = "telegram"
    NEWS = "news"


@dataclass
class SocialPost:
    """Individual social media post/comment."""
    post_id: str
    source: SocialSource
    author: str
    content: str
    timestamp: datetime

    # Engagement metrics
    likes: int = 0
    shares: int = 0
    comments: int = 0
    views: int = 0

    # Reddit-specific
    subreddit: Optional[str] = None
    score: int = 0
    upvote_ratio: float = 0.5

    # Twitter-specific
    retweets: int = 0
    quotes: int = 0
    followers: int = 0
    verified: bool = False

    # Analysis results
    sentiment_score: float = 0.0  # -1 to 1
    confidence: float = 0.0
    mentioned_markets: List[str] = field(default_factory=list)
    mentioned_tickers: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)

    @property
    def engagement_score(self) -> float:
        """Calculate weighted engagement score."""
        # Twitter weighting
        if self.source == SocialSource.TWITTER:
            base = (
                self.likes * 1.0 +
                self.retweets * 3.0 +
                self.quotes * 4.0 +
                self.comments * 2.0
            )
            # Verified accounts get boost
            if self.verified:
                base *= 1.5
            # Follower-weighted
            if self.followers > 0:
                base *= math.log10(max(10, self.followers)) / 4
            return base

        # Reddit weighting
        elif self.source == SocialSource.REDDIT:
            base = self.score * self.upvote_ratio + self.comments * 2.0
            return base

        return self.likes + self.shares * 2 + self.comments


@dataclass
class SocialMention:
    """Aggregated mention data for a specific topic/market."""
    topic: str
    market_id: Optional[str] = None

    # Time window
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    # Volume metrics
    total_posts: int = 0
    total_engagement: float = 0.0
    unique_authors: int = 0

    # Sentiment metrics
    avg_sentiment: float = 0.0
    sentiment_std: float = 0.0
    bullish_count: int = 0
    bearish_count: int = 0
    neutral_count: int = 0

    # Source breakdown
    by_source: Dict[str, int] = field(default_factory=dict)

    # Top posts
    top_posts: List[SocialPost] = field(default_factory=list)

    # Trend metrics
    volume_change_1h: float = 0.0
    volume_change_24h: float = 0.0
    sentiment_change_1h: float = 0.0

    @property
    def sentiment_level(self) -> SentimentLevel:
        """Classify overall sentiment."""
        if self.avg_sentiment > 0.5:
            return SentimentLevel.VERY_BULLISH
        elif self.avg_sentiment > 0.15:
            return SentimentLevel.BULLISH
        elif self.avg_sentiment < -0.5:
            return SentimentLevel.VERY_BEARISH
        elif self.avg_sentiment < -0.15:
            return SentimentLevel.BEARISH
        return SentimentLevel.NEUTRAL

    @property
    def bullish_ratio(self) -> float:
        """Ratio of bullish to total sentiment posts."""
        total = self.bullish_count + self.bearish_count + self.neutral_count
        return self.bullish_count / total if total > 0 else 0.5

    @property
    def is_trending(self) -> bool:
        """Check if topic is trending based on volume change."""
        return self.volume_change_1h > 2.0 or self.volume_change_24h > 5.0


@dataclass
class SocialSignal:
    """Trading signal derived from social sentiment."""
    market_id: str
    market_name: str
    timestamp: datetime

    # Signal
    direction: str  # "bullish", "bearish", "neutral"
    strength: float  # 0-1
    confidence: float  # 0-1

    # Underlying metrics
    sentiment_score: float
    volume_score: float
    momentum_score: float
    divergence_score: float  # Sentiment vs price divergence

    # Context
    total_mentions: int
    top_keywords: List[str]
    explanation: str

    # Source breakdown
    twitter_sentiment: float = 0.0
    reddit_sentiment: float = 0.0


class SentimentAnalyzer:
    """
    Analyzes text sentiment for prediction market context.

    Uses keyword-based sentiment with prediction market specific terms
    and patterns. Can be extended with ML models.
    """

    # Prediction market specific bullish indicators
    BULLISH_KEYWORDS = {
        # Strong bullish
        'lock': 2.0, 'guaranteed': 2.0, 'certain': 1.8, 'inevitable': 1.8,
        'definitely': 1.5, 'obvious': 1.5, 'slam dunk': 2.0, 'easy money': 2.0,
        'free money': 2.0, 'cant lose': 2.0, "can't lose": 2.0,

        # Medium bullish
        'likely': 1.0, 'probable': 1.0, 'confident': 1.2, 'bullish': 1.5,
        'buying': 1.0, 'long': 0.8, 'yes': 0.5, 'will happen': 1.2,
        'going to win': 1.5, 'gonna win': 1.5, 'will win': 1.3,

        # Mild bullish
        'probably': 0.7, 'maybe': 0.3, 'possible': 0.3, 'could': 0.2,
        'leaning': 0.5, 'thinking': 0.3, 'expect': 0.8, 'should': 0.6,

        # Market-specific
        'underpriced': 1.5, 'undervalued': 1.5, 'cheap': 1.0, 'bargain': 1.3,
        'mispriced low': 1.5, 'buy the dip': 1.2, 'loading up': 1.3,
    }

    # Prediction market specific bearish indicators
    BEARISH_KEYWORDS = {
        # Strong bearish
        'impossible': -2.0, 'never': -1.8, 'no way': -2.0, 'no chance': -2.0,
        'delusional': -1.5, 'cope': -1.3, 'copium': -1.5,

        # Medium bearish
        'unlikely': -1.0, 'doubt': -1.0, 'skeptical': -0.8, 'bearish': -1.5,
        'selling': -1.0, 'short': -0.8, 'no': -0.5, 'wont happen': -1.2,
        "won't happen": -1.2, 'going to lose': -1.5, 'gonna lose': -1.5,

        # Mild bearish
        'probably not': -0.7, 'dont think': -0.5, "don't think": -0.5,
        'not sure': -0.3, 'risky': -0.5, 'dangerous': -0.6,

        # Market-specific
        'overpriced': -1.5, 'overvalued': -1.5, 'expensive': -1.0,
        'bubble': -1.3, 'mispriced high': -1.5, 'exit': -1.0, 'dump': -1.2,
        'trap': -1.0, 'suckers': -1.5,
    }

    # Neutral/noise indicators
    NEUTRAL_KEYWORDS = {
        'question', 'what if', 'anyone know', 'thoughts?', 'opinions?',
        'discussing', 'debate', 'interesting', '50/50', 'coin flip',
    }

    # Negation words that flip sentiment
    NEGATION_WORDS = {
        'not', "n't", 'no', 'never', 'neither', 'nobody', 'nothing',
        'nowhere', 'hardly', 'barely', 'without', 'except',
    }

    def __init__(self):
        """Initialize sentiment analyzer."""
        self.cache = {}

    def analyze(self, text: str) -> Tuple[float, float]:
        """
        Analyze sentiment of text.

        Returns:
            Tuple of (sentiment_score, confidence)
            sentiment_score: -1 (bearish) to 1 (bullish)
            confidence: 0 to 1
        """
        # Check cache
        text_hash = hashlib.md5(text.encode()).hexdigest()
        if text_hash in self.cache:
            return self.cache[text_hash]

        text_lower = text.lower()
        words = text_lower.split()

        sentiment = 0.0
        signals = 0

        # Check for negation context
        negation_active = False
        negation_window = 0

        for i, word in enumerate(words):
            # Track negation
            if word in self.NEGATION_WORDS or word.endswith("n't"):
                negation_active = True
                negation_window = 3  # Negation affects next 3 words
            elif negation_window > 0:
                negation_window -= 1
                if negation_window == 0:
                    negation_active = False

            # Check bullish keywords
            for keyword, weight in self.BULLISH_KEYWORDS.items():
                if keyword in text_lower:
                    score = weight if not negation_active else -weight * 0.5
                    sentiment += score
                    signals += 1

            # Check bearish keywords
            for keyword, weight in self.BEARISH_KEYWORDS.items():
                if keyword in text_lower:
                    score = weight if not negation_active else -weight * 0.5
                    sentiment += score
                    signals += 1

        # Normalize sentiment to -1 to 1 range
        if signals > 0:
            sentiment = max(-1, min(1, sentiment / (signals + 2)))

        # Calculate confidence based on signal density and text length
        word_count = len(words)
        signal_density = signals / max(1, word_count) * 10
        confidence = min(1.0, signal_density * 0.5 + (0.3 if signals > 2 else 0))

        # Cache result
        self.cache[text_hash] = (sentiment, confidence)

        return sentiment, confidence

    def extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text."""
        text_lower = text.lower()
        keywords = []

        # Market-related terms
        market_terms = [
            'polymarket', 'kalshi', 'prediction market', 'betting',
            'odds', 'probability', 'outcome', 'resolution',
        ]

        for term in market_terms:
            if term in text_lower:
                keywords.append(term)

        # Political terms
        political_terms = [
            'trump', 'biden', 'election', 'president', 'vote',
            'democrat', 'republican', 'congress', 'senate',
        ]

        for term in political_terms:
            if term in text_lower:
                keywords.append(term)

        # Crypto terms
        crypto_terms = [
            'bitcoin', 'btc', 'ethereum', 'eth', 'crypto',
            'sec', 'etf', 'regulation',
        ]

        for term in crypto_terms:
            if term in text_lower:
                keywords.append(term)

        return list(set(keywords))

    def detect_market_mentions(
        self,
        text: str,
        known_markets: Optional[Dict[str, str]] = None
    ) -> List[str]:
        """
        Detect mentions of specific markets in text.

        Args:
            text: Text to analyze
            known_markets: Dict mapping market_id to market question

        Returns:
            List of detected market IDs
        """
        mentions = []
        text_lower = text.lower()

        if known_markets:
            for market_id, question in known_markets.items():
                # Check for exact question match or key terms
                question_lower = question.lower()
                key_terms = [
                    term for term in question_lower.split()
                    if len(term) > 4 and term not in {'will', 'the', 'this', 'that'}
                ]

                matches = sum(1 for term in key_terms if term in text_lower)
                if matches >= len(key_terms) * 0.5:  # 50% term match
                    mentions.append(market_id)

        return mentions


class SocialAggregator:
    """
    Aggregates social data from multiple sources and calculates
    composite sentiment metrics.
    """

    def __init__(
        self,
        lookback_hours: int = 24,
        min_posts_for_signal: int = 5
    ):
        """
        Initialize aggregator.

        Args:
            lookback_hours: How far back to look for posts
            min_posts_for_signal: Minimum posts needed to generate signal
        """
        self.lookback_hours = lookback_hours
        self.min_posts_for_signal = min_posts_for_signal
        self.sentiment_analyzer = SentimentAnalyzer()

        # Store posts by topic
        self.posts_by_topic: Dict[str, List[SocialPost]] = defaultdict(list)

        # Historical aggregations for trend calculation
        self.historical_mentions: Dict[str, List[SocialMention]] = defaultdict(list)

    def add_post(self, post: SocialPost):
        """Add a post to the aggregator."""
        # Analyze sentiment if not already done
        if post.sentiment_score == 0 and post.content:
            sentiment, confidence = self.sentiment_analyzer.analyze(post.content)
            post.sentiment_score = sentiment
            post.confidence = confidence
            post.keywords = self.sentiment_analyzer.extract_keywords(post.content)

        # Add to relevant topics
        for keyword in post.keywords:
            self.posts_by_topic[keyword].append(post)

        # Add to mentioned markets
        for market_id in post.mentioned_markets:
            self.posts_by_topic[f"market:{market_id}"].append(post)

    def add_posts(self, posts: List[SocialPost]):
        """Add multiple posts."""
        for post in posts:
            self.add_post(post)

    def get_mention_stats(
        self,
        topic: str,
        hours: Optional[int] = None
    ) -> SocialMention:
        """
        Get aggregated mention statistics for a topic.

        Args:
            topic: Topic to analyze (keyword or "market:market_id")
            hours: Lookback period (defaults to self.lookback_hours)

        Returns:
            SocialMention with aggregated stats
        """
        hours = hours or self.lookback_hours
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

        posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if p.timestamp >= cutoff
        ]

        if not posts:
            return SocialMention(topic=topic)

        # Calculate metrics
        sentiments = [p.sentiment_score for p in posts]
        avg_sentiment = sum(sentiments) / len(sentiments)

        # Sentiment standard deviation
        if len(sentiments) > 1:
            variance = sum((s - avg_sentiment) ** 2 for s in sentiments) / len(sentiments)
            sentiment_std = math.sqrt(variance)
        else:
            sentiment_std = 0

        # Count by sentiment level
        bullish = sum(1 for s in sentiments if s > 0.15)
        bearish = sum(1 for s in sentiments if s < -0.15)
        neutral = len(sentiments) - bullish - bearish

        # Source breakdown
        by_source = defaultdict(int)
        for post in posts:
            by_source[post.source.value] += 1

        # Total engagement
        total_engagement = sum(p.engagement_score for p in posts)

        # Unique authors
        unique_authors = len(set(p.author for p in posts))

        # Top posts by engagement
        top_posts = sorted(posts, key=lambda p: p.engagement_score, reverse=True)[:10]

        # Calculate trend metrics
        volume_change_1h = self._calculate_volume_change(topic, 1)
        volume_change_24h = self._calculate_volume_change(topic, 24)
        sentiment_change_1h = self._calculate_sentiment_change(topic, 1)

        mention = SocialMention(
            topic=topic,
            start_time=min(p.timestamp for p in posts),
            end_time=max(p.timestamp for p in posts),
            total_posts=len(posts),
            total_engagement=total_engagement,
            unique_authors=unique_authors,
            avg_sentiment=avg_sentiment,
            sentiment_std=sentiment_std,
            bullish_count=bullish,
            bearish_count=bearish,
            neutral_count=neutral,
            by_source=dict(by_source),
            top_posts=top_posts,
            volume_change_1h=volume_change_1h,
            volume_change_24h=volume_change_24h,
            sentiment_change_1h=sentiment_change_1h,
        )

        # Store for historical tracking
        self.historical_mentions[topic].append(mention)

        return mention

    def _calculate_volume_change(self, topic: str, hours: int) -> float:
        """Calculate volume change ratio over time period."""
        now = datetime.now(timezone.utc)

        # Current period
        current_cutoff = now - timedelta(hours=hours)
        current_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if p.timestamp >= current_cutoff
        ]

        # Previous period
        prev_cutoff = current_cutoff - timedelta(hours=hours)
        prev_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if prev_cutoff <= p.timestamp < current_cutoff
        ]

        current_count = len(current_posts)
        prev_count = len(prev_posts)

        if prev_count == 0:
            return float(current_count) if current_count > 0 else 0.0

        return current_count / prev_count

    def _calculate_sentiment_change(self, topic: str, hours: int) -> float:
        """Calculate sentiment change over time period."""
        now = datetime.now(timezone.utc)

        # Current period
        current_cutoff = now - timedelta(hours=hours)
        current_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if p.timestamp >= current_cutoff
        ]

        # Previous period
        prev_cutoff = current_cutoff - timedelta(hours=hours)
        prev_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if prev_cutoff <= p.timestamp < current_cutoff
        ]

        if not current_posts or not prev_posts:
            return 0.0

        current_sentiment = sum(p.sentiment_score for p in current_posts) / len(current_posts)
        prev_sentiment = sum(p.sentiment_score for p in prev_posts) / len(prev_posts)

        return current_sentiment - prev_sentiment

    def generate_signal(
        self,
        market_id: str,
        market_name: str,
        current_price: float
    ) -> Optional[SocialSignal]:
        """
        Generate a trading signal based on social sentiment.

        Args:
            market_id: Market identifier
            market_name: Human-readable market name
            current_price: Current market price (0-1)

        Returns:
            SocialSignal if sufficient data, None otherwise
        """
        topic = f"market:{market_id}"
        mention = self.get_mention_stats(topic)

        if mention.total_posts < self.min_posts_for_signal:
            return None

        # Calculate component scores
        sentiment_score = mention.avg_sentiment

        # Volume score (normalized by typical volume)
        volume_score = min(1.0, mention.total_posts / 50)

        # Momentum score (based on volume and sentiment change)
        momentum_score = (
            0.5 * min(1.0, mention.volume_change_1h / 3) +
            0.5 * abs(mention.sentiment_change_1h)
        )

        # Divergence score (sentiment vs price)
        # If sentiment is bullish but price is low, or vice versa
        expected_price_from_sentiment = (sentiment_score + 1) / 2  # Map -1,1 to 0,1
        divergence_score = expected_price_from_sentiment - current_price

        # Determine direction
        if sentiment_score > 0.2 and divergence_score > 0.1:
            direction = "bullish"
        elif sentiment_score < -0.2 and divergence_score < -0.1:
            direction = "bearish"
        else:
            direction = "neutral"

        # Calculate overall strength
        strength = (
            0.4 * abs(sentiment_score) +
            0.3 * volume_score +
            0.3 * momentum_score
        )

        # Confidence based on data quality
        confidence = min(1.0, (
            0.3 * min(1.0, mention.total_posts / 20) +
            0.3 * min(1.0, mention.unique_authors / 10) +
            0.4 * (1 - mention.sentiment_std)  # Lower std = higher confidence
        ))

        # Build explanation
        explanation_parts = []
        if mention.is_trending:
            explanation_parts.append(f"Trending ({mention.volume_change_1h:.1f}x volume)")

        explanation_parts.append(
            f"{mention.bullish_count} bullish, {mention.bearish_count} bearish posts"
        )

        if abs(divergence_score) > 0.1:
            explanation_parts.append(
                f"Sentiment-price divergence: {divergence_score:+.2f}"
            )

        # Get source-specific sentiment
        twitter_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if p.source == SocialSource.TWITTER
        ]
        reddit_posts = [
            p for p in self.posts_by_topic.get(topic, [])
            if p.source == SocialSource.REDDIT
        ]

        twitter_sentiment = (
            sum(p.sentiment_score for p in twitter_posts) / len(twitter_posts)
            if twitter_posts else 0.0
        )
        reddit_sentiment = (
            sum(p.sentiment_score for p in reddit_posts) / len(reddit_posts)
            if reddit_posts else 0.0
        )

        return SocialSignal(
            market_id=market_id,
            market_name=market_name,
            timestamp=datetime.now(timezone.utc),
            direction=direction,
            strength=strength,
            confidence=confidence,
            sentiment_score=sentiment_score,
            volume_score=volume_score,
            momentum_score=momentum_score,
            divergence_score=divergence_score,
            total_mentions=mention.total_posts,
            top_keywords=mention.top_posts[0].keywords if mention.top_posts else [],
            explanation="; ".join(explanation_parts),
            twitter_sentiment=twitter_sentiment,
            reddit_sentiment=reddit_sentiment,
        )

    def get_trending_topics(self, min_posts: int = 10) -> List[Tuple[str, SocialMention]]:
        """
        Get currently trending topics.

        Args:
            min_posts: Minimum posts to be considered

        Returns:
            List of (topic, SocialMention) tuples sorted by trending score
        """
        trending = []

        for topic in self.posts_by_topic.keys():
            mention = self.get_mention_stats(topic, hours=24)

            if mention.total_posts >= min_posts and mention.is_trending:
                # Calculate trending score
                trend_score = (
                    mention.volume_change_1h * 0.6 +
                    mention.volume_change_24h * 0.2 +
                    abs(mention.sentiment_change_1h) * 0.2
                )
                trending.append((topic, mention, trend_score))

        # Sort by trending score
        trending.sort(key=lambda x: x[2], reverse=True)

        return [(t[0], t[1]) for t in trending[:20]]

    def get_sentiment_leaders(
        self,
        hours: int = 24
    ) -> Dict[str, List[SocialPost]]:
        """
        Get posts from high-engagement accounts that may be sentiment leaders.

        Returns:
            Dict mapping topic to influential posts
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        leaders = {}

        for topic, posts in self.posts_by_topic.items():
            # Filter by time
            recent = [p for p in posts if p.timestamp >= cutoff]

            # Find high-engagement posts
            influential = [
                p for p in recent
                if p.engagement_score > 100 or (
                    p.source == SocialSource.TWITTER and p.followers > 10000
                )
            ]

            if influential:
                leaders[topic] = sorted(
                    influential,
                    key=lambda p: p.engagement_score,
                    reverse=True
                )[:5]

        return leaders

    def get_market_sentiment(
        self,
        market_id: str,
        hours: Optional[int] = None
    ) -> Optional[SocialMention]:
        """
        Get sentiment data for a specific market.

        Args:
            market_id: Market identifier
            hours: Lookback period

        Returns:
            SocialMention with market sentiment or None if no data
        """
        topic = f"market:{market_id}"
        mention = self.get_mention_stats(topic, hours=hours)

        if mention.total_posts == 0:
            return None

        return mention


class SocialFeed:
    """
    Real-time social feed for monitoring prediction market discussions.
    Combines data from multiple sources into a unified stream.
    """

    def __init__(self):
        """Initialize social feed."""
        self.aggregator = SocialAggregator()
        self.known_markets: Dict[str, str] = {}  # market_id -> question

        # Subreddits to monitor
        self.reddit_subreddits = [
            'polymarket', 'Kalshi', 'predictit', 'predictionmarkets',
            'wallstreetbets', 'stocks', 'investing', 'cryptocurrency',
            'politics', 'PoliticalDiscussion', 'NeutralPolitics',
        ]

        # Twitter search terms
        self.twitter_search_terms = [
            'polymarket', 'kalshi', 'prediction market',
            'betting odds', 'election odds',
        ]

    def set_known_markets(self, markets: Dict[str, str]):
        """Set known markets for mention detection."""
        self.known_markets = markets

    def process_reddit_post(
        self,
        post_data: Dict[str, Any],
        subreddit: str
    ) -> SocialPost:
        """
        Process a Reddit post/comment into SocialPost format.

        Args:
            post_data: Reddit API response data
            subreddit: Subreddit name

        Returns:
            Processed SocialPost
        """
        # Handle both posts and comments
        is_comment = 'body' in post_data
        content = post_data.get('body', '') or post_data.get('selftext', '') or post_data.get('title', '')

        post = SocialPost(
            post_id=post_data.get('id', ''),
            source=SocialSource.REDDIT,
            author=post_data.get('author', '[deleted]'),
            content=content,
            timestamp=datetime.fromtimestamp(
                post_data.get('created_utc', 0),
                tz=timezone.utc
            ),
            subreddit=subreddit,
            score=post_data.get('score', 0),
            upvote_ratio=post_data.get('upvote_ratio', 0.5),
            comments=post_data.get('num_comments', 0),
        )

        # Detect market mentions
        post.mentioned_markets = self.aggregator.sentiment_analyzer.detect_market_mentions(
            content, self.known_markets
        )

        return post

    def process_twitter_post(self, tweet_data: Dict[str, Any]) -> SocialPost:
        """
        Process a Twitter/X post into SocialPost format.

        Args:
            tweet_data: Twitter API response data

        Returns:
            Processed SocialPost
        """
        # Handle Twitter API v2 format
        public_metrics = tweet_data.get('public_metrics', {})
        author_info = tweet_data.get('author', {})

        post = SocialPost(
            post_id=tweet_data.get('id', ''),
            source=SocialSource.TWITTER,
            author=author_info.get('username', ''),
            content=tweet_data.get('text', ''),
            timestamp=datetime.fromisoformat(
                tweet_data.get('created_at', '').replace('Z', '+00:00')
            ) if tweet_data.get('created_at') else datetime.now(timezone.utc),
            likes=public_metrics.get('like_count', 0),
            retweets=public_metrics.get('retweet_count', 0),
            quotes=public_metrics.get('quote_count', 0),
            comments=public_metrics.get('reply_count', 0),
            views=public_metrics.get('impression_count', 0),
            followers=author_info.get('public_metrics', {}).get('followers_count', 0),
            verified=author_info.get('verified', False),
        )

        # Detect market mentions
        post.mentioned_markets = self.aggregator.sentiment_analyzer.detect_market_mentions(
            post.content, self.known_markets
        )

        return post

    def ingest_posts(self, posts: List[SocialPost]):
        """Ingest posts into the aggregator."""
        self.aggregator.add_posts(posts)

    def get_market_sentiment(self, market_id: str) -> Optional[SocialMention]:
        """Get sentiment for a specific market."""
        return self.aggregator.get_mention_stats(f"market:{market_id}")

    def get_market_signal(
        self,
        market_id: str,
        market_name: str,
        current_price: float
    ) -> Optional[SocialSignal]:
        """Get trading signal for a market based on social sentiment."""
        return self.aggregator.generate_signal(market_id, market_name, current_price)

    def get_feed_summary(self) -> Dict[str, Any]:
        """
        Get a summary of current social feed activity.

        Returns:
            Dict with feed statistics and highlights
        """
        # Get trending topics
        trending = self.aggregator.get_trending_topics()

        # Get sentiment leaders
        leaders = self.aggregator.get_sentiment_leaders()

        # Calculate overall stats
        total_posts = sum(
            len(posts) for posts in self.aggregator.posts_by_topic.values()
        )

        # Recent posts (last hour)
        hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_posts = sum(
            1 for posts in self.aggregator.posts_by_topic.values()
            for p in posts if p.timestamp >= hour_ago
        )

        return {
            'total_posts_tracked': total_posts,
            'posts_last_hour': recent_posts,
            'topics_tracked': len(self.aggregator.posts_by_topic),
            'trending_topics': [
                {
                    'topic': topic,
                    'posts': mention.total_posts,
                    'sentiment': mention.sentiment_level.name,
                    'volume_change_1h': mention.volume_change_1h,
                }
                for topic, mention in trending[:10]
            ],
            'sentiment_leaders': {
                topic: [
                    {
                        'author': p.author,
                        'sentiment': p.sentiment_score,
                        'engagement': p.engagement_score,
                    }
                    for p in posts[:3]
                ]
                for topic, posts in list(leaders.items())[:5]
            },
        }


# Convenience function
def create_social_feed() -> SocialFeed:
    """Create and return a configured social feed instance."""
    return SocialFeed()
