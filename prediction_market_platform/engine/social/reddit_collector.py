"""
Reddit Data Collector for Prediction Market Sentiment.

Monitors relevant subreddits for discussions about prediction markets,
specific events, and trading sentiment.

SUBREDDITS OF INTEREST:
- r/polymarket - Direct Polymarket discussions
- r/Kalshi - Kalshi market discussions
- r/predictit - PredictIt discussions
- r/predictionmarkets - General prediction market discussion
- r/wallstreetbets - Retail trader sentiment
- r/politics - Political event discussions
- r/cryptocurrency - Crypto market discussions
"""

import time
import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Generator
import json

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger

logger = get_logger("reddit_collector")

# Try to import requests, provide fallback
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests not installed - Reddit collection will use mock data")


@dataclass
class RedditConfig:
    """Configuration for Reddit API access."""
    # Reddit API credentials (for authenticated access)
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    user_agent: str = "PredictionMarketResearch/1.0"

    # Rate limiting
    requests_per_minute: int = 30
    min_request_interval: float = 2.0

    # Subreddits to monitor
    subreddits: List[str] = None

    def __post_init__(self):
        if self.subreddits is None:
            self.subreddits = [
                'polymarket',
                'Kalshi',
                'predictit',
                'predictionmarkets',
                'wallstreetbets',
                'stocks',
                'investing',
                'cryptocurrency',
                'politics',
                'PoliticalDiscussion',
            ]


