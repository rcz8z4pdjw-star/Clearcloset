"""
Database layer for the Prediction Market Research Platform.

Provides persistent storage using SQLite for structured queries
and optional Parquet files for large-scale analytics.

Design Philosophy:
- SQLite for real-time queries and transactional operations
- Parquet for historical analysis and bulk data export
- In-memory caching for frequently accessed data
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from contextlib import contextmanager
import threading

from .models import (
    MarketSnapshot, OrderBook, OrderBookLevel, PriceHistory,
    MarketResolution, Signal, Opportunity, MarketSource, MarketStatus, OutcomeResult
)

# Optional parquet support
try:
    import pyarrow as pa
    import pyarrow.parquet as pq
    PARQUET_AVAILABLE = True
except ImportError:
    PARQUET_AVAILABLE = False


class Database:
    """
    SQLite database manager with optional Parquet export.

    Thread-safe database access with connection pooling.
    """

    def __init__(
        self,
        db_path: str = "data/prediction_markets.db",
        parquet_path: Optional[str] = "data/parquet/",
        enable_parquet: bool = False
    ):
        """
        Initialize database connection.

        Args:
            db_path: Path to SQLite database file
            parquet_path: Path to Parquet files directory
            enable_parquet: Whether to also write Parquet files
        """
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self.parquet_path = Path(parquet_path) if parquet_path else None
        if self.parquet_path:
            self.parquet_path.mkdir(parents=True, exist_ok=True)

        self.enable_parquet = enable_parquet and PARQUET_AVAILABLE

        # Thread-local storage for connections
        self._local = threading.local()

        # Initialize schema
        self._init_schema()

    def _get_connection(self) -> sqlite3.Connection:
        """Get thread-local database connection."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False
            )
            self._local.conn.row_factory = sqlite3.Row
            # Enable foreign keys
            self._local.conn.execute("PRAGMA foreign_keys = ON")
            # Optimize for performance
            self._local.conn.execute("PRAGMA journal_mode = WAL")
            self._local.conn.execute("PRAGMA synchronous = NORMAL")

        return self._local.conn

    @contextmanager
    def _cursor(self):
        """Context manager for database cursor."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()

    def _init_schema(self):
        """Initialize database schema."""
        with self._cursor() as cursor:
            # Market snapshots table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    market_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    question TEXT,
                    description TEXT,
                    category TEXT,
                    tags TEXT,
                    created_at DATETIME,
                    close_time DATETIME,
                    resolution_time DATETIME,
                    status TEXT,
                    outcome TEXT,
                    yes_price REAL,
                    no_price REAL,
                    last_trade_price REAL,
                    volume_24h REAL,
                    total_volume REAL,
                    open_interest REAL,
                    liquidity REAL,
                    best_bid REAL,
                    best_ask REAL,
                    spread REAL,
                    num_traders INTEGER,
                    comments_count INTEGER,
                    raw_data TEXT,
                    UNIQUE(market_id, source, timestamp)
                )
            """)

            # Order books table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS order_books (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    market_id TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    bids TEXT NOT NULL,
                    asks TEXT NOT NULL,
                    UNIQUE(market_id, timestamp)
                )
            """)

            # Market resolutions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_resolutions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    market_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    question TEXT,
                    resolution_time DATETIME NOT NULL,
                    outcome TEXT NOT NULL,
                    final_price REAL,
                    settlement_value REAL,
                    price_1h_before REAL,
                    price_6h_before REAL,
                    price_24h_before REAL,
                    volume_24h_before REAL,
                    UNIQUE(market_id, source)
                )
            """)

            # Signals table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    strategy_name TEXT NOT NULL,
                    market_id TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    direction TEXT,
                    strength REAL,
                    confidence REAL,
                    expected_value REAL,
                    probability_estimate REAL,
                    market_probability REAL,
                    kelly_fraction REAL,
                    time_horizon_hours REAL,
                    explanation TEXT,
                    metadata TEXT
                )
            """)

            # Opportunities table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS opportunities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rank INTEGER,
                    market_id TEXT NOT NULL,
                    market_name TEXT,
                    source TEXT,
                    timestamp DATETIME NOT NULL,
                    composite_score REAL,
                    expected_value REAL,
                    confidence REAL,
                    risk_score REAL,
                    current_price REAL,
                    liquidity REAL,
                    volume_24h REAL,
                    hours_to_resolution REAL,
                    suggested_side TEXT,
                    suggested_size REAL,
                    explanation TEXT,
                    key_factors TEXT,
                    risks TEXT
                )
            """)

            # Create indexes for common queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_snapshots_market_time
                ON market_snapshots(market_id, timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_snapshots_source_status
                ON market_snapshots(source, status)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_signals_strategy_market
                ON signals(strategy_name, market_id, timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_opportunities_timestamp
                ON opportunities(timestamp, rank)
            """)

    # ==========================================================================
    # MARKET SNAPSHOTS
    # ==========================================================================

    def save_snapshot(self, snapshot: MarketSnapshot) -> int:
        """
        Save a market snapshot.

        Args:
            snapshot: MarketSnapshot object

        Returns:
            Row ID of inserted record
        """
        with self._cursor() as cursor:
            cursor.execute("""
                INSERT OR REPLACE INTO market_snapshots (
                    market_id, source, timestamp, question, description,
                    category, tags, created_at, close_time, resolution_time,
                    status, outcome, yes_price, no_price, last_trade_price,
                    volume_24h, total_volume, open_interest, liquidity,
                    best_bid, best_ask, spread, num_traders, comments_count, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                snapshot.market_id,
                snapshot.source.value,
                snapshot.timestamp.isoformat(),
                snapshot.question,
                snapshot.description,
                snapshot.category,
                json.dumps(snapshot.tags),
                snapshot.created_at.isoformat() if snapshot.created_at else None,
                snapshot.close_time.isoformat() if snapshot.close_time else None,
                snapshot.resolution_time.isoformat() if snapshot.resolution_time else None,
                snapshot.status.value,
                snapshot.outcome.value,
                snapshot.yes_price,
                snapshot.no_price,
                snapshot.last_trade_price,
                snapshot.volume_24h,
                snapshot.total_volume,
                snapshot.open_interest,
                snapshot.liquidity,
                snapshot.best_bid,
                snapshot.best_ask,
                snapshot.spread,
                snapshot.num_traders,
                snapshot.comments_count,
                json.dumps(snapshot.raw_data) if snapshot.raw_data else None
            ))
            return cursor.lastrowid

    def save_snapshots(self, snapshots: List[MarketSnapshot]) -> int:
        """
        Save multiple snapshots in a batch.

        Returns:
            Number of snapshots saved
        """
        count = 0
        for snapshot in snapshots:
            try:
                self.save_snapshot(snapshot)
                count += 1
            except Exception:
                pass  # Skip duplicates
        return count

    def get_latest_snapshot(
        self,
        market_id: str,
        source: Optional[MarketSource] = None
    ) -> Optional[MarketSnapshot]:
        """Get most recent snapshot for a market."""
        with self._cursor() as cursor:
            if source:
                cursor.execute("""
                    SELECT * FROM market_snapshots
                    WHERE market_id = ? AND source = ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (market_id, source.value))
            else:
                cursor.execute("""
                    SELECT * FROM market_snapshots
                    WHERE market_id = ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (market_id,))

            row = cursor.fetchone()
            return self._row_to_snapshot(row) if row else None

    def get_snapshots(
        self,
        market_id: Optional[str] = None,
        source: Optional[MarketSource] = None,
        status: Optional[MarketStatus] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[MarketSnapshot]:
        """
        Query market snapshots with filters.

        Args:
            market_id: Filter by specific market
            source: Filter by data source
            status: Filter by market status
            start_time: Start of time range
            end_time: End of time range
            limit: Maximum results to return

        Returns:
            List of MarketSnapshot objects
        """
        conditions = []
        params = []

        if market_id:
            conditions.append("market_id = ?")
            params.append(market_id)

        if source:
            conditions.append("source = ?")
            params.append(source.value)

        if status:
            conditions.append("status = ?")
            params.append(status.value)

        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())

        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        with self._cursor() as cursor:
            cursor.execute(f"""
                SELECT * FROM market_snapshots
                WHERE {where_clause}
                ORDER BY timestamp DESC
                LIMIT ?
            """, params + [limit])

            return [self._row_to_snapshot(row) for row in cursor.fetchall()]

    def get_active_markets(
        self,
        source: Optional[MarketSource] = None
    ) -> List[MarketSnapshot]:
        """Get latest snapshot for all active markets."""
        with self._cursor() as cursor:
            if source:
                cursor.execute("""
                    SELECT * FROM market_snapshots m1
                    WHERE m1.timestamp = (
                        SELECT MAX(m2.timestamp)
                        FROM market_snapshots m2
                        WHERE m2.market_id = m1.market_id
                    )
                    AND m1.status = 'active'
                    AND m1.source = ?
                    ORDER BY m1.volume_24h DESC
                """, (source.value,))
            else:
                cursor.execute("""
                    SELECT * FROM market_snapshots m1
                    WHERE m1.timestamp = (
                        SELECT MAX(m2.timestamp)
                        FROM market_snapshots m2
                        WHERE m2.market_id = m1.market_id
                    )
                    AND m1.status = 'active'
                    ORDER BY m1.volume_24h DESC
                """)

            return [self._row_to_snapshot(row) for row in cursor.fetchall()]

    def _row_to_snapshot(self, row: sqlite3.Row) -> MarketSnapshot:
        """Convert database row to MarketSnapshot object."""
        return MarketSnapshot(
            market_id=row['market_id'],
            source=MarketSource(row['source']),
            timestamp=datetime.fromisoformat(row['timestamp']),
            question=row['question'] or "",
            description=row['description'] or "",
            category=row['category'] or "",
            tags=json.loads(row['tags']) if row['tags'] else [],
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
            close_time=datetime.fromisoformat(row['close_time']) if row['close_time'] else None,
            resolution_time=datetime.fromisoformat(row['resolution_time']) if row['resolution_time'] else None,
            status=MarketStatus(row['status']) if row['status'] else MarketStatus.ACTIVE,
            outcome=OutcomeResult(row['outcome']) if row['outcome'] else OutcomeResult.PENDING,
            yes_price=row['yes_price'] or 0.5,
            no_price=row['no_price'] or 0.5,
            last_trade_price=row['last_trade_price'],
            volume_24h=row['volume_24h'] or 0,
            total_volume=row['total_volume'] or 0,
            open_interest=row['open_interest'] or 0,
            liquidity=row['liquidity'] or 0,
            best_bid=row['best_bid'],
            best_ask=row['best_ask'],
            spread=row['spread'],
            num_traders=row['num_traders'] or 0,
            comments_count=row['comments_count'] or 0,
            raw_data=json.loads(row['raw_data']) if row['raw_data'] else None
        )

    # ==========================================================================
    # ORDER BOOKS
    # ==========================================================================

    def save_order_book(self, order_book: OrderBook) -> int:
        """Save an order book snapshot."""
        bids_json = json.dumps([
            {'price': b.price, 'size': b.size} for b in order_book.bids
        ])
        asks_json = json.dumps([
            {'price': a.price, 'size': a.size} for a in order_book.asks
        ])

        with self._cursor() as cursor:
            cursor.execute("""
                INSERT OR REPLACE INTO order_books (market_id, timestamp, bids, asks)
                VALUES (?, ?, ?, ?)
            """, (order_book.market_id, order_book.timestamp.isoformat(), bids_json, asks_json))
            return cursor.lastrowid

    def get_order_book(
        self,
        market_id: str,
        timestamp: Optional[datetime] = None
    ) -> Optional[OrderBook]:
        """Get order book, latest or at specific timestamp."""
        with self._cursor() as cursor:
            if timestamp:
                cursor.execute("""
                    SELECT * FROM order_books
                    WHERE market_id = ? AND timestamp <= ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (market_id, timestamp.isoformat()))
            else:
                cursor.execute("""
                    SELECT * FROM order_books
                    WHERE market_id = ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (market_id,))

            row = cursor.fetchone()
            if not row:
                return None

            bids = [OrderBookLevel(**b) for b in json.loads(row['bids'])]
            asks = [OrderBookLevel(**a) for a in json.loads(row['asks'])]

            return OrderBook(
                market_id=row['market_id'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                bids=bids,
                asks=asks
            )

    # ==========================================================================
    # PRICE HISTORY
    # ==========================================================================

    def get_price_history(
        self,
        market_id: str,
        source: Optional[MarketSource] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> PriceHistory:
        """
        Get price history for a market.

        Returns:
            PriceHistory object with time series data
        """
        conditions = ["market_id = ?"]
        params = [market_id]

        if source:
            conditions.append("source = ?")
            params.append(source.value)

        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())

        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())

        where_clause = " AND ".join(conditions)

        with self._cursor() as cursor:
            cursor.execute(f"""
                SELECT timestamp, yes_price, volume_24h, best_bid, best_ask, source
                FROM market_snapshots
                WHERE {where_clause}
                ORDER BY timestamp ASC
            """, params)

            rows = cursor.fetchall()

            if not rows:
                return PriceHistory(
                    market_id=market_id,
                    source=source or MarketSource.POLYMARKET,
                    timestamps=[],
                    prices=[],
                    volumes=[]
                )

            return PriceHistory(
                market_id=market_id,
                source=MarketSource(rows[0]['source']),
                timestamps=[datetime.fromisoformat(r['timestamp']) for r in rows],
                prices=[r['yes_price'] for r in rows],
                volumes=[r['volume_24h'] or 0 for r in rows],
                bids=[r['best_bid'] for r in rows],
                asks=[r['best_ask'] for r in rows]
            )

    # ==========================================================================
    # MARKET RESOLUTIONS
    # ==========================================================================

    def save_resolution(self, resolution: MarketResolution) -> int:
        """Save a market resolution record."""
        with self._cursor() as cursor:
            cursor.execute("""
                INSERT OR REPLACE INTO market_resolutions (
                    market_id, source, question, resolution_time, outcome,
                    final_price, settlement_value, price_1h_before,
                    price_6h_before, price_24h_before, volume_24h_before
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                resolution.market_id,
                resolution.source.value,
                resolution.question,
                resolution.resolution_time.isoformat(),
                resolution.outcome.value,
                resolution.final_price,
                resolution.settlement_value,
                resolution.price_1h_before,
                resolution.price_6h_before,
                resolution.price_24h_before,
                resolution.volume_24h_before
            ))
            return cursor.lastrowid

    def get_resolutions(
        self,
        source: Optional[MarketSource] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        outcome: Optional[OutcomeResult] = None
    ) -> List[MarketResolution]:
        """Query market resolutions with filters."""
        conditions = []
        params = []

        if source:
            conditions.append("source = ?")
            params.append(source.value)

        if start_time:
            conditions.append("resolution_time >= ?")
            params.append(start_time.isoformat())

        if end_time:
            conditions.append("resolution_time <= ?")
            params.append(end_time.isoformat())

        if outcome:
            conditions.append("outcome = ?")
            params.append(outcome.value)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        with self._cursor() as cursor:
            cursor.execute(f"""
                SELECT * FROM market_resolutions
                WHERE {where_clause}
                ORDER BY resolution_time DESC
            """, params)

            return [self._row_to_resolution(row) for row in cursor.fetchall()]

    def _row_to_resolution(self, row: sqlite3.Row) -> MarketResolution:
        """Convert database row to MarketResolution object."""
        return MarketResolution(
            market_id=row['market_id'],
            source=MarketSource(row['source']),
            question=row['question'] or "",
            resolution_time=datetime.fromisoformat(row['resolution_time']),
            outcome=OutcomeResult(row['outcome']),
            final_price=row['final_price'] or 0.5,
            settlement_value=row['settlement_value'] or 0,
            price_1h_before=row['price_1h_before'],
            price_6h_before=row['price_6h_before'],
            price_24h_before=row['price_24h_before'],
            volume_24h_before=row['volume_24h_before']
        )

    # ==========================================================================
    # SIGNALS
    # ==========================================================================

    def save_signal(self, signal: Signal) -> int:
        """Save a trading signal."""
        with self._cursor() as cursor:
            cursor.execute("""
                INSERT INTO signals (
                    strategy_name, market_id, timestamp, direction,
                    strength, confidence, expected_value, probability_estimate,
                    market_probability, kelly_fraction, time_horizon_hours,
                    explanation, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                signal.strategy_name,
                signal.market_id,
                signal.timestamp.isoformat(),
                signal.direction,
                signal.strength,
                signal.confidence,
                signal.expected_value,
                signal.probability_estimate,
                signal.market_probability,
                signal.kelly_fraction,
                signal.time_horizon_hours,
                signal.explanation,
                json.dumps(signal.metadata)
            ))
            return cursor.lastrowid

    def get_signals(
        self,
        strategy_name: Optional[str] = None,
        market_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[Signal]:
        """Query signals with filters."""
        conditions = []
        params = []

        if strategy_name:
            conditions.append("strategy_name = ?")
            params.append(strategy_name)

        if market_id:
            conditions.append("market_id = ?")
            params.append(market_id)

        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())

        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        with self._cursor() as cursor:
            cursor.execute(f"""
                SELECT * FROM signals
                WHERE {where_clause}
                ORDER BY timestamp DESC
                LIMIT ?
            """, params + [limit])

            return [self._row_to_signal(row) for row in cursor.fetchall()]

    def _row_to_signal(self, row: sqlite3.Row) -> Signal:
        """Convert database row to Signal object."""
        return Signal(
            strategy_name=row['strategy_name'],
            market_id=row['market_id'],
            timestamp=datetime.fromisoformat(row['timestamp']),
            direction=row['direction'] or "hold",
            strength=row['strength'] or 0,
            confidence=row['confidence'] or 0,
            expected_value=row['expected_value'] or 0,
            probability_estimate=row['probability_estimate'],
            market_probability=row['market_probability'],
            kelly_fraction=row['kelly_fraction'],
            time_horizon_hours=row['time_horizon_hours'],
            explanation=row['explanation'] or "",
            metadata=json.loads(row['metadata']) if row['metadata'] else {}
        )

    # ==========================================================================
    # OPPORTUNITIES
    # ==========================================================================

    def save_opportunity(self, opportunity: Opportunity) -> int:
        """Save a ranked opportunity."""
        with self._cursor() as cursor:
            cursor.execute("""
                INSERT INTO opportunities (
                    rank, market_id, market_name, source, timestamp,
                    composite_score, expected_value, confidence, risk_score,
                    current_price, liquidity, volume_24h, hours_to_resolution,
                    suggested_side, suggested_size, explanation, key_factors, risks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                opportunity.rank,
                opportunity.market_id,
                opportunity.market_name,
                opportunity.source.value,
                opportunity.timestamp.isoformat(),
                opportunity.composite_score,
                opportunity.expected_value,
                opportunity.confidence,
                opportunity.risk_score,
                opportunity.current_price,
                opportunity.liquidity,
                opportunity.volume_24h,
                opportunity.hours_to_resolution,
                opportunity.suggested_side,
                opportunity.suggested_size,
                opportunity.explanation,
                json.dumps(opportunity.key_factors),
                json.dumps(opportunity.risks)
            ))
            return cursor.lastrowid

    def save_opportunities(self, opportunities: List[Opportunity]) -> int:
        """Save multiple opportunities (typically daily batch)."""
        count = 0
        for opp in opportunities:
            self.save_opportunity(opp)
            count += 1
        return count

    def get_latest_opportunities(self, limit: int = 50) -> List[Opportunity]:
        """Get most recent opportunity rankings."""
        with self._cursor() as cursor:
            # Get latest timestamp
            cursor.execute("""
                SELECT MAX(timestamp) as max_ts FROM opportunities
            """)
            result = cursor.fetchone()
            if not result or not result['max_ts']:
                return []

            # Get opportunities from that timestamp
            cursor.execute("""
                SELECT * FROM opportunities
                WHERE timestamp = ?
                ORDER BY rank ASC
                LIMIT ?
            """, (result['max_ts'], limit))

            return [self._row_to_opportunity(row) for row in cursor.fetchall()]

    def _row_to_opportunity(self, row: sqlite3.Row) -> Opportunity:
        """Convert database row to Opportunity object."""
        return Opportunity(
            rank=row['rank'],
            market_id=row['market_id'],
            market_name=row['market_name'] or "",
            source=MarketSource(row['source']),
            timestamp=datetime.fromisoformat(row['timestamp']),
            composite_score=row['composite_score'] or 0,
            expected_value=row['expected_value'] or 0,
            confidence=row['confidence'] or 0,
            risk_score=row['risk_score'] or 0,
            current_price=row['current_price'] or 0.5,
            liquidity=row['liquidity'] or 0,
            volume_24h=row['volume_24h'] or 0,
            hours_to_resolution=row['hours_to_resolution'],
            suggested_side=row['suggested_side'] or "hold",
            suggested_size=row['suggested_size'] or 0,
            explanation=row['explanation'] or "",
            key_factors=json.loads(row['key_factors']) if row['key_factors'] else [],
            risks=json.loads(row['risks']) if row['risks'] else []
        )

    # ==========================================================================
    # ANALYTICS QUERIES
    # ==========================================================================

    def get_market_statistics(self, source: Optional[MarketSource] = None) -> Dict[str, Any]:
        """Get aggregate statistics about stored data."""
        with self._cursor() as cursor:
            source_filter = f"WHERE source = '{source.value}'" if source else ""

            cursor.execute(f"""
                SELECT
                    COUNT(DISTINCT market_id) as unique_markets,
                    COUNT(*) as total_snapshots,
                    MIN(timestamp) as earliest_data,
                    MAX(timestamp) as latest_data,
                    AVG(yes_price) as avg_price,
                    SUM(volume_24h) / COUNT(DISTINCT DATE(timestamp)) as avg_daily_volume
                FROM market_snapshots
                {source_filter}
            """)

            row = cursor.fetchone()
            return dict(row) if row else {}

    def get_resolution_statistics(self) -> Dict[str, Any]:
        """Get statistics about market resolutions."""
        with self._cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) as total_resolutions,
                    SUM(CASE WHEN outcome = 'yes' THEN 1 ELSE 0 END) as yes_outcomes,
                    SUM(CASE WHEN outcome = 'no' THEN 1 ELSE 0 END) as no_outcomes,
                    AVG(price_1h_before - settlement_value) as avg_error_1h,
                    AVG(price_24h_before - settlement_value) as avg_error_24h
                FROM market_resolutions
            """)

            row = cursor.fetchone()
            return dict(row) if row else {}

    # ==========================================================================
    # MAINTENANCE
    # ==========================================================================

    def vacuum(self):
        """Optimize database file size."""
        self._get_connection().execute("VACUUM")

    def close(self):
        """Close database connection."""
        if hasattr(self._local, 'conn') and self._local.conn:
            self._local.conn.close()
            self._local.conn = None


# Global database instance
_db: Optional[Database] = None


def get_database(
    db_path: str = "data/prediction_markets.db",
    parquet_path: Optional[str] = "data/parquet/"
) -> Database:
    """
    Get or create global database instance.

    Args:
        db_path: Path to SQLite database
        parquet_path: Path to Parquet files

    Returns:
        Database instance
    """
    global _db
    if _db is None:
        _db = Database(db_path=db_path, parquet_path=parquet_path)
    return _db
