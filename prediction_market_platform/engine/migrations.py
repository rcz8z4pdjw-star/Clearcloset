"""
Database Migration System for Prediction Market Research Platform.

Provides schema versioning and migration support for the SQLite database.

Usage:
    from engine.migrations import run_migrations
    run_migrations()

Or via CLI:
    python -c "from engine.migrations import run_migrations; run_migrations()"
"""

import sqlite3
import os
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Optional, Callable
import logging

logger = logging.getLogger(__name__)

# Migration registry
MIGRATIONS: List[Tuple[int, str, Callable[[sqlite3.Connection], None]]] = []


def migration(version: int, description: str):
    """Decorator to register a migration."""
    def decorator(func: Callable[[sqlite3.Connection], None]):
        MIGRATIONS.append((version, description, func))
        return func
    return decorator


# ==============================================================================
# MIGRATION DEFINITIONS
# ==============================================================================

@migration(1, "Initial schema - create base tables")
def migration_001(conn: sqlite3.Connection):
    """Create initial database schema."""
    cursor = conn.cursor()

    # Schema version tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            description TEXT,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Market snapshots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS market_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT NOT NULL,
            source TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            question TEXT,
            description TEXT,
            category TEXT,
            tags TEXT,
            created_at TIMESTAMP,
            close_time TIMESTAMP,
            resolution_time TIMESTAMP,
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
            raw_data TEXT
        )
    """)

    # Index for common queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_snapshots_market_source
        ON market_snapshots(market_id, source)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
        ON market_snapshots(timestamp)
    """)

    conn.commit()


@migration(2, "Add signals table")
def migration_002(conn: sqlite3.Connection):
    """Add trading signals table."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT NOT NULL,
            strategy_name TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            direction TEXT,
            strength REAL,
            confidence REAL,
            expected_value REAL,
            metadata TEXT
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_signals_market
        ON signals(market_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_signals_strategy
        ON signals(strategy_name)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_signals_timestamp
        ON signals(timestamp)
    """)

    conn.commit()


@migration(3, "Add opportunities table")
def migration_003(conn: sqlite3.Connection):
    """Add scored opportunities table."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            composite_score REAL,
            expected_value REAL,
            confidence REAL,
            liquidity_score REAL,
            suggested_side TEXT,
            current_price REAL,
            key_factors TEXT,
            contributing_signals TEXT
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_opportunities_timestamp
        ON opportunities(timestamp)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_opportunities_score
        ON opportunities(composite_score DESC)
    """)

    conn.commit()


@migration(4, "Add order books table")
def migration_004(conn: sqlite3.Connection):
    """Add order book snapshots table."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            bids TEXT,
            asks TEXT,
            best_bid REAL,
            best_ask REAL,
            spread REAL,
            mid_price REAL,
            imbalance REAL
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_orderbooks_market
        ON order_books(market_id)
    """)

    conn.commit()


@migration(5, "Add performance tracking tables")
def migration_005(conn: sqlite3.Connection):
    """Add tables for performance tracking."""
    cursor = conn.cursor()

    # Predictions table (tracks signal outcomes)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT NOT NULL,
            strategy_name TEXT,
            predicted_direction TEXT,
            predicted_prob REAL,
            prediction_timestamp TIMESTAMP,
            resolution_timestamp TIMESTAMP,
            actual_outcome TEXT,
            was_correct INTEGER,
            profit_loss REAL
        )
    """)

    # Strategy performance aggregates
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy_name TEXT NOT NULL,
            period_start TIMESTAMP,
            period_end TIMESTAMP,
            total_predictions INTEGER,
            correct_predictions INTEGER,
            accuracy REAL,
            brier_score REAL,
            total_return REAL,
            sharpe_ratio REAL
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_market
        ON predictions(market_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_strategy
        ON predictions(strategy_name)
    """)

    conn.commit()


@migration(6, "Add social sentiment tables")
def migration_006(conn: sqlite3.Connection):
    """Add tables for social sentiment tracking."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS social_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            post_id TEXT NOT NULL,
            author TEXT,
            content TEXT,
            timestamp TIMESTAMP,
            sentiment_score REAL,
            relevance_score REAL,
            engagement INTEGER,
            market_mentions TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sentiment_aggregates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_id TEXT,
            topic TEXT,
            timestamp TIMESTAMP,
            period_hours INTEGER,
            avg_sentiment REAL,
            post_count INTEGER,
            volume_change REAL
        )
    """)

    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_unique
        ON social_posts(platform, post_id)
    """)

    conn.commit()


@migration(7, "Add news events table")
def migration_007(conn: sqlite3.Connection):
    """Add table for news events."""
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS news_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            title TEXT,
            url TEXT,
            published_at TIMESTAMP,
            category TEXT,
            relevance_score REAL,
            sentiment_score REAL,
            market_ids TEXT,
            summary TEXT
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_news_published
        ON news_events(published_at)
    """)

    conn.commit()


