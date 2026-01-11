"""
News and Event Collector for Prediction Markets.

Monitors news sources and RSS feeds for market-moving events that could
impact prediction market outcomes. Tracks breaking news, official
announcements, and scheduled events.

KEY SOURCES:
- RSS feeds from major news outlets
- Official government/agency announcements
- Scheduled economic events calendar
- Breaking news alerts

CATEGORIES:
- Politics: Elections, legislation, appointments
- Economics: Fed decisions, employment data, GDP
- Crypto: ETF decisions, regulations, major events
- Sports: Game results, injuries, trades
- Technology: Product launches, earnings, regulations
"""

import re
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import xml.etree.ElementTree as ET

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger

logger = get_logger("news_collector")

# Try to import requests
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests not installed - News collection will use mock data")


class NewsCategory(Enum):
    """News category classifications."""
    POLITICS = "politics"
    ECONOMICS = "economics"
    CRYPTO = "crypto"
    TECHNOLOGY = "technology"
    SPORTS = "sports"
    ENTERTAINMENT = "entertainment"
    WORLD = "world"
    SCIENCE = "science"
    OTHER = "other"


class NewsSeverity(Enum):
    """News impact severity levels."""
    BREAKING = 4      # Major breaking news, immediate market impact
    HIGH = 3          # Important news, likely market impact
    MEDIUM = 2        # Notable news, possible market impact
    LOW = 1           # Minor news, unlikely market impact
    BACKGROUND = 0    # Context/background, no immediate impact


@dataclass
class NewsItem:
    """Individual news article/event."""
    news_id: str
    title: str
    source: str
    url: str
    published: datetime
    category: NewsCategory

    # Content
    summary: Optional[str] = None
    full_text: Optional[str] = None

    # Analysis
    severity: NewsSeverity = NewsSeverity.MEDIUM
    sentiment: float = 0.0  # -1 to 1
    keywords: List[str] = field(default_factory=list)

    # Market relevance
    related_markets: List[str] = field(default_factory=list)
    market_impact_estimate: float = 0.0  # Expected price move magnitude

    # Metadata
    author: Optional[str] = None
    is_breaking: bool = False
    is_scheduled_event: bool = False

    @property
    def age_hours(self) -> float:
        """Hours since publication."""
        delta = datetime.now(timezone.utc) - self.published
        return delta.total_seconds() / 3600

    @property
    def is_recent(self) -> bool:
        """True if published within last 6 hours."""
        return self.age_hours < 6

    @property
    def is_stale(self) -> bool:
        """True if published more than 24 hours ago."""
        return self.age_hours > 24


@dataclass
class ScheduledEvent:
    """Scheduled event that could impact markets."""
    event_id: str
    name: str
    event_time: datetime
    category: NewsCategory

    # Details
    description: str = ""
    location: Optional[str] = None
    source: Optional[str] = None

    # Impact
    expected_severity: NewsSeverity = NewsSeverity.MEDIUM
    related_markets: List[str] = field(default_factory=list)

    # Status
    occurred: bool = False
    outcome: Optional[str] = None

    @property
    def hours_until(self) -> float:
        """Hours until event."""
        delta = self.event_time - datetime.now(timezone.utc)
        return delta.total_seconds() / 3600

    @property
    def is_imminent(self) -> bool:
        """True if event is within 2 hours."""
        return 0 < self.hours_until < 2

    @property
    def is_today(self) -> bool:
        """True if event is today."""
        return self.event_time.date() == datetime.now(timezone.utc).date()


class NewsAnalyzer:
    """
    Analyzes news content for market relevance and impact.
    """

    # Keywords by category
    CATEGORY_KEYWORDS = {
        NewsCategory.POLITICS: [
            'election', 'vote', 'president', 'congress', 'senate', 'house',
            'democrat', 'republican', 'poll', 'campaign', 'primary', 'caucus',
            'legislation', 'bill', 'law', 'supreme court', 'governor',
            'trump', 'biden', 'nominee', 'impeachment', 'administration',
        ],
        NewsCategory.ECONOMICS: [
            'fed', 'federal reserve', 'interest rate', 'inflation', 'cpi',
            'employment', 'jobs', 'unemployment', 'gdp', 'recession',
            'treasury', 'bond', 'yield', 'fomc', 'powell', 'economy',
            'tariff', 'trade', 'deficit', 'stimulus', 'monetary policy',
        ],
        NewsCategory.CRYPTO: [
            'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
            'sec', 'etf', 'coinbase', 'binance', 'defi', 'nft', 'blockchain',
            'regulation', 'stablecoin', 'tether', 'usdc', 'mining',
        ],
        NewsCategory.TECHNOLOGY: [
            'apple', 'google', 'microsoft', 'meta', 'facebook', 'amazon',
            'ai', 'artificial intelligence', 'openai', 'chatgpt', 'tesla',
            'earnings', 'ipo', 'antitrust', 'ftc', 'silicon valley',
        ],
        NewsCategory.SPORTS: [
            'nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'world series',
            'championship', 'playoffs', 'injury', 'trade', 'draft',
            'olympics', 'world cup', 'ufc', 'boxing',
        ],
    }

    # High-impact keywords that suggest breaking/important news
    BREAKING_KEYWORDS = [
        'breaking', 'just in', 'developing', 'alert', 'urgent',
        'confirmed', 'official', 'announces', 'declared', 'wins',
        'loses', 'dies', 'killed', 'crashes', 'emergency',
    ]

    # Sentiment keywords
    POSITIVE_KEYWORDS = [
        'gains', 'rises', 'jumps', 'soars', 'rallies', 'surges',
        'wins', 'succeeds', 'approves', 'passes', 'beats', 'exceeds',
        'strong', 'growth', 'record high', 'breakthrough',
    ]

    NEGATIVE_KEYWORDS = [
        'falls', 'drops', 'plunges', 'crashes', 'declines', 'tumbles',
        'loses', 'fails', 'rejects', 'misses', 'below', 'weak',
        'crisis', 'collapse', 'record low', 'scandal', 'investigation',
    ]

    def __init__(self):
        """Initialize news analyzer."""
        self.cache = {}

    def analyze(self, news: NewsItem) -> NewsItem:
        """
        Analyze news item for category, sentiment, and impact.

        Args:
            news: NewsItem to analyze

        Returns:
            NewsItem with analysis fields populated
        """
        text = f"{news.title} {news.summary or ''}".lower()

        # Determine category
        if news.category == NewsCategory.OTHER:
            news.category = self._detect_category(text)

        # Extract keywords
        news.keywords = self._extract_keywords(text)

        # Analyze sentiment
        news.sentiment = self._analyze_sentiment(text)

        # Determine severity
        news.severity = self._assess_severity(text, news)

        # Check if breaking
        news.is_breaking = self._is_breaking(text)

        # Estimate market impact
        news.market_impact_estimate = self._estimate_impact(news)

        return news

    def _detect_category(self, text: str) -> NewsCategory:
        """Detect news category from content."""
        scores = {}

        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=scores.get)

        return NewsCategory.OTHER

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text."""
        keywords = []

        # Check all category keywords
        for kw_list in self.CATEGORY_KEYWORDS.values():
            for kw in kw_list:
                if kw in text:
                    keywords.append(kw)

        return list(set(keywords))

    def _analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text."""
        positive = sum(1 for kw in self.POSITIVE_KEYWORDS if kw in text)
        negative = sum(1 for kw in self.NEGATIVE_KEYWORDS if kw in text)

        total = positive + negative
        if total == 0:
            return 0.0

        return (positive - negative) / total

    def _assess_severity(self, text: str, news: NewsItem) -> NewsSeverity:
        """Assess news severity/importance."""
        # Breaking news
        if self._is_breaking(text):
            return NewsSeverity.BREAKING

        # High-impact indicators
        high_impact = [
            'announces', 'confirms', 'wins', 'loses', 'passes',
            'rejects', 'approves', 'decision', 'ruling',
        ]
        if any(kw in text for kw in high_impact):
            return NewsSeverity.HIGH

        # Check keyword density
        keyword_count = len(news.keywords)
        if keyword_count >= 5:
            return NewsSeverity.HIGH
        elif keyword_count >= 3:
            return NewsSeverity.MEDIUM

        return NewsSeverity.LOW

    def _is_breaking(self, text: str) -> bool:
        """Check if news is breaking/urgent."""
        return any(kw in text for kw in self.BREAKING_KEYWORDS)

    def _estimate_impact(self, news: NewsItem) -> float:
        """Estimate market impact magnitude (0-1)."""
        base_impact = {
            NewsSeverity.BREAKING: 0.15,
            NewsSeverity.HIGH: 0.08,
            NewsSeverity.MEDIUM: 0.04,
            NewsSeverity.LOW: 0.02,
            NewsSeverity.BACKGROUND: 0.01,
        }

        impact = base_impact.get(news.severity, 0.02)

        # Adjust for recency
        if news.is_recent:
            impact *= 1.5
        elif news.is_stale:
            impact *= 0.5

        # Adjust for sentiment strength
        impact *= (1 + abs(news.sentiment) * 0.5)

        return min(0.25, impact)


