"""
Data Validation Module.

Validates and quality-checks market data for:
- Completeness (missing fields)
- Consistency (logical constraints)
- Timeliness (data freshness)
- Gap detection (missing time periods)

Data quality is critical for accurate strategy signals.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum

from .models import MarketSnapshot, OrderBook, PriceHistory, MarketStatus


class ValidationSeverity(Enum):
    """Severity level of validation issues."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationIssue:
    """Single validation issue."""
    severity: ValidationSeverity
    field: str
    message: str
    market_id: Optional[str] = None
    timestamp: Optional[datetime] = None

    def __str__(self):
        return f"[{self.severity.value.upper()}] {self.field}: {self.message}"


@dataclass
class ValidationResult:
    """Result of validation check."""
    is_valid: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    warnings_count: int = 0
    errors_count: int = 0
    critical_count: int = 0

    def add_issue(self, issue: ValidationIssue):
        """Add an issue to the result."""
        self.issues.append(issue)

        if issue.severity == ValidationSeverity.WARNING:
            self.warnings_count += 1
        elif issue.severity == ValidationSeverity.ERROR:
            self.errors_count += 1
            self.is_valid = False
        elif issue.severity == ValidationSeverity.CRITICAL:
            self.critical_count += 1
            self.is_valid = False

    def merge(self, other: 'ValidationResult'):
        """Merge another validation result into this one."""
        self.issues.extend(other.issues)
        self.warnings_count += other.warnings_count
        self.errors_count += other.errors_count
        self.critical_count += other.critical_count
        if not other.is_valid:
            self.is_valid = False

    def summary(self) -> str:
        """Get summary of validation result."""
        status = "PASSED" if self.is_valid else "FAILED"
        return (
            f"Validation {status}: "
            f"{self.critical_count} critical, "
            f"{self.errors_count} errors, "
            f"{self.warnings_count} warnings"
        )


