"""
Polymarket Data Collector.

Collects market data from Polymarket's public APIs:
- Gamma API: Market metadata, questions, categories
- CLOB API: Order books, prices, trades

IMPORTANT: This is for RESEARCH purposes only.
No trading functionality is implemented.

API Documentation:
- https://docs.polymarket.com/
- https://gamma-api.polymarket.com/
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

logger = get_logger("polymarket_collector")


@dataclass
class PolymarketConfig:
    """Configuration for Polymarket API access."""
    gamma_url: str = "https://gamma-api.polymarket.com"
    clob_url: str = "https://clob.polymarket.com"
    request_timeout: int = 30
    rate_limit_delay: float = 0.5  # Seconds between requests
    max_retries: int = 3


class PolymarketCollector:
    """
    Collects and normalizes data from Polymarket.

    Polymarket is one of the largest prediction markets, operating on
    Polygon blockchain with a CLOB (Central Limit Order Book) model.

    Key characteristics for edge detection:
    - High liquidity on major events
    - Thin books on niche markets (liquidity vacuum opportunities)
    - Late-stage convergence patterns well-documented
    - Clear favorite-longshot bias in political markets
    """

    def __init__(
        self,
        config: Optional[PolymarketConfig] = None,
        db: Optional[Database] = None
    ):
        """
        Initialize Polymarket collector.

        Args:
            config: API configuration
            db: Database instance for storage
        """
        self.config = config or PolymarketConfig()
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
        url: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic.

        Args:
            url: Full URL to request
            params: Query parameters

        Returns:
            JSON response as dictionary
        """
        self._rate_limit()

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

    def fetch_markets(
        self,
        active_only: bool = True,
        limit: int = 500,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Fetch market list from Gamma API.

        Args:
            active_only: Only fetch active markets
            limit: Maximum markets to fetch
            offset: Pagination offset

        Returns:
            List of raw market data dictionaries
        """
        url = f"{self.config.gamma_url}/markets"
        params = {
            'limit': limit,
            'offset': offset,
            'closed': 'false' if active_only else 'true'
        }

        try:
            response = self._make_request(url, params)
            return response if isinstance(response, list) else response.get('markets', [])
        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            return []

    def fetch_market_details(self, condition_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed market information.

        Args:
            condition_id: Polymarket condition ID

        Returns:
            Market details dictionary
        """
        url = f"{self.config.gamma_url}/markets/{condition_id}"

        try:
            return self._make_request(url)
        except Exception as e:
            logger.error(f"Failed to fetch market {condition_id}: {e}")
            return None

    def fetch_order_book(
        self,
        token_id: str,
        depth: int = 20
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch order book for a market outcome.

        The order book reveals crucial structural information:
        - Spread = transaction cost
        - Depth = available liquidity
        - Imbalance = directional pressure

        Args:
            token_id: Token ID for the outcome
            depth: Number of price levels to fetch

        Returns:
            Order book data dictionary
        """
        url = f"{self.config.clob_url}/book"
        params = {'token_id': token_id}

        try:
            return self._make_request(url, params)
        except Exception as e:
            logger.debug(f"Failed to fetch order book for {token_id}: {e}")
            return None

    def fetch_price(self, token_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch current price for a token.

        Args:
            token_id: Token ID

        Returns:
            Price data dictionary
        """
        url = f"{self.config.clob_url}/price"
        params = {'token_id': token_id}

        try:
            return self._make_request(url, params)
        except Exception as e:
            logger.debug(f"Failed to fetch price for {token_id}: {e}")
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
        logger.info(f"Collecting active markets from Polymarket (limit={limit})")

        raw_markets = self.fetch_markets(active_only=True, limit=limit)
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
        Convert raw Polymarket data to normalized MarketSnapshot.

        Handles Polymarket's specific data format and extracts
        all fields needed for edge analysis.

        Args:
            raw_market: Raw API response

        Returns:
            Normalized MarketSnapshot or None if invalid
        """
        try:
            market_id = raw_market.get('conditionId') or raw_market.get('condition_id', '')
            if not market_id:
                return None

            # Parse timestamps
            created_at = self._parse_timestamp(raw_market.get('createdAt'))
            close_time = self._parse_timestamp(raw_market.get('endDate') or raw_market.get('end_date_iso'))
            resolution_time = self._parse_timestamp(raw_market.get('resolutionDate'))

            # Parse status
            status = self._parse_status(raw_market)
            outcome = self._parse_outcome(raw_market)

            # Extract prices
            # Polymarket uses various price fields depending on API version
            yes_price = self._extract_yes_price(raw_market)
            no_price = 1 - yes_price if yes_price else 0.5

            # Extract volume and liquidity
            volume_24h = float(raw_market.get('volume24hr', 0) or 0)
            total_volume = float(raw_market.get('volume', 0) or 0)
            liquidity = float(raw_market.get('liquidity', 0) or 0)
            open_interest = float(raw_market.get('openInterest', 0) or 0)

            # Extract bid/ask if available
            best_bid = self._safe_float(raw_market.get('bestBid'))
            best_ask = self._safe_float(raw_market.get('bestAsk'))
            spread = None
            if best_bid is not None and best_ask is not None:
                spread = best_ask - best_bid

            # Parse tags/categories
            tags = []
            if raw_market.get('tags'):
                tags = raw_market['tags'] if isinstance(raw_market['tags'], list) else [raw_market['tags']]

            category = raw_market.get('category', '') or raw_market.get('groupSlug', '') or ''

            return MarketSnapshot(
                market_id=market_id,
                source=MarketSource.POLYMARKET,
                timestamp=datetime.now(timezone.utc),
                question=raw_market.get('question', '') or raw_market.get('title', ''),
                description=raw_market.get('description', '') or '',
                category=category,
                tags=tags,
                created_at=created_at,
                close_time=close_time,
                resolution_time=resolution_time,
                status=status,
                outcome=outcome,
                yes_price=yes_price,
                no_price=no_price,
                last_trade_price=self._safe_float(raw_market.get('lastTradePrice')),
                volume_24h=volume_24h,
                total_volume=total_volume,
                open_interest=open_interest,
                liquidity=liquidity,
                best_bid=best_bid,
                best_ask=best_ask,
                spread=spread,
                num_traders=int(raw_market.get('numTraders', 0) or 0),
                comments_count=int(raw_market.get('commentsCount', 0) or 0),
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

        Args:
            market_id: Market identifier
            raw_book: Raw API response

        Returns:
            Normalized OrderBook or None if invalid
        """
        try:
            bids = []
            asks = []

            # Parse bids (buy orders)
            for bid in raw_book.get('bids', []):
                price = self._safe_float(bid.get('price'))
                size = self._safe_float(bid.get('size'))
                if price is not None and size is not None:
                    bids.append(OrderBookLevel(price=price, size=size))

            # Parse asks (sell orders)
            for ask in raw_book.get('asks', []):
                price = self._safe_float(ask.get('price'))
                size = self._safe_float(ask.get('size'))
                if price is not None and size is not None:
                    asks.append(OrderBookLevel(price=price, size=size))

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

    def _extract_yes_price(self, raw_market: Dict[str, Any]) -> float:
        """Extract YES price from various possible fields."""
        # Try different price fields
        price_fields = [
            'outcomePrices',
            'outcome_prices',
            'lastTradePrice',
            'last_trade_price',
            'bestAsk',
            'midpoint'
        ]

        for field in price_fields:
            value = raw_market.get(field)
            if value is not None:
                if isinstance(value, list) and len(value) > 0:
                    return float(value[0])
                elif isinstance(value, (int, float)):
                    return float(value)
                elif isinstance(value, str):
                    try:
                        # Handle JSON string like "[0.65, 0.35]"
                        parsed = json.loads(value)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            return float(parsed[0])
                        return float(parsed)
                    except (json.JSONDecodeError, ValueError):
                        try:
                            return float(value)
                        except ValueError:
                            continue

        return 0.5  # Default to 50% if no price found

    def _parse_timestamp(self, value: Any) -> Optional[datetime]:
        """Parse various timestamp formats to datetime."""
        if value is None:
            return None

        try:
            if isinstance(value, datetime):
                return value

            if isinstance(value, (int, float)):
                # Unix timestamp (seconds or milliseconds)
                if value > 1e12:
                    value = value / 1000
                return datetime.fromtimestamp(value, tz=timezone.utc)

            if isinstance(value, str):
                # ISO format
                # Remove 'Z' and add UTC timezone
                value = value.replace('Z', '+00:00')
                return datetime.fromisoformat(value)

        except Exception:
            pass

        return None

    def _parse_status(self, raw_market: Dict[str, Any]) -> MarketStatus:
        """Parse market status from raw data."""
        if raw_market.get('resolved'):
            return MarketStatus.RESOLVED
        if raw_market.get('closed') or raw_market.get('active') == False:
            return MarketStatus.CLOSED
        return MarketStatus.ACTIVE

    def _parse_outcome(self, raw_market: Dict[str, Any]) -> OutcomeResult:
        """Parse resolution outcome from raw data."""
        if not raw_market.get('resolved'):
            return OutcomeResult.PENDING

        resolution = raw_market.get('resolution') or raw_market.get('resolutionOutcome')
        if resolution is not None:
            if resolution in [1, '1', 'yes', 'Yes', 'YES']:
                return OutcomeResult.YES
            elif resolution in [0, '0', 'no', 'No', 'NO']:
                return OutcomeResult.NO

        return OutcomeResult.PENDING

    def _safe_float(self, value: Any) -> Optional[float]:
        """Safely convert value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    # ==========================================================================
    # SNAPSHOT COLLECTION
    # ==========================================================================

    def collect_all_snapshots(
        self,
        active_only: bool = True,
        max_markets: int = 500,
        include_order_books: bool = True
    ) -> Tuple[List[MarketSnapshot], List[OrderBook]]:
        """
        Collect snapshots for all markets.

        This is the main data collection method. Call periodically
        (e.g., every 15 minutes) to build historical data.

        Args:
            active_only: Only collect active markets
            max_markets: Maximum markets to collect
            include_order_books: Also collect order books

        Returns:
            Tuple of (snapshots, order_books)
        """
        logger.info(f"Collecting Polymarket snapshots (max={max_markets}, active_only={active_only})")

        snapshots = []
        order_books = []

        # Fetch markets in batches
        offset = 0
        batch_size = min(100, max_markets)

        while len(snapshots) < max_markets:
            raw_markets = self.fetch_markets(
                active_only=active_only,
                limit=batch_size,
                offset=offset
            )

            if not raw_markets:
                break

            for raw_market in raw_markets:
                # Normalize market data
                snapshot = self.normalize_market(raw_market)
                if snapshot:
                    snapshots.append(snapshot)

                    # Optionally collect order book
                    if include_order_books:
                        # Get token IDs from outcomes
                        tokens = raw_market.get('tokens', [])
                        if tokens and len(tokens) > 0:
                            token_id = tokens[0].get('token_id') or tokens[0].get('tokenId')
                            if token_id:
                                raw_book = self.fetch_order_book(token_id)
                                if raw_book:
                                    order_book = self.normalize_order_book(
                                        snapshot.market_id,
                                        raw_book
                                    )
                                    if order_book:
                                        order_books.append(order_book)
                                        # Update snapshot with order book data
                                        snapshot.best_bid = order_book.best_bid
                                        snapshot.best_ask = order_book.best_ask
                                        snapshot.spread = order_book.spread

                if len(snapshots) >= max_markets:
                    break

            offset += batch_size

            # Small delay between batches
            time.sleep(1)

        logger.info(f"Collected {len(snapshots)} snapshots and {len(order_books)} order books")

        # Save to database if configured
        if self.db:
            saved_snapshots = self.db.save_snapshots(snapshots)
            logger.info(f"Saved {saved_snapshots} snapshots to database")

            for ob in order_books:
                self.db.save_order_book(ob)

        return snapshots, order_books

    def collect_market_history(
        self,
        market_id: str,
        days: int = 30
    ) -> List[MarketSnapshot]:
        """
        Collect historical data for a specific market.

        Note: Polymarket's public API has limited historical data.
        This method collects what's available through the gamma API.

        Args:
            market_id: Market condition ID
            days: Days of history to attempt to collect

        Returns:
            List of historical snapshots
        """
        logger.info(f"Collecting history for market {market_id}")

        # Fetch current market details
        raw_market = self.fetch_market_details(market_id)
        if not raw_market:
            return []

        # Normalize current snapshot
        snapshot = self.normalize_market(raw_market)
        if not snapshot:
            return []

        # For now, return single snapshot (API limitation)
        # In production, you'd integrate with historical data providers
        return [snapshot]


def collect_polymarket_data(
    db: Optional[Database] = None,
    max_markets: int = 500
) -> Tuple[List[MarketSnapshot], List[OrderBook]]:
    """
    Convenience function to collect Polymarket data.

    Args:
        db: Database instance
        max_markets: Maximum markets to collect

    Returns:
        Tuple of (snapshots, order_books)
    """
    collector = PolymarketCollector(db=db)
    return collector.collect_all_snapshots(max_markets=max_markets)
