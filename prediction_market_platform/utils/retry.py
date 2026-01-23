"""
Retry utilities with exponential backoff.

Provides decorators and utilities for retrying failed operations.
"""

import random
import time
from functools import wraps
from typing import Any, Callable, Optional, Tuple, Type, TypeVar, Union

from utils.logging_setup import get_logger

logger = get_logger("retry")

T = TypeVar('T')

# Default exceptions to retry on
DEFAULT_RETRY_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    ConnectionError,
    TimeoutError,
    OSError,
)


def retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retry_on: Optional[Tuple[Type[Exception], ...]] = None,
    on_retry: Optional[Callable[[Exception, int], None]] = None,
):
    """
    Decorator for retrying a function with exponential backoff.

    Args:
        max_attempts: Maximum number of attempts (including first try)
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff
        jitter: Add random jitter to delays
        retry_on: Tuple of exception types to retry on
        on_retry: Callback function called on each retry

    Returns:
        Decorated function

    Example:
        @retry(max_attempts=3, base_delay=1.0)
        def fetch_data():
            return requests.get("https://api.example.com/data")
    """
    if retry_on is None:
        retry_on = DEFAULT_RETRY_EXCEPTIONS

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)

                except retry_on as e:
                    last_exception = e

                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts: {e}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(
                        base_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )

                    # Add jitter
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    logger.warning(
                        f"{func.__name__} attempt {attempt}/{max_attempts} failed: {e}. "
                        f"Retrying in {delay:.2f}s"
                    )

                    # Call retry callback if provided
                    if on_retry:
                        on_retry(e, attempt)

                    time.sleep(delay)

            # Should never reach here, but just in case
            if last_exception:
                raise last_exception

        return wrapper
    return decorator


def retry_call(
    func: Callable[..., T],
    args: tuple = (),
    kwargs: Optional[dict] = None,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    retry_on: Optional[Tuple[Type[Exception], ...]] = None,
) -> T:
    """
    Call a function with retry logic.

    Args:
        func: Function to call
        args: Positional arguments
        kwargs: Keyword arguments
        max_attempts: Maximum attempts
        base_delay: Base delay between retries
        max_delay: Maximum delay
        retry_on: Exceptions to retry on

    Returns:
        Function result

    Example:
        result = retry_call(requests.get, args=("https://api.example.com",))
    """
    if kwargs is None:
        kwargs = {}
    if retry_on is None:
        retry_on = DEFAULT_RETRY_EXCEPTIONS

    @retry(
        max_attempts=max_attempts,
        base_delay=base_delay,
        max_delay=max_delay,
        retry_on=retry_on,
    )
    def _call():
        return func(*args, **kwargs)

    return _call()


class RetryContext:
    """
    Context manager for retry operations.

    Example:
        with RetryContext(max_attempts=3) as ctx:
            for attempt in ctx:
                try:
                    result = risky_operation()
                    break
                except ConnectionError:
                    ctx.record_failure()
    """

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

        self._attempt = 0
        self._last_exception: Optional[Exception] = None
        self._should_continue = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

    def __iter__(self):
        return self

    def __next__(self) -> int:
        if not self._should_continue or self._attempt >= self.max_attempts:
            raise StopIteration

        if self._attempt > 0 and self._last_exception:
            # Calculate and apply delay
            delay = min(
                self.base_delay * (self.exponential_base ** (self._attempt - 1)),
                self.max_delay
            )
            if self.jitter:
                delay = delay * (0.5 + random.random())

            logger.debug(f"Retry attempt {self._attempt + 1}, waiting {delay:.2f}s")
            time.sleep(delay)

        self._attempt += 1
        self._last_exception = None
        return self._attempt

    def record_failure(self, exception: Optional[Exception] = None) -> None:
        """Record a failed attempt."""
        self._last_exception = exception

    def success(self) -> None:
        """Mark operation as successful (stops retry loop)."""
        self._should_continue = False

    @property
    def attempt(self) -> int:
        """Current attempt number (1-indexed)."""
        return self._attempt

    @property
    def remaining_attempts(self) -> int:
        """Number of remaining attempts."""
        return self.max_attempts - self._attempt


class CircuitBreaker:
    """
    Circuit breaker pattern for failing fast on repeated errors.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Failing fast, requests immediately fail
    - HALF_OPEN: Testing if service recovered

    Example:
        breaker = CircuitBreaker(failure_threshold=5, reset_timeout=30)

        @breaker
        def call_external_api():
            return requests.get("https://api.example.com")
    """

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: float = 30.0,
        half_open_max_calls: int = 1,
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_max_calls = half_open_max_calls

        self._state = self.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[float] = None
        self._half_open_calls = 0

    @property
    def state(self) -> str:
        """Get current circuit state."""
        if self._state == self.OPEN:
            # Check if we should transition to half-open
            if self._last_failure_time:
                elapsed = time.time() - self._last_failure_time
                if elapsed >= self.reset_timeout:
                    self._state = self.HALF_OPEN
                    self._half_open_calls = 0
        return self._state

    def __call__(self, func: Callable[..., T]) -> Callable[..., T]:
        """Decorator usage."""
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            return self.call(func, *args, **kwargs)
        return wrapper

    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with circuit breaker protection."""
        state = self.state

        if state == self.OPEN:
            raise CircuitBreakerOpen(
                f"Circuit breaker is open. Reset in {self._time_until_reset():.1f}s"
            )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result

        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self) -> None:
        """Handle successful call."""
        if self._state == self.HALF_OPEN:
            self._half_open_calls += 1
            if self._half_open_calls >= self.half_open_max_calls:
                # Service recovered, close circuit
                self._state = self.CLOSED
                self._failure_count = 0
                logger.info("Circuit breaker closed (service recovered)")

    def _on_failure(self) -> None:
        """Handle failed call."""
        self._failure_count += 1
        self._last_failure_time = time.time()

        if self._state == self.HALF_OPEN:
            # Failed during half-open, reopen circuit
            self._state = self.OPEN
            logger.warning("Circuit breaker reopened (half-open test failed)")

        elif self._failure_count >= self.failure_threshold:
            # Too many failures, open circuit
            self._state = self.OPEN
            logger.warning(
                f"Circuit breaker opened after {self._failure_count} failures"
            )

    def _time_until_reset(self) -> float:
        """Get time until circuit resets to half-open."""
        if self._last_failure_time is None:
            return 0
        elapsed = time.time() - self._last_failure_time
        return max(0, self.reset_timeout - elapsed)

    def reset(self) -> None:
        """Manually reset the circuit breaker."""
        self._state = self.CLOSED
        self._failure_count = 0
        self._last_failure_time = None
        self._half_open_calls = 0

    def get_status(self) -> dict:
        """Get circuit breaker status."""
        return {
            'state': self.state,
            'failure_count': self._failure_count,
            'failure_threshold': self.failure_threshold,
            'time_until_reset': self._time_until_reset() if self._state == self.OPEN else 0,
        }


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass
