"""
Logging configuration for the Prediction Market Research Platform.

Provides structured logging with file rotation and console output.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from logging.handlers import RotatingFileHandler

# Global logger registry
_loggers = {}


def setup_logging(
    name: str = "prediction_market",
    level: str = "INFO",
    log_file: Optional[str] = None,
    max_size_mb: int = 100,
    backup_count: int = 5
) -> logging.Logger:
    """
    Set up logging with file and console handlers.

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (None = console only)
        max_size_mb: Maximum log file size before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, level.upper()))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_format = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=max_size_mb * 1024 * 1024,
            backupCount=backup_count
        )
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

    _loggers[name] = logger
    return logger


def get_logger(name: str = "prediction_market") -> logging.Logger:
    """
    Get or create a logger instance.

    Args:
        name: Logger name (supports dot notation for hierarchy)

    Returns:
        Logger instance
    """
    if name in _loggers:
        return _loggers[name]

    # Create child logger
    parent_name = "prediction_market"
    if name != parent_name:
        # Ensure parent exists
        if parent_name not in _loggers:
            setup_logging(parent_name)
        full_name = f"{parent_name}.{name}"
    else:
        full_name = name
        if name not in _loggers:
            setup_logging(name)

    logger = logging.getLogger(full_name)
    _loggers[name] = logger
    return logger


class LogContext:
    """
    Context manager for logging operations with timing.

    Usage:
        with LogContext(logger, "Processing markets"):
            process_markets()

    Logs:
        INFO | Starting: Processing markets
        INFO | Completed: Processing markets (took 1.23s)
    """

    def __init__(
        self,
        logger: logging.Logger,
        operation: str,
        level: int = logging.INFO
    ):
        self.logger = logger
        self.operation = operation
        self.level = level
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.log(self.level, f"Starting: {self.operation}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = (datetime.now() - self.start_time).total_seconds()

        if exc_type is None:
            self.logger.log(
                self.level,
                f"Completed: {self.operation} (took {elapsed:.2f}s)"
            )
        else:
            self.logger.error(
                f"Failed: {self.operation} (after {elapsed:.2f}s) - {exc_val}"
            )

        return False  # Don't suppress exceptions


def log_signal(
    logger: logging.Logger,
    strategy_name: str,
    market_id: str,
    signal_strength: float,
    confidence: float,
    details: Optional[dict] = None
):
    """
    Log a trading signal in standardized format.

    Args:
        logger: Logger instance
        strategy_name: Name of the strategy generating the signal
        market_id: Market identifier
        signal_strength: Signal strength (-1 to 1)
        confidence: Confidence level (0 to 1)
        details: Additional signal details
    """
    direction = "BUY" if signal_strength > 0 else "SELL" if signal_strength < 0 else "NEUTRAL"
    magnitude = abs(signal_strength)

    msg = (
        f"SIGNAL | {strategy_name} | {market_id} | "
        f"{direction} | strength={magnitude:.3f} | confidence={confidence:.3f}"
    )

    if details:
        msg += f" | {details}"

    logger.info(msg)


def log_opportunity(
    logger: logging.Logger,
    rank: int,
    market_id: str,
    score: float,
    expected_value: float,
    confidence: float,
    market_name: str
):
    """
    Log a ranked opportunity in standardized format.
    """
    msg = (
        f"OPPORTUNITY #{rank:02d} | score={score:.3f} | "
        f"EV={expected_value:+.2%} | conf={confidence:.2f} | "
        f"{market_id} | {market_name[:50]}"
    )
    logger.info(msg)


def log_backtest_result(
    logger: logging.Logger,
    strategy_name: str,
    metrics: dict
):
    """
    Log backtest results in standardized format.
    """
    logger.info(f"BACKTEST RESULTS | {strategy_name}")
    logger.info("-" * 50)
    for metric, value in metrics.items():
        if isinstance(value, float):
            logger.info(f"  {metric}: {value:.4f}")
        else:
            logger.info(f"  {metric}: {value}")
    logger.info("-" * 50)