class RedditCollector:
    """
    Collects posts and comments from Reddit for sentiment analysis.

    Uses Reddit's public JSON API (no auth required for basic access)
    or authenticated API for higher rate limits.
    """

    BASE_URL = "https://www.reddit.com"
    OAUTH_URL = "https://oauth.reddit.com"

    def __init__(self, config: Optional[RedditConfig] = None):
        """
        Initialize Reddit collector.

        Args:
            config: Reddit API configuration
        """
        self.config = config or RedditConfig()
        self.access_token: Optional[str] = None
        self.token_expires: Optional[datetime] = None
        self.last_request: float = 0

        # Cache for deduplication
        self.seen_ids: set = set()

        # Request session
        if REQUESTS_AVAILABLE:
            self.session = requests.Session()
            self.session.headers.update({
                'User-Agent': self.config.user_agent
            })
        else:
            self.session = None

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request
        if elapsed < self.config.min_request_interval:
            time.sleep(self.config.min_request_interval - elapsed)
        self.last_request = time.time()

    def _get_auth_token(self) -> Optional[str]:
        """Get OAuth2 access token for authenticated API access."""
        if not self.config.client_id or not self.config.client_secret:
            return None

        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token

        if not REQUESTS_AVAILABLE:
            return None

        try:
            auth = (self.config.client_id, self.config.client_secret)
            data = {
                'grant_type': 'client_credentials'
            }

            response = requests.post(
                'https://www.reddit.com/api/v1/access_token',
                auth=auth,
                data=data,
                headers={'User-Agent': self.config.user_agent}
            )

            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                self.token_expires = datetime.now() + timedelta(
                    seconds=token_data['expires_in'] - 60
                )
                return self.access_token

        except Exception as e:
            logger.error(f"Failed to get Reddit auth token: {e}")

        return None

    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """
        Make API request with rate limiting.

        Args:
            endpoint: API endpoint (relative to base URL)
            params: Query parameters

        Returns:
            JSON response or None on error
        """
        if not REQUESTS_AVAILABLE:
            return self._get_mock_data(endpoint)

        self._rate_limit()

        # Try authenticated first
        token = self._get_auth_token()

        if token:
            url = f"{self.OAUTH_URL}{endpoint}"
            headers = {'Authorization': f'Bearer {token}'}
        else:
            url = f"{self.BASE_URL}{endpoint}.json"
            headers = {}

        try:
            response = self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                logger.warning("Reddit rate limited, backing off...")
                time.sleep(60)
                return None
            else:
                logger.error(f"Reddit API error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Reddit request failed: {e}")
            return None

    def _get_mock_data(self, endpoint: str) -> Dict:
        """Generate mock data for testing without API access."""
        # Parse subreddit from endpoint
        parts = endpoint.split('/')
        subreddit = parts[2] if len(parts) > 2 else 'polymarket'

        now = datetime.now(timezone.utc)
        mock_posts = []

        # Generate diverse mock posts
        mock_content = [
            ("Market looking bullish on this one, loading up!", 0.7),
            ("No way this happens, easy NO bet", -0.6),
            ("50/50 imo, waiting for more info", 0.0),
            ("Polymarket odds seem way off here", 0.3),
            ("Anyone else think this is overpriced?", -0.3),
            ("Just put $500 on YES, feeling confident", 0.8),
            ("This is a trap, don't fall for it", -0.7),
            ("Interesting market, watching closely", 0.1),
            ("The smart money is clearly on NO here", -0.5),
            ("Lock of the century, can't lose!", 0.9),
        ]

        for i, (content, _) in enumerate(mock_content):
            mock_posts.append({
                'kind': 't3',
                'data': {
                    'id': hashlib.md5(f"{subreddit}_{i}_{now.timestamp()}".encode()).hexdigest()[:8],
                    'subreddit': subreddit,
                    'author': f'mock_user_{i}',
                    'title': f'Discussion: {content[:30]}...',
                    'selftext': content,
                    'score': 50 + i * 10,
                    'upvote_ratio': 0.7 + (i % 3) * 0.1,
                    'num_comments': 5 + i * 2,
                    'created_utc': (now - timedelta(hours=i)).timestamp(),
                    'permalink': f'/r/{subreddit}/comments/mock{i}',
                }
            })

        return {
            'data': {
                'children': mock_posts,
                'after': None
            }
        }

    def get_subreddit_posts(
        self,
        subreddit: str,
        sort: str = 'new',
        limit: int = 25,
        time_filter: str = 'day'
    ) -> List[Dict[str, Any]]:
        """
        Get posts from a subreddit.

        Args:
            subreddit: Subreddit name (without r/)
            sort: Sort method (new, hot, top, rising)
            limit: Number of posts to fetch
            time_filter: Time filter for top posts (hour, day, week, month, year)

        Returns:
            List of post data dictionaries
        """
        endpoint = f"/r/{subreddit}/{sort}"
        params = {
            'limit': limit,
            't': time_filter
        }

        data = self._make_request(endpoint, params)

        if not data:
            return []

        posts = []
        for child in data.get('data', {}).get('children', []):
            post_data = child.get('data', {})
            post_id = post_data.get('id')

            # Deduplication
            if post_id in self.seen_ids:
                continue
            self.seen_ids.add(post_id)

            posts.append(post_data)

        return posts

    def get_post_comments(
        self,
        subreddit: str,
        post_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get comments for a specific post.

        Args:
            subreddit: Subreddit name
            post_id: Post ID
            limit: Maximum comments to fetch

        Returns:
            List of comment data dictionaries
        """
        endpoint = f"/r/{subreddit}/comments/{post_id}"
        params = {'limit': limit}

        data = self._make_request(endpoint, params)

        if not data or len(data) < 2:
            return []

        comments = []
        self._extract_comments(data[1].get('data', {}).get('children', []), comments)

        return comments

    def _extract_comments(self, children: List, comments: List):
        """Recursively extract comments from Reddit response."""
        for child in children:
            if child.get('kind') != 't1':
                continue

            comment_data = child.get('data', {})
            comment_id = comment_data.get('id')

            if comment_id and comment_id not in self.seen_ids:
                self.seen_ids.add(comment_id)
                comments.append(comment_data)

            # Get replies
            replies = comment_data.get('replies', {})
            if isinstance(replies, dict):
                reply_children = replies.get('data', {}).get('children', [])
                self._extract_comments(reply_children, comments)

    def search_subreddit(
        self,
        subreddit: str,
        query: str,
        sort: str = 'relevance',
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Search within a subreddit.

        Args:
            subreddit: Subreddit to search
            query: Search query
            sort: Sort method (relevance, hot, top, new, comments)
            limit: Maximum results

        Returns:
            List of matching posts
        """
        endpoint = f"/r/{subreddit}/search"
        params = {
            'q': query,
            'restrict_sr': 'on',
            'sort': sort,
            'limit': limit
        }

        data = self._make_request(endpoint, params)

        if not data:
            return []

        posts = []
        for child in data.get('data', {}).get('children', []):
            posts.append(child.get('data', {}))

        return posts

    def collect_all_subreddits(
        self,
        sort: str = 'new',
        limit_per_sub: int = 25
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Collect posts from all configured subreddits.

        Args:
            sort: Sort method
            limit_per_sub: Posts per subreddit

        Yields:
            Post data dictionaries with subreddit info
        """
        for subreddit in self.config.subreddits:
            logger.info(f"Collecting from r/{subreddit}")

            posts = self.get_subreddit_posts(
                subreddit,
                sort=sort,
                limit=limit_per_sub
            )

            for post in posts:
                post['_subreddit'] = subreddit
                yield post

    def search_prediction_markets(
        self,
        keywords: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for prediction market related discussions.

        Args:
            keywords: Additional keywords to search

        Returns:
            List of relevant posts
        """
        base_keywords = [
            'polymarket', 'kalshi', 'prediction market',
            'betting odds', 'probability', 'outcome market'
        ]

        if keywords:
            base_keywords.extend(keywords)

        all_results = []

        for subreddit in self.config.subreddits:
            for keyword in base_keywords:
                results = self.search_subreddit(
                    subreddit,
                    keyword,
                    sort='new',
                    limit=10
                )
                all_results.extend(results)

        # Deduplicate
        seen = set()
        unique_results = []
        for post in all_results:
            post_id = post.get('id')
            if post_id not in seen:
                seen.add(post_id)
                unique_results.append(post)

        return unique_results


class RedditMonitor:
    """
    Continuous monitoring of Reddit for prediction market content.
    """

    def __init__(
        self,
        collector: RedditCollector,
        poll_interval: int = 300  # 5 minutes
    ):
        """
        Initialize monitor.

        Args:
            collector: RedditCollector instance
            poll_interval: Seconds between polls
        """
        self.collector = collector
        self.poll_interval = poll_interval
        self.running = False
        self.callbacks = []

    def add_callback(self, callback):
        """Add callback function to be called with new posts."""
        self.callbacks.append(callback)

    def _notify_callbacks(self, posts: List[Dict]):
        """Notify all callbacks of new posts."""
        for callback in self.callbacks:
            try:
                callback(posts)
            except Exception as e:
                logger.error(f"Callback error: {e}")

    def poll_once(self) -> List[Dict[str, Any]]:
        """
        Perform a single poll of all subreddits.

        Returns:
            List of new posts
        """
        posts = list(self.collector.collect_all_subreddits(
            sort='new',
            limit_per_sub=25
        ))

        if posts:
            self._notify_callbacks(posts)

        return posts

    def run(self, duration_minutes: Optional[int] = None):
        """
        Run continuous monitoring.

        Args:
            duration_minutes: How long to run (None = indefinitely)
        """
        self.running = True
        start_time = time.time()

        logger.info("Starting Reddit monitor...")

        while self.running:
            try:
                posts = self.poll_once()
                logger.info(f"Collected {len(posts)} posts from Reddit")

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
def create_reddit_collector(
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
    subreddits: Optional[List[str]] = None
) -> RedditCollector:
    """
    Create a configured Reddit collector.

    Args:
        client_id: Reddit API client ID (optional)
        client_secret: Reddit API client secret (optional)
        subreddits: List of subreddits to monitor

    Returns:
        Configured RedditCollector
    """
    config = RedditConfig(
        client_id=client_id,
        client_secret=client_secret,
        subreddits=subreddits
    )
    return RedditCollector(config)


def quick_reddit_scan(subreddit: str = 'polymarket', limit: int = 25) -> List[Dict]:
    """
    Quick scan of a subreddit for recent posts.

    Args:
        subreddit: Subreddit to scan
        limit: Number of posts

    Returns:
        List of posts
    """
    collector = RedditCollector()
    return collector.get_subreddit_posts(subreddit, limit=limit)