class RSSCollector:
    """
    Collects news from RSS feeds.
    """

    # Default RSS feeds to monitor
    DEFAULT_FEEDS = {
        # General news
        'reuters_politics': 'https://feeds.reuters.com/Reuters/PoliticsNews',
        'reuters_business': 'https://feeds.reuters.com/Reuters/businessNews',
        'ap_topnews': 'https://feeds.apnews.com/rss/topnews',

        # Politics
        'politico': 'https://www.politico.com/rss/politicopicks.xml',
        'thehill': 'https://thehill.com/feed/',

        # Economics
        'wsj_markets': 'https://feeds.wsj.com/xml/rss/3_7031.xml',
        'bloomberg': 'https://feeds.bloomberg.com/markets/news.rss',

        # Crypto
        'coindesk': 'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'cointelegraph': 'https://cointelegraph.com/rss',

        # Technology
        'techcrunch': 'https://techcrunch.com/feed/',
        'verge': 'https://www.theverge.com/rss/index.xml',
    }

    def __init__(
        self,
        feeds: Optional[Dict[str, str]] = None,
        timeout: int = 10
    ):
        """
        Initialize RSS collector.

        Args:
            feeds: Dict mapping feed name to URL
            timeout: Request timeout in seconds
        """
        self.feeds = feeds or self.DEFAULT_FEEDS
        self.timeout = timeout
        self.analyzer = NewsAnalyzer()

        # Cache for deduplication
        self.seen_ids: set = set()

        if REQUESTS_AVAILABLE:
            self.session = requests.Session()
            self.session.headers.update({
                'User-Agent': 'PredictionMarketResearch/1.0'
            })
        else:
            self.session = None

    def fetch_feed(self, feed_name: str, url: str) -> List[NewsItem]:
        """
        Fetch and parse a single RSS feed.

        Args:
            feed_name: Name of the feed
            url: RSS feed URL

        Returns:
            List of NewsItem objects
        """
        if not self.session:
            return self._get_mock_news(feed_name)

        try:
            response = self.session.get(url, timeout=self.timeout)
            if response.status_code != 200:
                logger.error(f"Failed to fetch {feed_name}: {response.status_code}")
                return []

            return self._parse_rss(response.content, feed_name)

        except Exception as e:
            logger.error(f"Error fetching {feed_name}: {e}")
            return self._get_mock_news(feed_name)

    def _parse_rss(self, content: bytes, source: str) -> List[NewsItem]:
        """Parse RSS XML content into NewsItem objects."""
        items = []

        try:
            root = ET.fromstring(content)

            # Handle different RSS formats
            for item in root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                try:
                    # Get title
                    title_elem = item.find('title') or item.find('{http://www.w3.org/2005/Atom}title')
                    title = title_elem.text if title_elem is not None else 'No title'

                    # Get link
                    link_elem = item.find('link') or item.find('{http://www.w3.org/2005/Atom}link')
                    if link_elem is not None:
                        url = link_elem.get('href') or link_elem.text
                    else:
                        url = ''

                    # Get description
                    desc_elem = item.find('description') or item.find('{http://www.w3.org/2005/Atom}summary')
                    summary = desc_elem.text if desc_elem is not None else None

                    # Get publication date
                    pub_elem = item.find('pubDate') or item.find('{http://www.w3.org/2005/Atom}published')
                    if pub_elem is not None and pub_elem.text:
                        try:
                            # Try parsing various date formats
                            pub_text = pub_elem.text
                            for fmt in [
                                '%a, %d %b %Y %H:%M:%S %z',
                                '%a, %d %b %Y %H:%M:%S %Z',
                                '%Y-%m-%dT%H:%M:%SZ',
                                '%Y-%m-%dT%H:%M:%S%z',
                            ]:
                                try:
                                    published = datetime.strptime(pub_text, fmt)
                                    if published.tzinfo is None:
                                        published = published.replace(tzinfo=timezone.utc)
                                    break
                                except ValueError:
                                    continue
                            else:
                                published = datetime.now(timezone.utc)
                        except:
                            published = datetime.now(timezone.utc)
                    else:
                        published = datetime.now(timezone.utc)

                    # Generate ID
                    news_id = hashlib.md5(f"{source}:{title}:{url}".encode()).hexdigest()[:16]

                    # Deduplication
                    if news_id in self.seen_ids:
                        continue
                    self.seen_ids.add(news_id)

                    news = NewsItem(
                        news_id=news_id,
                        title=title,
                        source=source,
                        url=url or '',
                        published=published,
                        category=NewsCategory.OTHER,
                        summary=summary,
                    )

                    # Analyze
                    news = self.analyzer.analyze(news)
                    items.append(news)

                except Exception as e:
                    logger.debug(f"Error parsing RSS item: {e}")
                    continue

        except ET.ParseError as e:
            logger.error(f"Error parsing RSS XML: {e}")

        return items

    def _get_mock_news(self, feed_name: str) -> List[NewsItem]:
        """Generate mock news for testing without network access."""
        now = datetime.now(timezone.utc)

        mock_articles = [
            {
                'title': 'Fed Signals Potential Rate Cut in Coming Months',
                'summary': 'Federal Reserve officials indicate inflation cooling may allow for rate cuts.',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.HIGH,
            },
            {
                'title': 'Latest Polls Show Tight Race in Key Swing States',
                'summary': 'New polling data reveals competitive margins in battleground states.',
                'category': NewsCategory.POLITICS,
                'severity': NewsSeverity.MEDIUM,
            },
            {
                'title': 'SEC Delays Bitcoin ETF Decision Again',
                'summary': 'Regulators push back deadline for spot Bitcoin ETF applications.',
                'category': NewsCategory.CRYPTO,
                'severity': NewsSeverity.MEDIUM,
            },
            {
                'title': 'Breaking: Major Tech Company Announces Layoffs',
                'summary': 'Thousands of employees affected in latest round of tech cuts.',
                'category': NewsCategory.TECHNOLOGY,
                'severity': NewsSeverity.HIGH,
            },
            {
                'title': 'Unexpected Economic Data Surprises Markets',
                'summary': 'Employment numbers come in stronger than expected.',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.MEDIUM,
            },
        ]

        items = []
        for i, article in enumerate(mock_articles):
            news_id = hashlib.md5(f"mock:{feed_name}:{i}".encode()).hexdigest()[:16]

            if news_id in self.seen_ids:
                continue
            self.seen_ids.add(news_id)

            news = NewsItem(
                news_id=news_id,
                title=article['title'],
                source=feed_name,
                url=f'https://example.com/news/{news_id}',
                published=now - timedelta(hours=i * 2),
                category=article['category'],
                summary=article['summary'],
                severity=article['severity'],
            )
            news = self.analyzer.analyze(news)
            items.append(news)

        return items

    def fetch_all_feeds(self) -> List[NewsItem]:
        """
        Fetch news from all configured feeds.

        Returns:
            Combined list of NewsItem objects
        """
        all_news = []

        for feed_name, url in self.feeds.items():
            logger.debug(f"Fetching {feed_name}...")
            news = self.fetch_feed(feed_name, url)
            all_news.extend(news)

        # Sort by publication time
        all_news.sort(key=lambda x: x.published, reverse=True)

        return all_news


class EventCalendar:
    """
    Tracks scheduled events that could impact prediction markets.
    """

    def __init__(self):
        """Initialize event calendar."""
        self.events: List[ScheduledEvent] = []
        self._load_default_events()

    def _load_default_events(self):
        """Load commonly recurring events."""
        now = datetime.now(timezone.utc)

        # Economic calendar events (examples)
        recurring_events = [
            {
                'name': 'FOMC Interest Rate Decision',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.BREAKING,
                'description': 'Federal Reserve announces interest rate decision',
            },
            {
                'name': 'Monthly Employment Report',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.HIGH,
                'description': 'Bureau of Labor Statistics releases employment data',
            },
            {
                'name': 'CPI Inflation Data',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.HIGH,
                'description': 'Consumer Price Index inflation report',
            },
            {
                'name': 'GDP Report',
                'category': NewsCategory.ECONOMICS,
                'severity': NewsSeverity.HIGH,
                'description': 'Quarterly GDP growth data release',
            },
        ]

        # Add placeholder events
        for i, event_info in enumerate(recurring_events):
            event = ScheduledEvent(
                event_id=f"recurring_{i}",
                name=event_info['name'],
                event_time=now + timedelta(days=7 * (i + 1)),  # Space out weekly
                category=event_info['category'],
                description=event_info['description'],
                expected_severity=event_info['severity'],
            )
            self.events.append(event)

    def add_event(self, event: ScheduledEvent):
        """Add event to calendar."""
        self.events.append(event)

    def get_upcoming_events(
        self,
        hours_ahead: int = 48,
        category: Optional[NewsCategory] = None
    ) -> List[ScheduledEvent]:
        """
        Get events happening within time window.

        Args:
            hours_ahead: Hours to look ahead
            category: Filter by category

        Returns:
            List of upcoming events
        """
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(hours=hours_ahead)

        events = [
            e for e in self.events
            if now <= e.event_time <= cutoff
        ]

        if category:
            events = [e for e in events if e.category == category]

        return sorted(events, key=lambda x: x.event_time)

    def get_imminent_events(self) -> List[ScheduledEvent]:
        """Get events happening within 2 hours."""
        return [e for e in self.events if e.is_imminent]

    def get_todays_events(self) -> List[ScheduledEvent]:
        """Get all events scheduled for today."""
        return [e for e in self.events if e.is_today]


