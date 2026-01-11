"""
Input Validation Utilities for CLI and API.

Provides validation functions for common input types used throughout the platform.
"""

import re
from datetime import datetime
from typing import Optional, Tuple, Any
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of a validation check."""
    valid: bool
    value: Any = None
    error: Optional[str] = None


def validate_date(
    date_str: str,
    format: str = "%Y-%m-%d",
    allow_future: bool = True,
    allow_past: bool = True
) -> ValidationResult:
    """
    Validate a date string.

    Args:
        date_str: Date string to validate
        format: Expected date format
        allow_future: Allow dates in the future
        allow_past: Allow dates in the past

    Returns:
        ValidationResult with parsed date or error
    """
    try:
        parsed_date = datetime.strptime(date_str, format)

        now = datetime.now()
        if not allow_future and parsed_date > now:
            return ValidationResult(
                valid=False,
                error=f"Date cannot be in the future: {date_str}"
            )

        if not allow_past and parsed_date < now:
            return ValidationResult(
                valid=False,
                error=f"Date cannot be in the past: {date_str}"
            )

        return ValidationResult(valid=True, value=parsed_date)

    except ValueError:
        return ValidationResult(
            valid=False,
            error=f"Invalid date format: {date_str}. Expected format: {format}"
        )


def validate_date_range(
    start_date: str,
    end_date: str,
    format: str = "%Y-%m-%d"
) -> ValidationResult:
    """
    Validate a date range.

    Args:
        start_date: Start date string
        end_date: End date string
        format: Expected date format

    Returns:
        ValidationResult with (start, end) tuple or error
    """
    start_result = validate_date(start_date, format)
    if not start_result.valid:
        return start_result

    end_result = validate_date(end_date, format)
    if not end_result.valid:
        return end_result

    if start_result.value > end_result.value:
        return ValidationResult(
            valid=False,
            error=f"Start date ({start_date}) cannot be after end date ({end_date})"
        )

    return ValidationResult(valid=True, value=(start_result.value, end_result.value))


def validate_probability(value: float, name: str = "probability") -> ValidationResult:
    """
    Validate a probability value (0-1).

    Args:
        value: Value to validate
        name: Name for error messages

    Returns:
        ValidationResult
    """
    try:
        value = float(value)
    except (ValueError, TypeError):
        return ValidationResult(
            valid=False,
            error=f"{name} must be a number"
        )

    if value < 0.0 or value > 1.0:
        return ValidationResult(
            valid=False,
            error=f"{name} must be between 0 and 1, got {value}"
        )

    return ValidationResult(valid=True, value=value)


def validate_positive_number(
    value: Any,
    name: str = "value",
    allow_zero: bool = False,
    max_value: Optional[float] = None
) -> ValidationResult:
    """
    Validate a positive number.

    Args:
        value: Value to validate
        name: Name for error messages
        allow_zero: Whether to allow zero
        max_value: Maximum allowed value

    Returns:
        ValidationResult
    """
    try:
        value = float(value)
    except (ValueError, TypeError):
        return ValidationResult(
            valid=False,
            error=f"{name} must be a number"
        )

    if allow_zero:
        if value < 0:
            return ValidationResult(
                valid=False,
                error=f"{name} must be non-negative, got {value}"
            )
    else:
        if value <= 0:
            return ValidationResult(
                valid=False,
                error=f"{name} must be positive, got {value}"
            )

    if max_value is not None and value > max_value:
        return ValidationResult(
            valid=False,
            error=f"{name} must be at most {max_value}, got {value}"
        )

    return ValidationResult(valid=True, value=value)


def validate_integer_range(
    value: Any,
    min_val: int,
    max_val: int,
    name: str = "value"
) -> ValidationResult:
    """
    Validate an integer is within range.

    Args:
        value: Value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        name: Name for error messages

    Returns:
        ValidationResult
    """
    try:
        value = int(value)
    except (ValueError, TypeError):
        return ValidationResult(
            valid=False,
            error=f"{name} must be an integer"
        )

    if value < min_val or value > max_val:
        return ValidationResult(
            valid=False,
            error=f"{name} must be between {min_val} and {max_val}, got {value}"
        )

    return ValidationResult(valid=True, value=value)


def validate_market_id(market_id: str) -> ValidationResult:
    """
    Validate a market ID format.

    Supports:
    - Polymarket condition IDs (0x prefixed hex)
    - Kalshi tickers (alphanumeric with dashes)

    Args:
        market_id: Market ID to validate

    Returns:
        ValidationResult
    """
    if not market_id or not isinstance(market_id, str):
        return ValidationResult(
            valid=False,
            error="Market ID is required"
        )

    market_id = market_id.strip()

    if len(market_id) < 3:
        return ValidationResult(
            valid=False,
            error=f"Market ID too short: {market_id}"
        )

    if len(market_id) > 100:
        return ValidationResult(
            valid=False,
            error=f"Market ID too long: {market_id[:50]}..."
        )

    # Polymarket format (0x followed by hex)
    if market_id.startswith('0x'):
        if not re.match(r'^0x[a-fA-F0-9]+$', market_id):
            return ValidationResult(
                valid=False,
                error=f"Invalid Polymarket ID format: {market_id}"
            )
        return ValidationResult(valid=True, value=market_id)

    # Kalshi format (alphanumeric, dashes, underscores)
    if not re.match(r'^[a-zA-Z0-9_-]+$', market_id):
        return ValidationResult(
            valid=False,
            error=f"Invalid market ID format: {market_id}"
        )

    return ValidationResult(valid=True, value=market_id)


def validate_strategy_name(name: str, valid_strategies: list) -> ValidationResult:
    """
    Validate a strategy name against list of valid strategies.

    Args:
        name: Strategy name to validate
        valid_strategies: List of valid strategy names

    Returns:
        ValidationResult
    """
    if not name:
        return ValidationResult(
            valid=False,
            error="Strategy name is required"
        )

    name = name.strip().lower()

    # Normalize valid strategies
    normalized = {s.lower(): s for s in valid_strategies}

    if name not in normalized:
        return ValidationResult(
            valid=False,
            error=f"Unknown strategy: {name}. Valid strategies: {', '.join(valid_strategies)}"
        )

    return ValidationResult(valid=True, value=normalized[name])


def validate_output_format(format: str) -> ValidationResult:
    """
    Validate output format.

    Args:
        format: Format string to validate

    Returns:
        ValidationResult
    """
    valid_formats = ['json', 'csv', 'markdown', 'md', 'html']
    format = format.lower().strip()

    if format not in valid_formats:
        return ValidationResult(
            valid=False,
            error=f"Invalid format: {format}. Valid formats: {', '.join(valid_formats)}"
        )

    return ValidationResult(valid=True, value=format)


def validate_file_path(
    path: str,
    must_exist: bool = False,
    extension: Optional[str] = None
) -> ValidationResult:
    """
    Validate a file path.

    Args:
        path: File path to validate
        must_exist: Whether file must already exist
        extension: Required file extension (e.g., '.json')

    Returns:
        ValidationResult
    """
    from pathlib import Path

    if not path:
        return ValidationResult(
            valid=False,
            error="File path is required"
        )

    try:
        path_obj = Path(path)

        if must_exist and not path_obj.exists():
            return ValidationResult(
                valid=False,
                error=f"File not found: {path}"
            )

        if extension:
            if not extension.startswith('.'):
                extension = f'.{extension}'
            if path_obj.suffix.lower() != extension.lower():
                return ValidationResult(
                    valid=False,
                    error=f"File must have {extension} extension: {path}"
                )

        return ValidationResult(valid=True, value=str(path_obj))

    except Exception as e:
        return ValidationResult(
            valid=False,
            error=f"Invalid file path: {e}"
        )


class CLIValidator:
    """
    Validator class for CLI argument validation.

    Usage:
        validator = CLIValidator()
        if not validator.validate_backtest_args(args):
            print(validator.errors)
            sys.exit(1)
    """

    def __init__(self):
        self.errors = []

    def clear(self):
        """Clear accumulated errors."""
        self.errors = []

    def add_error(self, error: str):
        """Add an error message."""
        self.errors.append(error)

    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return len(self.errors) > 0

    def get_error_message(self) -> str:
        """Get formatted error message."""
        if not self.errors:
            return ""
        return "Validation errors:\n" + "\n".join(f"  - {e}" for e in self.errors)

    def validate_backtest_args(self, args) -> bool:
        """
        Validate backtest command arguments.

        Args:
            args: Parsed argument namespace

        Returns:
            True if valid
        """
        self.clear()

        # Validate date range
        if hasattr(args, 'start_date') and hasattr(args, 'end_date'):
            result = validate_date_range(args.start_date, args.end_date)
            if not result.valid:
                self.add_error(result.error)

        # Validate capital
        if hasattr(args, 'capital'):
            result = validate_positive_number(args.capital, "capital")
            if not result.valid:
                self.add_error(result.error)

        return not self.has_errors()

    def validate_kelly_args(self, args) -> bool:
        """
        Validate Kelly command arguments.

        Args:
            args: Parsed argument namespace

        Returns:
            True if valid
        """
        self.clear()

        # Validate probability
        if hasattr(args, 'probability'):
            result = validate_probability(args.probability, "win probability")
            if not result.valid:
                self.add_error(result.error)

        # Validate bankroll
        if hasattr(args, 'bankroll'):
            result = validate_positive_number(args.bankroll, "bankroll")
            if not result.valid:
                self.add_error(result.error)

        # Validate Kelly fraction
        if hasattr(args, 'fraction'):
            result = validate_probability(args.fraction, "Kelly fraction")
            if not result.valid:
                self.add_error(result.error)

        # Validate market price if provided
        if hasattr(args, 'market_price') and args.market_price is not None:
            result = validate_probability(args.market_price, "market price")
            if not result.valid:
                self.add_error(result.error)

        return not self.has_errors()

    def validate_analyze_args(self, args) -> bool:
        """
        Validate analyze command arguments.

        Args:
            args: Parsed argument namespace

        Returns:
            True if valid
        """
        self.clear()

        if hasattr(args, 'market_id'):
            result = validate_market_id(args.market_id)
            if not result.valid:
                self.add_error(result.error)

        return not self.has_errors()

    def validate_export_args(self, args) -> bool:
        """
        Validate export command arguments.

        Args:
            args: Parsed argument namespace

        Returns:
            True if valid
        """
        self.clear()

        if hasattr(args, 'format'):
            result = validate_output_format(args.format)
            if not result.valid:
                self.add_error(result.error)

        if hasattr(args, 'output'):
            result = validate_file_path(args.output)
            if not result.valid:
                self.add_error(result.error)

        return not self.has_errors()

    def validate_live_args(self, args) -> bool:
        """
        Validate live command arguments.

        Args:
            args: Parsed argument namespace

        Returns:
            True if valid
        """
        self.clear()

        if hasattr(args, 'interval'):
            result = validate_integer_range(args.interval, 30, 3600, "interval")
            if not result.valid:
                self.add_error(result.error)

        return not self.has_errors()
