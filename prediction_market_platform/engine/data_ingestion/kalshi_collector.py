"""
Kalshi Data Collector.

Collects market data from Kalshi's public API.
Kalshi is a CFTC-regulated prediction market exchange in the US.

IMPORTANT: This is for RESEARCH purposes only.
No trading functionality is implemented.

API Documentation:
- https://trading-api.readme.kalshi.com/

Key Kalshi Characteristics for Edge Detection:
- Regulated exchange with stricter rules
- Event contracts with defined settlement criteria
- Often lower liquidity than Polymarket (opportunities!)
- Different user base (more retail, less crypto)
- Settlement delays can create late-resolution edges
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import time
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
import urllib.request
import urllib.error
import urllib.parse

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, OrderBookLevel, MarketResolution,
    MarketSource, MarketStatus, OutcomeResult
)
from engine.data_ingestion.database import Database
from utils.logging_setup import get_logger

logger = get_logger("kalshi_collector")


@dataclass
class KalshiConfig:
    """Configuration for Kalshi API access."""
    base_url: str = "https://trading-api.kalshi.com/trade-api/v2"
    request_timeout: int = 30
    rate_limit_delay: float = 0.5
    max_retries: int = 3


class KalshiCollector:
    """
    Collects and normalizes data from Kalshi.

    Kalshi offers several unique characteristics for edge detection:

    1. REGULATORY STRUCTURE
       - CFTC-regulated, US-only
       - Defined event contracts with clear settlement rules
       - Position limits create supply/demand imbalances

    2. MARKET STRUCTURE
       - Generally lower liquidity than Polymarket
       - More "event contract" style (economic data, weather)
       - Binary contracts with $0/$1 settlement

    3. EDGE OPPORTUNITIES
       - Thin books on many markets (liquidity vacuum)
       - Settlement timing known precisely (convergence plays)
       - Less sophisticated trader base (behavioral edges)
       - Cross-market arbitrage with Polymarket
    """

    def __init__(
        self,
        config: Optional[KalshiConfig] = None,
        db: Optional[Database] = None
    ):
        """
        Initialize Kalshi collector.

        Args:
            config: API configuration
            db: Database instance for storage
        """
        self.config = config or KalshiConfig()
        self.db = db
        self._last_request_time = 0

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.config.rate_limit_delay:
            time.sleep(self.config.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    def _make_request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic.

        Args:
            endpoint: API endpoint (relative to base URL)
            params: Query parameters

        Returns:
            JSON response as dictionary
        """
        self._rate_limit()

        url = f"{self.config.base_url}{endpoint}"
        if params:
            query_string = urllib.parse.urlencode(params)
            url = f"{url}?{query_string}"

        for attempt in range(self.config.max_retries):
            try:
                request = urllib.request.Request(
                    url,
                    headers={
                        'User-Agent': 'PredictionMarketResearch/1.0',
                        'Accept': 'application/json'
                    }
                )

                with urllib.request.urlopen(
                    request,
                    timeout=self.config.request_timeout
                ) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    return data

            except urllib.error.HTTPError as e:
                logger.warning(f"HTTP error {e.code} on attempt {attempt + 1}: {url}")
                if e.code == 429:  # Rate limited
                    time.sleep(5 * (attempt + 1))
                elif e.code >= 500:
                    time.sleep(2 * (attempt + 1))
                else:
                    raise

            except urllib.error.URLError as e:
                logger.warning(f"URL error on attempt {attempt + 1}: {e.reason}")
                time.sleep(2 * (attempt + 1))

            except Exception as e:
                logger.error(f"Request failed: {e}")
                raise

        raise Exception(f"Failed to fetch {url} after {self.config.max_retries} attempts")

    # ==========================================================================
    # MARKET DATA COLLECTION
    # ==========================================================================

    def fetch_events(
        self,
        status: str = "open",
        limit: int = 200,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch event list from Kalshi.

        Events are top-level containers for related markets.

        Args:
            status: Event status filter (open, closed)
            limit: Maximum events to fetch
            cursor: Pagination cursor

        Returns:
            Events response dictionary
        """
        params = {
            'status': status,
            'limit': limit
        }
        if cursor:
            params['cursor'] = cursor

        try:
            return self._make_request('/events', params)
        except Exception as e:
            logger.error(f"Failed to fetch events: {e}")
            return {'events': [], 'cursor': None}

    def fetch_markets(
        self,
        event_ticker: Optional[str] = None,
        status: str = "open",
        limit: int = 200,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch markets from Kalshi.

        Args:
            event_ticker: Filter by event ticker
            status: Market status filter
            limit: Maximum markets to fetch
            cursor: Pagination cursor

        Returns:
            Markets response dictionary
        """
        params = {
            'status': status,
            'limit': limit
        }
        if event_ticker:
            params['event_ticker'] = event_ticker
        if cursor:
            params['cursor'] = cursor

        try:
            return self._make_request('/markets', params)
        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            return {'markets': [], 'cursor': None}

    def fetch_market(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch single market details.

        Args:
            ticker: Market ticker

        Returns:
            Market data dictionary
        """
        try:
            response = self._make_request(f'/markets/{ticker}')
            return response.get('market')
        except Exception as e:
            logger.error(f"Failed to fetch market {ticker}: {e}")
            return None

    def fetch_orderbook(self, ticker: str, depth: int = 20) -> Optional[Dict[str, Any]]:
        """
        Fetch order book for a market.

        Args:
            ticker: Market ticker
            depth: Number of price levels

        Returns:
            Order book data dictionary
        """
        params = {'depth': depth}

        try:
            return self._make_request(f'/markets/{ticker}/orderbook', params)
        except Exception as e:
            logger.debug(f"Failed to fetch orderbook for {ticker}: {e}")
            return None

    def fetch_series(self, series_ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch series (category) information.

        Args:
            series_ticker: Series ticker

        Returns:
            Series data dictionary
        """
        try:
            response = self._make_request(f'/series/{series_ticker}')
            return response.get('series')
        except Exception as e:
            logger.debug(f"Failed to fetch series {series_ticker}: {e}")
            return None

    # ==========================================================================
    # BATCH COLLECTION
    # ==========================================================================

    def collect_active_markets(self, limit: int = 100) -> List[MarketSnapshot]:
        """
        Collect all active markets and normalize them.

        Args:
            limit: Maximum number of markets to collect

        Returns:
            List of normalized MarketSnapshot objects
        """
        logger.info(f"Collecting active markets from Kalshi (limit={limit})")

        raw_markets = self.fetch_markets(status='open', limit=limit)
        logger.info(f"Fetched {len(raw_markets)} raw markets")

        markets = []
        for raw in raw_markets:
            try:
                snapshot = self.normalize_market(raw)
                if snapshot:
                    markets.append(snapshot)
            except Exception as e:
                logger.debug(f"Failed to normalize market: {e}")

        logger.info(f"Normalized {len(markets)} markets")
        return markets

    # ==========================================================================
    # DATA NORMALIZATION
    # ==========================================================================

    def normalize_market(self, raw_market: Dict[str, Any]) -> Optional[MarketSnapshot]:
        """
        Convert raw Kalshi data to normalized MarketSnapshot.

        Kalshi markets have specific fields:
        - yes_bid/yes_ask: Current bid/ask for YES outcome
        - floor_strike/cap_strike: Range for contracts
        - last_price: Last trade price
        - volume: Total volume traded
        - open_interest: Current open interest

        Args:
            raw_market: Raw API response

        Returns:
            Normalized MarketSnapshot or None if invalid
        """
        try:
            market_id = raw_market.get('ticker', '')
            if not market_id:
                return None

            # Parse timestamps
            close_time = self._parse_timestamp(raw_market.get('close_time'))
            expiration_time = self._parse_timestamp(raw_market.get('expiration_time'))

            # Use expiration time for resolution if available
            resolution_time = expiration_time or close_time

            # Parse status
            status = self._parse_status(raw_market)
            outcome = self._parse_outcome(raw_market)

            # Extract prices (Kalshi uses cents, convert to decimal)
            yes_bid = self._cents_to_decimal(raw_market.get('yes_bid'))
            yes_ask = self._cents_to_decimal(raw_market.get('yes_ask'))
            last_price = self._cents_to_decimal(raw_market.get('last_price'))

            # Mid-market price
            if yes_bid is not None and yes_ask is not None:
                yes_price = (yes_bid + yes_ask) / 2
            elif last_price is not None:
                yes_price = last_price
            else:
                yes_price = 0.5

            no_price = 1 - yes_price

            # Calculate spread
            spread = None
            if yes_bid is not None and yes_ask is not None:
                spread = yes_ask - yes_bid

            # Volume and liquidity
            volume = float(raw_market.get('volume', 0) or 0)
            volume_24h = float(raw_market.get('volume_24h', 0) or volume)  # Fallback to total
            open_interest = float(raw_market.get('open_interest', 0) or 0)
            liquidity = float(raw_market.get('liquidity', 0) or 0)

            # Categories
            category = raw_market.get('category', '') or raw_market.get('series_ticker', '')
            tags = []
            if raw_market.get('tags'):
                tags = raw_market['tags'] if isinstance(raw_market['tags'], list) else [raw_market['tags']]

            return MarketSnapshot(
                market_id=market_id,
                source=MarketSource.KALSHI,
                timestamp=datetime.now(timezone.utc),
                question=raw_market.get('title', '') or raw_market.get('subtitle', ''),
                description=raw_market.get('rules_primary', '') or '',
                category=category,
                tags=tags,
                created_at=self._parse_timestamp(raw_market.get('open_time')),
                close_time=close_time,
                resolution_time=resolution_time,
                status=status,
                outcome=outcome,
                yes_price=yes_price,
                no_price=no_price,
                last_trade_price=last_price,
                volume_24h=volume_24h,
                total_volume=volume,
                open_interest=open_interest,
                liquidity=liquidity,
                best_bid=yes_bid,
                best_ask=yes_ask,
                spread=spread,
                num_traders=0,  # Not available in public API
                comments_count=0,
                raw_data=raw_market
            )

        except Exception as e:
            logger.error(f"Failed to normalize market: {e}")
            return None

    def normalize_order_book(
        self,
        market_id: str,
        raw_book: Dict[str, Any]
    ) -> Optional[OrderBook]:
        """
        Convert raw order book data to normalized OrderBook.

        Kalshi order book format:
        - yes: list of [price, quantity] for YES side
        - no: list of [price, quantity] for NO side

        Args:
            market_id: Market ticker
            raw_book: Raw API response

        Returns:
            Normalized OrderBook or None if invalid
        """
        try:
            bids = []
            asks = []

            # Parse YES bids (people wanting to buy YES)
            for level in raw_book.get('yes', []):
                if isinstance(level, (list, tuple)) and len(level) >= 2:
                    price = self._cents_to_decimal(level[0])
                    size = float(level[1])
                    if price is not None:
                        bids.append(OrderBookLevel(price=price, size=size))

            # Parse NO bids (equivalent to YES asks)
            # In a binary market, NO bid at price P = YES ask at price 1-P
            for level in raw_book.get('no', []):
                if isinstance(level, (list, tuple)) and len(level) >= 2:
                    price = self._cents_to_decimal(level[0])
                    size = float(level[1])
                    if price is not None:
                        # Convert NO bid to YES ask
                        asks.append(OrderBookLevel(price=1 - price, size=size))

            # Sort bids descending, asks ascending
            bids.sort(key=lambda x: x.price, reverse=True)
            asks.sort(key=lambda x: x.price)

            return OrderBook(
                market_id=market_id,
                timestamp=datetime.now(timezone.utc),
                bids=bids,
                asks=asks
            )

        except Exception as e:
            logger.error(f"Failed to normalize order book: {e}")
            return None

    def _cents_to_decimal(self, cents: Any) -> Optional[float]:
        """Convert cents (0-100) to decimal (0-1)."""
        if cents is None:
            return None
        try:
            value = float(cents)
            # Kalshi uses cents (0-100), convert to decimal
            if value > 1:
                return value / 100
            return value
        except (ValueError, TypeError):
            return None

    def _parse_timestamp(self, value: Any) -> Optional[datetime]:
        """Parse timestamp to datetime."""
        if value is None:
            return None

        try:
            if isinstance(value, datetime):
                return value

            if isinstance(value, (int, float)):
                if value > 1e12:
                    value = value / 1000
                return datetime.fromtimestamp(value, tz=timezone.utc)

            if isinstance(value, str):
                # Kalshi uses ISO format
                value = value.replace('Z', '+00:00')
                return datetime.fromisoformat(value)

        except Exception:
            pass

        return None

    def _parse_status(self, raw_market: Dict[str, Any]) -> MarketStatus:
        """Parse market status from raw data."""
        status_str = raw_market.get('status', '').lower()

        if status_str in ['finalized', 'settled']:
            return MarketStatus.RESOLVED
        elif status_str in ['closed', 'ceased_trading']:
            return MarketStatus.CLOSED
        elif status_str == 'cancelled':
            return MarketStatus.CANCELLED

        return MarketStatus.ACTIVE

    def _parse_outcome(self, raw_market: Dict[str, Any]) -> OutcomeResult:
        """Parse resolution outcome from raw data."""
        result = raw_market.get('result')

        if result is None:
            return OutcomeResult.PENDING

        if result in ['yes', 'Yes', 'YES', 1, '1']:
            return OutcomeResult.YES
        elif result in ['no', 'No', 'NO', 0, '0']:
            return OutcomeResult.NO
        elif result in ['cancelled', 'voided']:
            return OutcomeResult.CANCELLED

        return OutcomeResult.PENDING

    # ==========================================================================
    # SNAPSHOT COLLECTION
    # ==========================================================================

    def collect_all_snapshots(
        self,
        status: str = "open",
        max_markets: int = 200,
        include_order_books: bool = True
    ) -> Tuple[List[MarketSnapshot], List[OrderBook]]:
        """
        Collect snapshots for all Kalshi markets.

        This is the main data collection method for Kalshi.
        Call periodically to build historical data.

        Args:
            status: Market status filter
            max_markets: Maximum markets to collect
            include_order_books: Also collect order books

        Returns:
            Tuple of (snapshots, order_books)
        """
        logger.info(f"Collecting Kalshi snapshots (max={max_markets}, status={status})")

        snapshots = []
        order_books = []
        cursor = None

        while len(snapshots) < max_markets:
            response = self.fetch_markets(
                status=status,
                limit=min(100, max_markets - len(snapshots)),
                cursor=cursor
            )

            raw_markets = response.get('markets', [])
            if not raw_markets:
                break

            for raw_market in raw_markets:
                snapshot = self.normalize_market(raw_market)
                if snapshot:
                    snapshots.append(snapshot)

                    # Collect order book
                    if include_order_books:
                        raw_book = self.fetch_orderbook(snapshot.market_id)
                        if raw_book:
                            order_book = self.normalize_order_book(
                                snapshot.market_id,
                                raw_book
                            )
                            if order_book:
                                order_books.append(order_book)
                                snapshot.best_bid = order_book.best_bid
                                snapshot.best_ask = order_book.best_ask
                                snapshot.spread = order_book.spread

            cursor = response.get('cursor')
            if not cursor:
                break

            time.sleep(1)

        logger.info(f"Collected {len(snapshots)} snapshots and {len(order_books)} order books")

        # Save to database
        if self.db:
            saved = self.db.save_snapshots(snapshots)
            logger.info(f"Saved {saved} snapshots to database")

            for ob in order_books:
                self.db.save_order_book(ob)

        return snapshots, order_books

    def collect_event_markets(
        self,
        event_ticker: str,
        include_order_books: bool = True
    ) -> Tuple[List[MarketSnapshot], List[OrderBook]]:
        """
        Collect all markets for a specific event.

        Useful for cross-market analysis within an event series.

        Args:
            event_ticker: Event ticker to collect
            include_order_books: Also collect order books

        Returns:
            Tuple of (snapshots, order_books)
        """
        logger.info(f"Collecting markets for event {event_ticker}")

        response = self.fetch_markets(
            event_ticker=event_ticker,
            status="open",
            limit=100
        )

        snapshots = []
        order_books = []

        for raw_market in response.get('markets', []):
            snapshot = self.normalize_market(raw_market)
            if snapshot:
                snapshots.append(snapshot)

                if include_order_books:
                    raw_book = self.fetch_orderbook(snapshot.market_id)
                    if raw_book:
                        order_book = self.normalize_order_book(
                            snapshot.market_id,
                            raw_book
                        )
                        if order_book:
                            order_books.append(order_book)

        return snapshots, order_books


def collect_kalshi_data(
    db: Optional[Database] = None,
    max_markets: int = 200
) -> Tuple[List[MarketSnapshot], List[OrderBook]]:
    """
    Convenience function to collect Kalshi data.

    Args:
        db: Database instance
        max_markets: Maximum markets to collect

    Returns:
        Tuple of (snapshots, order_books)
    """
    collector = KalshiCollector(db=db)
    return collector.collect_all_snapshots(max_markets=max_markets)