class DataValidator:
    """
    Validates prediction market data.

    Performs multiple validation checks:
    - Field validation (required fields present)
    - Range validation (values within expected ranges)
    - Consistency validation (logical relationships)
    - Freshness validation (data not stale)
    - Gap detection (missing time periods)
    """

    def __init__(
        self,
        max_staleness_hours: float = 1.0,
        min_snapshot_interval_minutes: float = 5.0,
        max_gap_hours: float = 2.0
    ):
        """
        Initialize validator.

        Args:
            max_staleness_hours: Max age of data before warning
            min_snapshot_interval_minutes: Expected minimum interval
            max_gap_hours: Max acceptable gap in time series
        """
        self.max_staleness_hours = max_staleness_hours
        self.min_interval = min_snapshot_interval_minutes
        self.max_gap_hours = max_gap_hours

    def validate_snapshot(self, snapshot: MarketSnapshot) -> ValidationResult:
        """
        Validate a single market snapshot.

        Args:
            snapshot: Market snapshot to validate

        Returns:
            ValidationResult with any issues found
        """
        result = ValidationResult(is_valid=True)

        # Required field validation
        self._validate_required_fields(snapshot, result)

        # Range validation
        self._validate_ranges(snapshot, result)

        # Consistency validation
        self._validate_consistency(snapshot, result)

        # Freshness validation
        self._validate_freshness(snapshot, result)

        return result

    def validate_order_book(self, order_book: OrderBook) -> ValidationResult:
        """
        Validate order book data.

        Args:
            order_book: Order book to validate

        Returns:
            ValidationResult
        """
        result = ValidationResult(is_valid=True)

        # Check for empty book
        if not order_book.bids and not order_book.asks:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="order_book",
                message="Order book is empty",
                market_id=order_book.market_id
            ))

        # Check bid/ask ordering
        if order_book.bids:
            for i in range(1, len(order_book.bids)):
                if order_book.bids[i].price > order_book.bids[i - 1].price:
                    result.add_issue(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field="bids",
                        message="Bids not sorted descending by price",
                        market_id=order_book.market_id
                    ))
                    break

        if order_book.asks:
            for i in range(1, len(order_book.asks)):
                if order_book.asks[i].price < order_book.asks[i - 1].price:
                    result.add_issue(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field="asks",
                        message="Asks not sorted ascending by price",
                        market_id=order_book.market_id
                    ))
                    break

        # Check for crossed book
        if order_book.best_bid and order_book.best_ask:
            if order_book.best_bid >= order_book.best_ask:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field="spread",
                    message=f"Crossed book: bid {order_book.best_bid} >= ask {order_book.best_ask}",
                    market_id=order_book.market_id
                ))

        # Check for negative sizes
        for level in order_book.bids + order_book.asks:
            if level.size < 0:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field="size",
                    message="Negative order size",
                    market_id=order_book.market_id
                ))
                break

        return result

    def validate_price_history(
        self,
        history: PriceHistory,
        market_id: str
    ) -> ValidationResult:
        """
        Validate price history time series.

        Args:
            history: Price history to validate
            market_id: Market identifier

        Returns:
            ValidationResult
        """
        result = ValidationResult(is_valid=True)

        if len(history) == 0:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="price_history",
                message="Empty price history",
                market_id=market_id
            ))
            return result

        # Check timestamp ordering
        for i in range(1, len(history.timestamps)):
            if history.timestamps[i] <= history.timestamps[i - 1]:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field="timestamps",
                    message="Timestamps not in ascending order",
                    market_id=market_id
                ))
                break

        # Check for gaps
        gaps = self._detect_gaps(history.timestamps)
        for gap_start, gap_end, gap_hours in gaps:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="timestamps",
                message=f"Gap of {gap_hours:.1f} hours detected",
                market_id=market_id,
                timestamp=gap_start
            ))

        # Validate prices
        for i, price in enumerate(history.prices):
            if price < 0 or price > 1:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field="prices",
                    message=f"Price {price} out of range [0, 1]",
                    market_id=market_id,
                    timestamp=history.timestamps[i] if i < len(history.timestamps) else None
                ))

        # Check for suspicious jumps
        for i in range(1, len(history.prices)):
            jump = abs(history.prices[i] - history.prices[i - 1])
            if jump > 0.30:  # 30% jump
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="prices",
                    message=f"Large price jump of {jump:.1%} detected",
                    market_id=market_id,
                    timestamp=history.timestamps[i] if i < len(history.timestamps) else None
                ))

        return result

    def validate_batch(
        self,
        snapshots: List[MarketSnapshot]
    ) -> ValidationResult:
        """
        Validate a batch of snapshots.

        Args:
            snapshots: List of snapshots to validate

        Returns:
            Combined ValidationResult
        """
        result = ValidationResult(is_valid=True)

        for snapshot in snapshots:
            snapshot_result = self.validate_snapshot(snapshot)
            result.merge(snapshot_result)

        # Check for duplicates
        seen = set()
        for snapshot in snapshots:
            key = (snapshot.market_id, snapshot.timestamp.isoformat())
            if key in seen:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="duplicates",
                    message="Duplicate snapshot detected",
                    market_id=snapshot.market_id,
                    timestamp=snapshot.timestamp
                ))
            seen.add(key)

        return result

    def _validate_required_fields(
        self,
        snapshot: MarketSnapshot,
        result: ValidationResult
    ):
        """Validate required fields are present."""
        if not snapshot.market_id:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                field="market_id",
                message="Missing market_id"
            ))

        if not snapshot.question:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="question",
                message="Missing question",
                market_id=snapshot.market_id
            ))

    def _validate_ranges(
        self,
        snapshot: MarketSnapshot,
        result: ValidationResult
    ):
        """Validate values are within expected ranges."""
        # Price range
        for field_name, value in [
            ('yes_price', snapshot.yes_price),
            ('no_price', snapshot.no_price),
            ('best_bid', snapshot.best_bid),
            ('best_ask', snapshot.best_ask)
        ]:
            if value is not None and (value < 0 or value > 1):
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field=field_name,
                    message=f"Value {value} out of range [0, 1]",
                    market_id=snapshot.market_id
                ))

        # Non-negative values
        for field_name, value in [
            ('volume_24h', snapshot.volume_24h),
            ('total_volume', snapshot.total_volume),
            ('liquidity', snapshot.liquidity),
            ('open_interest', snapshot.open_interest)
        ]:
            if value is not None and value < 0:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field=field_name,
                    message=f"Negative value: {value}",
                    market_id=snapshot.market_id
                ))

    def _validate_consistency(
        self,
        snapshot: MarketSnapshot,
        result: ValidationResult
    ):
        """Validate logical consistency."""
        # Yes + No should roughly equal 1 (allowing for spread/vig)
        if snapshot.yes_price and snapshot.no_price:
            total = snapshot.yes_price + snapshot.no_price
            if total < 0.90 or total > 1.10:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="prices",
                    message=f"Yes + No = {total:.2f}, expected ~1.0",
                    market_id=snapshot.market_id
                ))

        # Bid should be less than ask
        if snapshot.best_bid and snapshot.best_ask:
            if snapshot.best_bid >= snapshot.best_ask:
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field="bid_ask",
                    message=f"Bid ({snapshot.best_bid}) >= Ask ({snapshot.best_ask})",
                    market_id=snapshot.market_id
                ))

        # Resolution time should be in future for active markets
        if snapshot.status == MarketStatus.ACTIVE and snapshot.resolution_time:
            if snapshot.resolution_time < datetime.utcnow():
                result.add_issue(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="resolution_time",
                    message="Active market has past resolution time",
                    market_id=snapshot.market_id
                ))

    def _validate_freshness(
        self,
        snapshot: MarketSnapshot,
        result: ValidationResult
    ):
        """Validate data freshness."""
        age_hours = (datetime.utcnow() - snapshot.timestamp).total_seconds() / 3600

        if age_hours > self.max_staleness_hours:
            result.add_issue(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="timestamp",
                message=f"Data is {age_hours:.1f} hours old",
                market_id=snapshot.market_id,
                timestamp=snapshot.timestamp
            ))

    def _detect_gaps(
        self,
        timestamps: List[datetime]
    ) -> List[Tuple[datetime, datetime, float]]:
        """
        Detect gaps in timestamp series.

        Returns:
            List of (gap_start, gap_end, gap_hours) tuples
        """
        gaps = []

        for i in range(1, len(timestamps)):
            delta = timestamps[i] - timestamps[i - 1]
            gap_hours = delta.total_seconds() / 3600

            if gap_hours > self.max_gap_hours:
                gaps.append((timestamps[i - 1], timestamps[i], gap_hours))

        return gaps


