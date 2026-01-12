"""
X (Twitter) Data Collector for Prediction Market Sentiment.

Monitors Twitter/X for discussions about prediction markets, specific
events, and trading sentiment from key accounts.

KEY ACCOUNTS TO MONITOR:
- @Polymarket - Official Polymarket account
- @Kalloosi - Kalshi discussions
- @NateSilver538 - Political forecasting
- @ElectionBettingOdds - Election betting
- Key political commentators and traders

SEARCH STRATEGIES:
- Direct platform mentions (polymarket, kalshi)
- Event-specific searches
- Influential account tracking
- Hashtag monitoring (#predictionmarkets, #bettingodds)
"""

import time
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Generator
import json
import random

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger

logger = get_logger("twitter_collector")

# Try to import requests
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests not installed - Twitter collection will use mock data")


@dataclass
class TwitterConfig:
    """Configuration for Twitter/X API access."""
    # Twitter API v2 Bearer Token
    bearer_token: Optional[str] = None

    # API v2 credentials (for user context)
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    access_token_secret: Optional[str] = None

    # Rate limiting (API v2 limits)
    requests_per_15min: int = 450
    min_request_interval: float = 2.0

    # Accounts to monitor
    tracked_accounts: List[str] = None

    # Search terms
    search_terms: List[str] = None

    # Hashtags
    hashtags: List[str] = None

    def __post_init__(self):
        if self.tracked_accounts is None:
            self.tracked_accounts = [
                'Polymarket',
                'Kalloosi',
                'NateSilver538',
                'ElectionBettingOdds',
                'PredictIt',
                'Metaculus',
                'GoodJudgment',
                'pmloser',  # Popular Polymarket trader
                'DKElections',
                'RealClearPolls',
            ]

        if self.search_terms is None:
            self.search_terms = [
                'polymarket',
                'kalshi',
                'prediction market',
                'betting odds',
                'election odds',
                'probability market',
            ]

        if self.hashtags is None:
            self.hashtags = [
                '#polymarket',
                '#kalshi',
                '#predictionmarkets',
                '#bettingodds',
                '#electionbetting',
            ]


