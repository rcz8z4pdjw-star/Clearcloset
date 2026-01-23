"""
Caching layer for the prediction market platform.

Provides in-memory caching with TTL support for API responses and computed values.
"""

import hashlib
import json
import threading
import time
from dataclasses import dataclass, field
from functools import wraps
from typing import Any, Callable, Dict, Optional, TypeVar, Union

from utils.logging_setup import get_logger

logger = get_logger("cache")

T = TypeVar('T')


@dataclass
class CacheEntry:
    """Represents a cached value with metadata."""
    value: Any
    created_at: float
    ttl: float
    hits: int = 0

    @property
    def is_expired(self) -> bool:
        """Check if the entry has expired."""
        return time.time() > self.created_at + self.ttl

    @property
    def age(self) -> float:
        """Get age of entry in seconds."""
        return time.time() - self.created_at

    @property
    def remaining_ttl(self) -> float:
        """Get remaining TTL in seconds."""
        return max(0, (self.created_at + self.ttl) - time.time())


class Cache:
    """
    Thread-safe in-memory cache with TTL support.

    Features:
    - Configurable TTL per entry
    - Automatic cleanup of expired entries
    - Thread-safe operations
    - Cache statistics
    """

    def __init__(
        self,
        default_ttl: float = 60.0,
        max_size: int = 1000,
        cleanup_interval: float = 60.0
    ):
        """
        Initialize the cache.

        Args:
            default_ttl: Default time-to-live in seconds
            max_size: Maximum number of entries
            cleanup_interval: Interval for automatic cleanup
        """
        self.default_ttl = default_ttl
        self.max_size = max_size
        self.cleanup_interval = cleanup_interval

        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.RLock()
        self._stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'evictions': 0,
        }

        # Start cleanup thread
        self._cleanup_thread: Optional[threading.Thread] = None
        self._running = False

    def start(self):
        """Start the background cleanup thread."""
        if self._running:
            return
        self._running = True
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()
        logger.debug("Cache cleanup thread started")

    def stop(self):
        """Stop the background cleanup thread."""
        self._running = False
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=2)

    def _cleanup_loop(self):
        """Background loop for cleaning up expired entries."""
        while self._running:
            time.sleep(self.cleanup_interval)
            self.cleanup()

    def get(self, key: str, default: T = None) -> Union[Any, T]:
        """
        Get a value from the cache.

        Args:
            key: Cache key
            default: Default value if not found or expired

        Returns:
            Cached value or default
        """
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._stats['misses'] += 1
                return default

            if entry.is_expired:
                del self._cache[key]
                self._stats['misses'] += 1
                return default

            entry.hits += 1
            self._stats['hits'] += 1
            return entry.value

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        with self._lock:
            # Evict if at max size
            if len(self._cache) >= self.max_size and key not in self._cache:
                self._evict_oldest()

            self._cache[key] = CacheEntry(
                value=value,
                created_at=time.time(),
                ttl=ttl if ttl is not None else self.default_ttl
            )
            self._stats['sets'] += 1

    def delete(self, key: str) -> bool:
        """
        Delete a key from the cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if not found
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> int:
        """
        Clear all entries from the cache.

        Returns:
            Number of entries cleared
        """
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count

    def cleanup(self) -> int:
        """
        Remove expired entries.

        Returns:
            Number of entries removed
        """
        with self._lock:
            expired = [k for k, v in self._cache.items() if v.is_expired]
            for key in expired:
                del self._cache[key]
            if expired:
                logger.debug(f"Cleaned up {len(expired)} expired cache entries")
            return len(expired)

    def _evict_oldest(self) -> None:
        """Evict the oldest entry to make room for new ones."""
        if not self._cache:
            return

        # Find oldest entry
        oldest_key = min(self._cache, key=lambda k: self._cache[k].created_at)
        del self._cache[oldest_key]
        self._stats['evictions'] += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total = self._stats['hits'] + self._stats['misses']
            hit_rate = self._stats['hits'] / total if total > 0 else 0

            return {
                'size': len(self._cache),
                'max_size': self.max_size,
                'hits': self._stats['hits'],
                'misses': self._stats['misses'],
                'hit_rate': round(hit_rate, 4),
                'sets': self._stats['sets'],
                'evictions': self._stats['evictions'],
            }

    def __contains__(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None or entry.is_expired:
                return False
            return True

    def __len__(self) -> int:
        """Get number of entries (including expired)."""
        return len(self._cache)


def make_cache_key(*args, **kwargs) -> str:
    """
    Generate a cache key from arguments.

    Args:
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        Cache key string
    """
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(ttl: Optional[float] = None, key_prefix: str = ""):
    """
    Decorator to cache function results.

    Args:
        ttl: Time-to-live in seconds
        key_prefix: Prefix for cache keys

    Returns:
        Decorated function
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            cache = get_cache()
            key = f"{key_prefix}{func.__name__}:{make_cache_key(*args, **kwargs)}"

            # Try to get from cache
            result = cache.get(key)
            if result is not None:
                return result

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result

        # Add cache bypass method
        wrapper.uncached = func
        return wrapper

    return decorator


# Global cache instance
_cache: Optional[Cache] = None


def get_cache() -> Cache:
    """Get the global cache instance."""
    global _cache
    if _cache is None:
        _cache = Cache(default_ttl=60, max_size=500)
        _cache.start()
    return _cache


def init_cache(
    default_ttl: float = 60.0,
    max_size: int = 500,
    cleanup_interval: float = 60.0
) -> Cache:
    """
    Initialize the global cache.

    Args:
        default_ttl: Default TTL in seconds
        max_size: Maximum entries
        cleanup_interval: Cleanup interval in seconds

    Returns:
        Initialized cache instance
    """
    global _cache
    if _cache:
        _cache.stop()
    _cache = Cache(default_ttl, max_size, cleanup_interval)
    _cache.start()
    return _cache
