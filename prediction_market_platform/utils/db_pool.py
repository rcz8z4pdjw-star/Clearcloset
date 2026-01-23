"""
Database Connection Pooling for SQLite.

Provides thread-safe connection pooling for SQLite databases.
While SQLite doesn't support true connection pooling like PostgreSQL,
this module provides connection reuse and thread-safe access.

Usage:
    from utils.db_pool import get_connection_pool, ConnectionPool

    pool = get_connection_pool()

    # Using context manager (recommended)
    with pool.connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM markets")

    # Manual management
    conn = pool.get_connection()
    try:
        # use connection
    finally:
        pool.release_connection(conn)
"""

import sqlite3
import threading
import queue
import os
from contextlib import contextmanager
from typing import Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ConnectionPool:
    """
    Thread-safe SQLite connection pool.

    SQLite has limitations with multi-threaded access:
    - WAL mode allows concurrent readers
    - Only one writer at a time
    - Connections should be used by the thread that created them

    This pool manages connections per-thread with optional pooling.
    """

    def __init__(
        self,
        database: str,
        pool_size: int = 5,
        timeout: float = 30.0,
        enable_wal: bool = True
    ):
        """
        Initialize connection pool.

        Args:
            database: Path to SQLite database
            pool_size: Maximum connections in pool
            timeout: Timeout for acquiring connections
            enable_wal: Enable WAL mode for better concurrency
        """
        self.database = database
        self.pool_size = pool_size
        self.timeout = timeout
        self.enable_wal = enable_wal

        # Ensure directory exists
        Path(database).parent.mkdir(parents=True, exist_ok=True)

        # Connection pool
        self._pool: queue.Queue = queue.Queue(maxsize=pool_size)
        self._pool_lock = threading.Lock()

        # Thread-local storage for connections
        self._local = threading.local()

        # Track active connections
        self._active_connections = 0
        self._total_created = 0

        # Initialize pool
        self._initialize_pool()

    def _initialize_pool(self):
        """Pre-create connections for the pool."""
        for _ in range(min(2, self.pool_size)):  # Start with 2 connections
            conn = self._create_connection()
            self._pool.put(conn)

    def _create_connection(self) -> sqlite3.Connection:
        """Create a new database connection."""
        conn = sqlite3.connect(
            self.database,
            timeout=self.timeout,
            check_same_thread=False  # We handle thread safety ourselves
        )

        # Enable WAL mode for better concurrency
        if self.enable_wal:
            conn.execute("PRAGMA journal_mode=WAL")

        # Other optimizations
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA temp_store=MEMORY")
        conn.execute("PRAGMA mmap_size=268435456")  # 256MB mmap
        conn.execute("PRAGMA cache_size=-64000")  # 64MB cache

        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys=ON")

        # Row factory for dict-like access
        conn.row_factory = sqlite3.Row

        self._total_created += 1
        logger.debug(f"Created connection #{self._total_created}")

        return conn

    def get_connection(self) -> sqlite3.Connection:
        """
        Get a connection from the pool.

        Returns:
            SQLite connection

        Raises:
            queue.Empty: If no connection available within timeout
        """
        # Check thread-local first
        if hasattr(self._local, 'connection') and self._local.connection:
            return self._local.connection

        try:
            # Try to get from pool
            conn = self._pool.get(timeout=self.timeout)
            self._active_connections += 1
            self._local.connection = conn
            return conn
        except queue.Empty:
            # Pool exhausted, create new connection if under limit
            with self._pool_lock:
                if self._active_connections < self.pool_size:
                    conn = self._create_connection()
                    self._active_connections += 1
                    self._local.connection = conn
                    return conn
                else:
                    raise queue.Empty("Connection pool exhausted")

    def release_connection(self, conn: sqlite3.Connection):
        """
        Return a connection to the pool.

        Args:
            conn: Connection to release
        """
        # Clear thread-local reference
        if hasattr(self._local, 'connection'):
            self._local.connection = None

        try:
            # Return to pool
            self._pool.put_nowait(conn)
            self._active_connections -= 1
        except queue.Full:
            # Pool full, close connection
            conn.close()
            self._active_connections -= 1

    @contextmanager
    def connection(self):
        """
        Context manager for getting a connection.

        Usage:
            with pool.connection() as conn:
                cursor = conn.cursor()
                ...
        """
        conn = self.get_connection()
        try:
            yield conn
        finally:
            self.release_connection(conn)

    @contextmanager
    def transaction(self):
        """
        Context manager for a transaction.

        Automatically commits on success, rolls back on exception.

        Usage:
            with pool.transaction() as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT ...")
                # Auto-commits if no exception
        """
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self.release_connection(conn)

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """
        Execute a single SQL statement.

        Args:
            sql: SQL statement
            params: Parameters for the statement

        Returns:
            Cursor with results
        """
        with self.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor

    def execute_many(self, sql: str, params_list: list) -> int:
        """
        Execute SQL statement with multiple parameter sets.

        Args:
            sql: SQL statement
            params_list: List of parameter tuples

        Returns:
            Number of rows affected
        """
        with self.transaction() as conn:
            cursor = conn.cursor()
            cursor.executemany(sql, params_list)
            return cursor.rowcount

    def fetch_one(self, sql: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        """
        Fetch a single row.

        Args:
            sql: SQL query
            params: Query parameters

        Returns:
            Row or None
        """
        with self.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            return cursor.fetchone()

    def fetch_all(self, sql: str, params: tuple = ()) -> list:
        """
        Fetch all rows.

        Args:
            sql: SQL query
            params: Query parameters

        Returns:
            List of rows
        """
        with self.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            return cursor.fetchall()

    def close_all(self):
        """Close all connections in the pool."""
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except queue.Empty:
                break

        logger.info(f"Closed all connections. Total created: {self._total_created}")

    def get_stats(self) -> dict:
        """Get pool statistics."""
        return {
            'database': self.database,
            'pool_size': self.pool_size,
            'active_connections': self._active_connections,
            'available_connections': self._pool.qsize(),
            'total_created': self._total_created,
            'wal_enabled': self.enable_wal
        }

    def __del__(self):
        """Cleanup on deletion."""
        self.close_all()


# Global pool instance
_global_pool: Optional[ConnectionPool] = None
_pool_lock = threading.Lock()


def get_connection_pool(
    database: Optional[str] = None,
    pool_size: int = 5,
    **kwargs
) -> ConnectionPool:
    """
    Get or create the global connection pool.

    Args:
        database: Database path (uses env var if not provided)
        pool_size: Maximum pool size
        **kwargs: Additional arguments for ConnectionPool

    Returns:
        ConnectionPool instance
    """
    global _global_pool

    if _global_pool is None:
        with _pool_lock:
            if _global_pool is None:
                db_path = database or os.environ.get(
                    'DATABASE_PATH',
                    'data/prediction_markets.db'
                )
                _global_pool = ConnectionPool(
                    database=db_path,
                    pool_size=pool_size,
                    **kwargs
                )

    return _global_pool


def close_global_pool():
    """Close the global connection pool."""
    global _global_pool

    if _global_pool is not None:
        _global_pool.close_all()
        _global_pool = None


# Convenience function
def with_connection(func):
    """
    Decorator to automatically manage database connections.

    The decorated function receives a 'conn' keyword argument.

    Usage:
        @with_connection
        def my_function(arg1, conn=None):
            cursor = conn.cursor()
            ...
    """
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        pool = get_connection_pool()
        with pool.connection() as conn:
            kwargs['conn'] = conn
            return func(*args, **kwargs)

    return wrapper