class DataQualityReport:
    """
    Generates data quality reports.

    Aggregates validation results and produces summary statistics.
    """

    def __init__(self):
        self.results: List[ValidationResult] = []
        self.markets_validated = 0
        self.total_issues = 0

    def add_result(self, result: ValidationResult):
        """Add a validation result."""
        self.results.append(result)
        self.markets_validated += 1
        self.total_issues += len(result.issues)

    def generate_report(self) -> str:
        """Generate markdown quality report."""
        lines = [
            "# Data Quality Report",
            f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
            "",
            "## Summary",
            "",
            f"- **Markets Validated:** {self.markets_validated}",
            f"- **Total Issues:** {self.total_issues}",
            "",
        ]

        # Count by severity
        severity_counts = {s: 0 for s in ValidationSeverity}
        for result in self.results:
            for issue in result.issues:
                severity_counts[issue.severity] += 1

        lines.extend([
            "### Issues by Severity",
            "",
            "| Severity | Count |",
            "|----------|-------|",
        ])
        for severity in ValidationSeverity:
            lines.append(f"| {severity.value.title()} | {severity_counts[severity]} |")

        # Count by field
        field_counts: Dict[str, int] = {}
        for result in self.results:
            for issue in result.issues:
                field_counts[issue.field] = field_counts.get(issue.field, 0) + 1

        if field_counts:
            lines.extend([
                "",
                "### Issues by Field",
                "",
                "| Field | Count |",
                "|-------|-------|",
            ])
            for field, count in sorted(field_counts.items(), key=lambda x: -x[1]):
                lines.append(f"| {field} | {count} |")

        # Sample issues
        all_issues = [issue for result in self.results for issue in result.issues]
        if all_issues:
            lines.extend([
                "",
                "### Sample Issues",
                "",
            ])
            for issue in all_issues[:10]:
                lines.append(f"- {issue}")

        return "\n".join(lines)


def validate_data_quality(
    snapshots: List[MarketSnapshot],
    order_books: Optional[List[OrderBook]] = None
) -> DataQualityReport:
    """
    Convenience function to validate data quality.

    Args:
        snapshots: List of snapshots
        order_books: Optional list of order books

    Returns:
        DataQualityReport
    """
    validator = DataValidator()
    report = DataQualityReport()

    for snapshot in snapshots:
        result = validator.validate_snapshot(snapshot)
        report.add_result(result)

    if order_books:
        for ob in order_books:
            result = validator.validate_order_book(ob)
            report.add_result(result)

    return report