class TwitterCollector:
    """
    Collects tweets from X/Twitter for sentiment analysis.

    Uses Twitter API v2 for searching and streaming tweets.
    """

    BASE_URL = "https://api.twitter.com/2"

    def __init__(self, config: Optional[TwitterConfig] = None):
        """
        Initialize Twitter collector.

        Args:
            config: Twitter API configuration
        """
        self.config = config or TwitterConfig()
        self.last_request: float = 0

        # Cache for deduplication
        self.seen_ids: set = set()

        # Request session
        if REQUESTS_AVAILABLE and self.config.bearer_token:
            self.session = requests.Session()
            self.session.headers.update({
                'Authorization': f'Bearer {self.config.bearer_token}',
                'User-Agent': 'PredictionMarketResearch/1.0'
            })
        else:
            self.session = None

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request
        if elapsed < self.config.min_request_interval:
            time.sleep(self.config.min_request_interval - elapsed)
        self.last_request = time.time()

    def _make_request(
        self,
        endpoint: str,
        params: Dict = None,
        method: str = 'GET'
    ) -> Optional[Dict]:
        """
        Make API request with rate limiting.

        Args:
            endpoint: API endpoint (relative to base URL)
            params: Query parameters
            method: HTTP method

        Returns:
            JSON response or None on error
        """
        if not self.session:
            return self._get_mock_data(endpoint, params)

        self._rate_limit()
        url = f"{self.BASE_URL}{endpoint}"

        try:
            if method == 'GET':
                response = self.session.get(url, params=params, timeout=10)
            else:
                response = self.session.post(url, json=params, timeout=10)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                # Rate limited - extract reset time from headers
                reset_time = response.headers.get('x-rate-limit-reset')
                if reset_time:
                    wait_time = int(reset_time) - time.time()
                    logger.warning(f"Twitter rate limited, waiting {wait_time}s")
                    time.sleep(max(0, wait_time) + 1)
                else:
                    time.sleep(60)
                return None
            elif response.status_code == 401:
                logger.error("Twitter API authentication failed")
                return None
            else:
                logger.error(f"Twitter API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Twitter request failed: {e}")
            return None

    def _get_mock_data(self, endpoint: str, params: Dict = None) -> Dict:
        """Generate mock Twitter data for testing without API access."""
        now = datetime.now(timezone.utc)
        query = params.get('query', '') if params else ''

        # Handle user lookup endpoint
        if '/users/by/username/' in endpoint:
            username = endpoint.split('/')[-1]
            return {
                'data': {
                    'id': f'mock_user_{hash(username) % 10000}',
                    'username': username,
                    'name': f'{username.title()} User',
                    'verified': username.lower() in ['polymarket', 'kalikiofficial'],
                    'public_metrics': {
                        'followers_count': 10000,
                        'following_count': 500,
                        'tweet_count': 1000
                    }
                }
            }

        # Handle user tweets endpoint
        if endpoint.startswith('/users/') and endpoint.endswith('/tweets'):
            # Return mock tweets for user timeline
            pass  # Fall through to default mock tweets below

        mock_tweets = []

        # Sample tweet content with varying sentiment
        mock_content = [
            {
                'text': 'Just loaded up on Polymarket. These odds are way too low! 🚀',
                'sentiment': 0.8,
                'author': 'crypto_trader_123',
                'followers': 5000,
                'verified': False,
            },
            {
                'text': 'Polymarket showing 65% YES but I think this is overpriced. Selling.',
                'sentiment': -0.5,
                'author': 'market_analyst',
                'followers': 15000,
                'verified': True,
            },
            {
                'text': 'Interesting market on Kalshi. Watching closely but not taking a position yet.',
                'sentiment': 0.1,
                'author': 'pm_watcher',
                'followers': 2000,
                'verified': False,
            },
            {
                'text': 'The prediction market odds seem completely disconnected from reality',
                'sentiment': -0.6,
                'author': 'skeptic_sam',
                'followers': 8000,
                'verified': False,
            },
            {
                'text': 'Free money alert! This Polymarket line is a guaranteed win 💰',
                'sentiment': 0.9,
                'author': 'degenerate_better',
                'followers': 500,
                'verified': False,
            },
            {
                'text': 'Prediction markets are the best source of truth. $500 on YES.',
                'sentiment': 0.7,
                'author': 'pm_enthusiast',
                'followers': 3000,
                'verified': False,
            },
            {
                'text': 'Why is everyone so bullish? This outcome seems unlikely to me.',
                'sentiment': -0.4,
                'author': 'contrarian_views',
                'followers': 12000,
                'verified': True,
            },
            {
                'text': 'New Kalshi market just dropped. Looks interesting but high vig.',
                'sentiment': 0.0,
                'author': 'kalshi_trader',
                'followers': 4000,
                'verified': False,
            },
            {
                'text': 'The smart money is clearly moving on this one. Following the whales.',
                'sentiment': 0.6,
                'author': 'flow_follower',
                'followers': 7000,
                'verified': False,
            },
            {
                'text': 'Polymarket volume spiking! Something is happening here 👀',
                'sentiment': 0.5,
                'author': 'volume_watcher',
                'followers': 9000,
                'verified': True,
            },
        ]

        for i, content in enumerate(mock_content):
            tweet_time = now - timedelta(minutes=random.randint(5, 120))
            tweet_id = hashlib.md5(f"{content['text']}_{tweet_time.timestamp()}".encode()).hexdigest()[:19]

            mock_tweets.append({
                'id': tweet_id,
                'text': content['text'],
                'created_at': tweet_time.isoformat().replace('+00:00', 'Z'),
                'author_id': hashlib.md5(content['author'].encode()).hexdigest()[:19],
                'public_metrics': {
                    'like_count': random.randint(10, 500),
                    'retweet_count': random.randint(0, 100),
                    'reply_count': random.randint(0, 50),
                    'quote_count': random.randint(0, 20),
                    'impression_count': random.randint(1000, 50000),
                },
                '_author': {
                    'username': content['author'],
                    'name': content['author'].replace('_', ' ').title(),
                    'verified': content['verified'],
                    'public_metrics': {
                        'followers_count': content['followers'],
                    }
                }
            })

        return {
            'data': mock_tweets,
            'meta': {
                'result_count': len(mock_tweets),
                'newest_id': mock_tweets[0]['id'] if mock_tweets else None,
                'oldest_id': mock_tweets[-1]['id'] if mock_tweets else None,
            }
        }

    def search_tweets(
        self,
        query: str,
        max_results: int = 100,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for tweets matching query.

        Args:
            query: Search query (supports Twitter search operators)
            max_results: Maximum tweets to return (10-100)
            start_time: Start of time range
            end_time: End of time range

        Returns:
            List of tweet data dictionaries
        """
        endpoint = "/tweets/search/recent"

        params = {
            'query': query,
            'max_results': min(100, max_results),
            'tweet.fields': 'created_at,public_metrics,author_id,conversation_id',
            'user.fields': 'username,name,verified,public_metrics',
            'expansions': 'author_id',
        }

        if start_time:
            params['start_time'] = start_time.isoformat().replace('+00:00', 'Z')
        if end_time:
            params['end_time'] = end_time.isoformat().replace('+00:00', 'Z')

        data = self._make_request(endpoint, params)

        if not data:
            return []

        # Build user lookup dict
        users = {}
        for user in data.get('includes', {}).get('users', []):
            users[user['id']] = user

        tweets = []
        for tweet in data.get('data', []):
            tweet_id = tweet.get('id')

            # Deduplication
            if tweet_id in self.seen_ids:
                continue
            self.seen_ids.add(tweet_id)

            # Add author info
            author_id = tweet.get('author_id')
            if author_id in users:
                tweet['author'] = users[author_id]
            elif '_author' in tweet:
                tweet['author'] = tweet['_author']

            tweets.append(tweet)

        return tweets

    def get_user_tweets(
        self,
        username: str,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get recent tweets from a specific user.

        Args:
            username: Twitter username (without @)
            max_results: Maximum tweets to return

        Returns:
            List of tweet data dictionaries
        """
        # First get user ID
        user_endpoint = f"/users/by/username/{username}"
        user_data = self._make_request(user_endpoint)

        if not user_data or 'data' not in user_data:
            logger.error(f"Could not find user: {username}")
            return []

        user_id = user_data['data']['id']

        # Get user's tweets
        tweets_endpoint = f"/users/{user_id}/tweets"
        params = {
            'max_results': min(100, max_results),
            'tweet.fields': 'created_at,public_metrics,conversation_id',
        }

        data = self._make_request(tweets_endpoint, params)

        if not data:
            return []

        tweets = []
        for tweet in data.get('data', []):
            tweet['author'] = user_data['data']
            tweets.append(tweet)

        return tweets

    def search_prediction_markets(
        self,
        additional_terms: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for prediction market related tweets.

        Args:
            additional_terms: Additional search terms

        Returns:
            List of relevant tweets
        """
        all_tweets = []

        # Build comprehensive query
        base_terms = self.config.search_terms + self.config.hashtags

        if additional_terms:
            base_terms.extend(additional_terms)

        # Search with OR operator
        query = ' OR '.join(f'"{term}"' if ' ' in term else term for term in base_terms[:5])
        query += ' -is:retweet lang:en'  # Exclude retweets, English only

        tweets = self.search_tweets(query, max_results=100)
        all_tweets.extend(tweets)

        return all_tweets

    def get_tracked_account_tweets(self) -> List[Dict[str, Any]]:
        """
        Get recent tweets from tracked accounts.

        Returns:
            List of tweets from tracked accounts
        """
        all_tweets = []

        for username in self.config.tracked_accounts:
            logger.debug(f"Fetching tweets from @{username}")
            tweets = self.get_user_tweets(username, max_results=20)
            all_tweets.extend(tweets)

        return all_tweets

    def collect_all(self) -> Generator[Dict[str, Any], None, None]:
        """
        Collect tweets from all sources.

        Yields:
            Tweet data dictionaries
        """
        # Search for prediction market content
        logger.info("Searching for prediction market tweets...")
        search_tweets = self.search_prediction_markets()
        for tweet in search_tweets:
            yield tweet

        # Get tracked account tweets
        logger.info("Fetching tracked account tweets...")
        account_tweets = self.get_tracked_account_tweets()
        for tweet in account_tweets:
            yield tweet


class TwitterMonitor:
    """
    Continuous monitoring of Twitter for prediction market content.
    """

    def __init__(
        self,
        collector: TwitterCollector,
        poll_interval: int = 300  # 5 minutes
    ):
        """
        Initialize monitor.

        Args:
            collector: TwitterCollector instance
            poll_interval: Seconds between polls
        """
        self.collector = collector
        self.poll_interval = poll_interval
        self.running = False
        self.callbacks = []

    def add_callback(self, callback):
        """Add callback function to be called with new tweets."""
        self.callbacks.append(callback)

    def _notify_callbacks(self, tweets: List[Dict]):
        """Notify all callbacks of new tweets."""
        for callback in self.callbacks:
            try:
                callback(tweets)
            except Exception as e:
                logger.error(f"Callback error: {e}")

    def poll_once(self) -> List[Dict[str, Any]]:
        """
        Perform a single poll for new tweets.

        Returns:
            List of new tweets
        """
        tweets = list(self.collector.collect_all())

        if tweets:
            self._notify_callbacks(tweets)

        return tweets

    def run(self, duration_minutes: Optional[int] = None):
        """
        Run continuous monitoring.

        Args:
            duration_minutes: How long to run (None = indefinitely)
        """
        self.running = True
        start_time = time.time()

        logger.info("Starting Twitter monitor...")

        while self.running:
            try:
                tweets = self.poll_once()
                logger.info(f"Collected {len(tweets)} tweets")

            except Exception as e:
                logger.error(f"Monitor error: {e}")

            # Check duration
            if duration_minutes:
                elapsed = (time.time() - start_time) / 60
                if elapsed >= duration_minutes:
                    logger.info("Monitor duration reached, stopping")
                    break

            time.sleep(self.poll_interval)

        self.running = False

    def stop(self):
        """Stop the monitor."""
        self.running = False


# Convenience functions
def create_twitter_collector(
    bearer_token: Optional[str] = None,
    tracked_accounts: Optional[List[str]] = None
) -> TwitterCollector:
    """
    Create a configured Twitter collector.

    Args:
        bearer_token: Twitter API v2 bearer token
        tracked_accounts: List of accounts to track

    Returns:
        Configured TwitterCollector
    """
    config = TwitterConfig(
        bearer_token=bearer_token,
        tracked_accounts=tracked_accounts
    )
    return TwitterCollector(config)


def quick_twitter_scan(query: str = 'polymarket', limit: int = 50) -> List[Dict]:
    """
    Quick scan of Twitter for a specific query.

    Args:
        query: Search query
        limit: Number of tweets

    Returns:
        List of tweets
    """
    collector = TwitterCollector()
    return collector.search_tweets(query, max_results=limit)