# ==============================================================================
# MIGRATION RUNNER
# ==============================================================================

def get_database_path() -> str:
    """Get database path from environment or default."""
    return os.environ.get('DATABASE_PATH', 'data/prediction_markets.db')


def get_current_version(conn: sqlite3.Connection) -> int:
    """Get current schema version."""
    cursor = conn.cursor()

    # Check if migrations table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='schema_migrations'
    """)

    if not cursor.fetchone():
        return 0

    cursor.execute("SELECT MAX(version) FROM schema_migrations")
    result = cursor.fetchone()
    return result[0] if result[0] else 0


def apply_migration(
    conn: sqlite3.Connection,
    version: int,
    description: str,
    migration_func: Callable
):
    """Apply a single migration."""
    logger.info(f"Applying migration {version}: {description}")

    try:
        migration_func(conn)

        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO schema_migrations (version, description)
            VALUES (?, ?)
        """, (version, description))
        conn.commit()

        logger.info(f"Migration {version} applied successfully")
    except Exception as e:
        conn.rollback()
        logger.error(f"Migration {version} failed: {e}")
        raise


def run_migrations(db_path: Optional[str] = None) -> int:
    """
    Run all pending migrations.

    Args:
        db_path: Path to database file (uses env var if not provided)

    Returns:
        Number of migrations applied
    """
    if db_path is None:
        db_path = get_database_path()

    # Ensure directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")

    try:
        # Sort migrations by version
        sorted_migrations = sorted(MIGRATIONS, key=lambda x: x[0])

        current_version = get_current_version(conn)
        logger.info(f"Current schema version: {current_version}")

        applied_count = 0
        for version, description, migration_func in sorted_migrations:
            if version > current_version:
                apply_migration(conn, version, description, migration_func)
                applied_count += 1

        if applied_count == 0:
            logger.info("Database schema is up to date")
        else:
            logger.info(f"Applied {applied_count} migrations")

        return applied_count

    finally:
        conn.close()


def get_migration_status(db_path: Optional[str] = None) -> dict:
    """
    Get current migration status.

    Returns:
        Dictionary with migration status info
    """
    if db_path is None:
        db_path = get_database_path()

    if not Path(db_path).exists():
        return {
            'database_exists': False,
            'current_version': 0,
            'latest_version': max(m[0] for m in MIGRATIONS) if MIGRATIONS else 0,
            'pending_migrations': len(MIGRATIONS),
            'applied_migrations': []
        }

    conn = sqlite3.connect(db_path)

    try:
        current_version = get_current_version(conn)

        # Get applied migrations
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT version, description, applied_at
                FROM schema_migrations
                ORDER BY version
            """)
            applied = [
                {'version': v, 'description': d, 'applied_at': a}
                for v, d, a in cursor.fetchall()
            ]
        except sqlite3.OperationalError:
            applied = []

        latest_version = max(m[0] for m in MIGRATIONS) if MIGRATIONS else 0
        pending = [
            {'version': v, 'description': d}
            for v, d, _ in MIGRATIONS if v > current_version
        ]

        return {
            'database_exists': True,
            'current_version': current_version,
            'latest_version': latest_version,
            'pending_migrations': len(pending),
            'pending': pending,
            'applied_migrations': applied
        }

    finally:
        conn.close()


def rollback_migration(db_path: Optional[str] = None, target_version: int = 0):
    """
    Rollback to a specific version.

    WARNING: This does not reverse schema changes, only removes migration records.
    Use with caution and backup your database first.
    """
    if db_path is None:
        db_path = get_database_path()

    conn = sqlite3.connect(db_path)

    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM schema_migrations WHERE version > ?",
            (target_version,)
        )
        conn.commit()
        logger.warning(f"Rolled back migration records to version {target_version}")
    finally:
        conn.close()


if __name__ == '__main__':
    import sys

    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) > 1 and sys.argv[1] == 'status':
        status = get_migration_status()
        print(f"Database exists: {status['database_exists']}")
        print(f"Current version: {status['current_version']}")
        print(f"Latest version: {status['latest_version']}")
        print(f"Pending migrations: {status['pending_migrations']}")
    else:
        run_migrations()