class NewsAggregator:
    """
    Aggregates news from multiple sources and correlates with markets.
    """

    def __init__(self):
        """Initialize news aggregator."""
        self.rss_collector = RSSCollector()
        self.calendar = EventCalendar()
        self.analyzer = NewsAnalyzer()

        # Store news by category
        self.news_by_category: Dict[NewsCategory, List[NewsItem]] = {}
        for cat in NewsCategory:
            self.news_by_category[cat] = []

        # Market-news correlation
        self.market_news: Dict[str, List[NewsItem]] = {}

    def refresh(self) -> Dict[str, Any]:
        """
        Refresh news from all sources.

        Returns:
            Summary of collected news
        """
        # Fetch RSS feeds
        news = self.rss_collector.fetch_all_feeds()

        # Categorize
        for item in news:
            self.news_by_category[item.category].append(item)

        # Get upcoming events
        events = self.calendar.get_upcoming_events(hours_ahead=72)

        return {
            'total_news': len(news),
            'by_category': {cat.value: len(items) for cat, items in self.news_by_category.items()},
            'breaking_count': sum(1 for n in news if n.is_breaking),
            'upcoming_events': len(events),
            'imminent_events': len(self.calendar.get_imminent_events()),
        }

    def get_breaking_news(self) -> List[NewsItem]:
        """Get all breaking news."""
        all_news = []
        for items in self.news_by_category.values():
            all_news.extend([n for n in items if n.is_breaking and n.is_recent])

        return sorted(all_news, key=lambda x: x.published, reverse=True)

    def get_news_by_category(
        self,
        category: NewsCategory,
        max_age_hours: int = 24
    ) -> List[NewsItem]:
        """Get news for a specific category."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)

        return [
            n for n in self.news_by_category.get(category, [])
            if n.published >= cutoff
        ]

    def get_market_relevant_news(
        self,
        market_keywords: List[str],
        max_items: int = 10
    ) -> List[NewsItem]:
        """
        Get news relevant to specific market keywords.

        Args:
            market_keywords: Keywords related to the market
            max_items: Maximum items to return

        Returns:
            Relevant news items sorted by relevance
        """
        all_news = []
        for items in self.news_by_category.values():
            all_news.extend(items)

        # Score by keyword matches
        scored = []
        for news in all_news:
            text = f"{news.title} {news.summary or ''}".lower()
            score = sum(1 for kw in market_keywords if kw.lower() in text)

            if score > 0:
                scored.append((news, score))

        # Sort by score and recency
        scored.sort(key=lambda x: (x[1], -x[0].age_hours), reverse=True)

        return [item for item, _ in scored[:max_items]]

    def correlate_with_markets(
        self,
        markets: Dict[str, str]  # market_id -> question
    ) -> Dict[str, List[NewsItem]]:
        """
        Find news correlated with specific markets.

        Args:
            markets: Dict mapping market_id to question text

        Returns:
            Dict mapping market_id to relevant news
        """
        self.market_news = {}

        for market_id, question in markets.items():
            # Extract keywords from question
            keywords = self._extract_market_keywords(question)

            # Find relevant news
            news = self.get_market_relevant_news(keywords, max_items=5)

            if news:
                self.market_news[market_id] = news

        return self.market_news

    def _extract_market_keywords(self, question: str) -> List[str]:
        """Extract keywords from market question."""
        # Remove common words
        stop_words = {
            'will', 'the', 'a', 'an', 'is', 'are', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'shall', 'should',
            'may', 'might', 'must', 'can', 'could', 'would', 'this', 'that',
            'these', 'those', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
            'of', 'or', 'and', 'but', 'if', 'than', 'more', 'before', 'after',
        }

        # Tokenize and filter
        words = re.findall(r'\b\w+\b', question.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        return keywords

    def get_news_summary(self) -> Dict[str, Any]:
        """Get summary of current news state."""
        breaking = self.get_breaking_news()
        imminent = self.calendar.get_imminent_events()

        return {
            'breaking_news': [
                {
                    'title': n.title,
                    'source': n.source,
                    'age_hours': round(n.age_hours, 1),
                    'severity': n.severity.name,
                    'sentiment': n.sentiment,
                }
                for n in breaking[:5]
            ],
            'imminent_events': [
                {
                    'name': e.name,
                    'hours_until': round(e.hours_until, 1),
                    'severity': e.expected_severity.name,
                }
                for e in imminent[:5]
            ],
            'category_counts': {
                cat.value: len(items)
                for cat, items in self.news_by_category.items()
                if len(items) > 0
            },
        }


# Convenience functions
def create_news_aggregator() -> NewsAggregator:
    """Create and return a configured news aggregator."""
    return NewsAggregator()


def quick_news_scan(categories: List[NewsCategory] = None) -> List[NewsItem]:
    """
    Quick scan for recent news.

    Args:
        categories: Categories to filter (None = all)

    Returns:
        List of recent news items
    """
    aggregator = NewsAggregator()
    aggregator.refresh()

    if categories:
        news = []
        for cat in categories:
            news.extend(aggregator.get_news_by_category(cat))
        return news

    return aggregator.rss_collector.fetch_all_feeds()
