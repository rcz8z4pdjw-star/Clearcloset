"""
Performance Tracker for Signal Accuracy.

Tracks and analyzes:
- Signal accuracy by strategy
- Prediction calibration
- Expected value realized vs predicted
- Win rate and profitability metrics
- Time-to-resolution analysis
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import json
import math

from utils.logging_setup import get_logger

logger = get_logger("performance_tracker")


@dataclass
class SignalRecord:
    """Record of a generated signal and its outcome."""
    signal_id: str
    strategy_name: str
    market_id: str
    timestamp: datetime

    # Signal details
    direction: str  # BUY or SELL
    suggested_side: str  # YES or NO
    strength: float
    confidence: float
    predicted_ev: float
    entry_price: float

    # Outcome (filled later)
    outcome: Optional[str] = None  # WIN, LOSS, PENDING, EXPIRED
    exit_price: Optional[float] = None
    actual_return: Optional[float] = None
    resolution_time: Optional[datetime] = None

    # Additional context
    market_resolved: bool = False
    notes: str = ""

    def calculate_return(self) -> Optional[float]:
        """Calculate actual return if outcome is known."""
        if self.exit_price is None:
            return None

        if self.suggested_side == "YES":
            # Bought YES: Win if resolved to 1, lose if resolved to 0
            if self.outcome == "WIN":
                return (1.0 - self.entry_price) / self.entry_price
            elif self.outcome == "LOSS":
                return -1.0
        else:
            # Bought NO: Win if resolved to 0, lose if resolved to 1
            if self.outcome == "WIN":
                return (1.0 - self.entry_price) / self.entry_price
            elif self.outcome == "LOSS":
                return -1.0

        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            'signal_id': self.signal_id,
            'strategy_name': self.strategy_name,
            'market_id': self.market_id,
            'timestamp': self.timestamp.isoformat(),
            'direction': self.direction,
            'suggested_side': self.suggested_side,
            'strength': self.strength,
            'confidence': self.confidence,
            'predicted_ev': self.predicted_ev,
            'entry_price': self.entry_price,
            'outcome': self.outcome,
            'exit_price': self.exit_price,
            'actual_return': self.actual_return,
            'resolution_time': self.resolution_time.isoformat() if self.resolution_time else None,
            'market_resolved': self.market_resolved,
            'notes': self.notes
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SignalRecord':
        """Create from dictionary."""
        return cls(
            signal_id=data['signal_id'],
            strategy_name=data['strategy_name'],
            market_id=data['market_id'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            direction=data['direction'],
            suggested_side=data['suggested_side'],
            strength=data['strength'],
            confidence=data['confidence'],
            predicted_ev=data['predicted_ev'],
            entry_price=data['entry_price'],
            outcome=data.get('outcome'),
            exit_price=data.get('exit_price'),
            actual_return=data.get('actual_return'),
            resolution_time=datetime.fromisoformat(data['resolution_time']) if data.get('resolution_time') else None,
            market_resolved=data.get('market_resolved', False),
            notes=data.get('notes', '')
        )


@dataclass
class StrategyPerformance:
    """Performance metrics for a single strategy."""
    strategy_name: str
    total_signals: int = 0
    resolved_signals: int = 0
    wins: int = 0
    losses: int = 0
    pending: int = 0

    # Returns
    total_return: float = 0.0
    avg_return: float = 0.0
    best_return: float = 0.0
    worst_return: float = -1.0

    # Accuracy
    win_rate: float = 0.0

    # Calibration
    avg_predicted_ev: float = 0.0
    avg_actual_ev: float = 0.0
    calibration_error: float = 0.0

    # Confidence analysis
    high_confidence_win_rate: float = 0.0  # Win rate for confidence > 0.7
    low_confidence_win_rate: float = 0.0   # Win rate for confidence < 0.4

    # Timing
    avg_time_to_resolution_hours: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'strategy_name': self.strategy_name,
            'total_signals': self.total_signals,
            'resolved_signals': self.resolved_signals,
            'wins': self.wins,
            'losses': self.losses,
            'pending': self.pending,
            'total_return': round(self.total_return, 4),
            'avg_return': round(self.avg_return, 4),
            'best_return': round(self.best_return, 4),
            'worst_return': round(self.worst_return, 4),
            'win_rate': round(self.win_rate, 4),
            'avg_predicted_ev': round(self.avg_predicted_ev, 4),
            'avg_actual_ev': round(self.avg_actual_ev, 4),
            'calibration_error': round(self.calibration_error, 4),
            'high_confidence_win_rate': round(self.high_confidence_win_rate, 4),
            'low_confidence_win_rate': round(self.low_confidence_win_rate, 4),
            'avg_time_to_resolution_hours': round(self.avg_time_to_resolution_hours, 2)
        }


class PerformanceTracker:
    """
    Tracks signal performance and calculates accuracy metrics.

    Features:
    - Records all signals generated
    - Updates outcomes when markets resolve
    - Calculates win rates, calibration, and returns
    - Provides strategy-level and aggregate analysis
    """

    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize performance tracker.

        Args:
            storage_path: Path to store performance data
        """
        self.storage_path = storage_path or "data/performance_history.json"
        self.signals: Dict[str, SignalRecord] = {}
        self.strategy_metrics: Dict[str, StrategyPerformance] = {}

        # Load existing data
        self._load_history()

    def _load_history(self):
        """Load historical performance data."""
        try:
            path = Path(self.storage_path)
            if path.exists():
                with open(path, 'r') as f:
                    data = json.load(f)
                    for signal_data in data.get('signals', []):
                        signal = SignalRecord.from_dict(signal_data)
                        self.signals[signal.signal_id] = signal
                logger.info(f"Loaded {len(self.signals)} historical signals")
        except Exception as e:
            logger.warning(f"Could not load history: {e}")

    def _save_history(self):
        """Save performance data to disk."""
        try:
            path = Path(self.storage_path)
            path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                'signals': [s.to_dict() for s in self.signals.values()],
                'last_updated': datetime.now(timezone.utc).isoformat()
            }

            with open(path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save history: {e}")

    def record_signal(
        self,
        signal_or_id: 'SignalRecord | str',
        strategy_name: Optional[str] = None,
        market_id: Optional[str] = None,
        direction: Optional[str] = None,
        suggested_side: Optional[str] = None,
        strength: Optional[float] = None,
        confidence: Optional[float] = None,
        predicted_ev: Optional[float] = None,
        entry_price: Optional[float] = None,
        timestamp: Optional[datetime] = None,
        # Alternative field names for compatibility
        expected_value: Optional[float] = None,
        market_price_at_signal: Optional[float] = None
    ) -> SignalRecord:
        """
        Record a new signal.

        Can accept either a SignalRecord object or individual parameters.

        Args:
            signal_or_id: SignalRecord object or unique signal ID string
            strategy_name: Name of strategy that generated it
            market_id: Market the signal is for
            direction: BUY or SELL
            suggested_side: YES or NO
            strength: Signal strength (0-1)
            confidence: Confidence level (0-1)
            predicted_ev: Predicted expected value (or expected_value)
            entry_price: Price at signal generation (or market_price_at_signal)
            timestamp: When signal was generated
            expected_value: Alias for predicted_ev
            market_price_at_signal: Alias for entry_price

        Returns:
            The recorded signal
        """
        # If a SignalRecord object is passed directly
        if isinstance(signal_or_id, SignalRecord):
            record = signal_or_id
            self.signals[record.signal_id] = record
            self._save_history()
            logger.info(f"Recorded signal {record.signal_id} from {record.strategy_name}")
            return record

        # Handle alternative field names
        actual_predicted_ev = predicted_ev if predicted_ev is not None else expected_value or 0.0
        actual_entry_price = entry_price if entry_price is not None else market_price_at_signal or 0.0

        signal_id = signal_or_id
        record = SignalRecord(
            signal_id=signal_id,
            strategy_name=strategy_name or "unknown",
            market_id=market_id or "unknown",
            timestamp=timestamp or datetime.now(timezone.utc),
            direction=direction or "BUY",
            suggested_side=suggested_side or "YES",
            strength=strength or 0.0,
            confidence=confidence or 0.0,
            predicted_ev=actual_predicted_ev,
            entry_price=actual_entry_price
        )

        self.signals[signal_id] = record
        self._save_history()

        logger.info(f"Recorded signal {signal_id} from {strategy_name}")
        return record

    def update_outcome(
        self,
        signal_id: str,
        outcome: str,
        exit_price: float,
        resolution_time: Optional[datetime] = None
    ):
        """
        Update a signal with its outcome.

        Args:
            signal_id: Signal to update
            outcome: WIN, LOSS, or EXPIRED
            exit_price: Final price / resolution
            resolution_time: When market resolved
        """
        if signal_id not in self.signals:
            logger.warning(f"Signal {signal_id} not found")
            return

        signal = self.signals[signal_id]
        signal.outcome = outcome
        signal.exit_price = exit_price
        signal.resolution_time = resolution_time or datetime.now(timezone.utc)
        signal.market_resolved = True
        signal.actual_return = signal.calculate_return()

        self._save_history()
        logger.info(f"Updated signal {signal_id}: {outcome}")

    # Alias for record_outcome
    def record_outcome(
        self,
        signal_id: str,
        outcome: str,
        exit_price: float,
        resolution_time: Optional[datetime] = None
    ):
        """Alias for update_outcome."""
        return self.update_outcome(signal_id, outcome, exit_price, resolution_time)

    def update_market_resolution(
        self,
        market_id: str,
        resolved_value: float,  # 1.0 for YES, 0.0 for NO
        resolution_time: Optional[datetime] = None
    ):
        """
        Update all signals for a market based on resolution.

        Args:
            market_id: Market that resolved
            resolved_value: 1.0 if YES won, 0.0 if NO won
            resolution_time: When it resolved
        """
        resolution_time = resolution_time or datetime.now(timezone.utc)

        for signal in self.signals.values():
            if signal.market_id == market_id and not signal.market_resolved:
                # Determine outcome
                if signal.suggested_side == "YES":
                    outcome = "WIN" if resolved_value > 0.5 else "LOSS"
                else:
                    outcome = "WIN" if resolved_value < 0.5 else "LOSS"

                signal.outcome = outcome
                signal.exit_price = resolved_value
                signal.resolution_time = resolution_time
                signal.market_resolved = True
                signal.actual_return = signal.calculate_return()

                logger.info(f"Market {market_id} resolved: Signal {signal.signal_id} = {outcome}")

        self._save_history()

    def calculate_strategy_performance(
        self,
        strategy_name: Optional[str] = None,
        since: Optional[datetime] = None
    ) -> Dict[str, StrategyPerformance]:
        """
        Calculate performance metrics by strategy.

        Args:
            strategy_name: Specific strategy or None for all
            since: Only include signals after this time

        Returns:
            Dictionary of strategy name to performance metrics
        """
        metrics: Dict[str, StrategyPerformance] = {}

        # Group signals by strategy
        strategy_signals: Dict[str, List[SignalRecord]] = defaultdict(list)

        for signal in self.signals.values():
            if strategy_name and signal.strategy_name != strategy_name:
                continue
            if since and signal.timestamp < since:
                continue
            strategy_signals[signal.strategy_name].append(signal)

        # Calculate metrics for each strategy
        for strat_name, signals in strategy_signals.items():
            perf = StrategyPerformance(strategy_name=strat_name)
            perf.total_signals = len(signals)

            resolved = [s for s in signals if s.market_resolved]
            perf.resolved_signals = len(resolved)
            perf.pending = perf.total_signals - perf.resolved_signals

            if resolved:
                perf.wins = sum(1 for s in resolved if s.outcome == "WIN")
                perf.losses = sum(1 for s in resolved if s.outcome == "LOSS")
                perf.win_rate = perf.wins / len(resolved) if resolved else 0

                # Returns
                returns = [s.actual_return for s in resolved if s.actual_return is not None]
                if returns:
                    perf.total_return = sum(returns)
                    perf.avg_return = sum(returns) / len(returns)
                    perf.best_return = max(returns)
                    perf.worst_return = min(returns)

                # Calibration
                perf.avg_predicted_ev = sum(s.predicted_ev for s in resolved) / len(resolved)
                actual_evs = [s.actual_return for s in resolved if s.actual_return is not None]
                if actual_evs:
                    perf.avg_actual_ev = sum(actual_evs) / len(actual_evs)
                    perf.calibration_error = abs(perf.avg_predicted_ev - perf.avg_actual_ev)

                # Confidence analysis
                high_conf = [s for s in resolved if s.confidence > 0.7]
                low_conf = [s for s in resolved if s.confidence < 0.4]

                if high_conf:
                    perf.high_confidence_win_rate = sum(1 for s in high_conf if s.outcome == "WIN") / len(high_conf)
                if low_conf:
                    perf.low_confidence_win_rate = sum(1 for s in low_conf if s.outcome == "WIN") / len(low_conf)

                # Time to resolution
                times = []
                for s in resolved:
                    if s.resolution_time and s.timestamp:
                        delta = (s.resolution_time - s.timestamp).total_seconds() / 3600
                        times.append(delta)

                if times:
                    perf.avg_time_to_resolution_hours = sum(times) / len(times)

            metrics[strat_name] = perf

        self.strategy_metrics = metrics
        return metrics

    def get_calibration_analysis(
        self,
        bucket_count: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze calibration across confidence buckets.

        Groups signals by confidence level and compares
        predicted win rates to actual win rates.

        Args:
            bucket_count: Number of confidence buckets

        Returns:
            Calibration analysis data
        """
        resolved = [s for s in self.signals.values() if s.market_resolved]

        if not resolved:
            return {'error': 'No resolved signals'}

        # Create buckets
        bucket_size = 1.0 / bucket_count
        buckets: Dict[int, List[SignalRecord]] = defaultdict(list)

        for signal in resolved:
            bucket_idx = min(int(signal.confidence / bucket_size), bucket_count - 1)
            buckets[bucket_idx].append(signal)

        calibration_data = []
        for i in range(bucket_count):
            bucket_signals = buckets[i]
            bucket_min = i * bucket_size
            bucket_max = (i + 1) * bucket_size

            if bucket_signals:
                wins = sum(1 for s in bucket_signals if s.outcome == "WIN")
                actual_rate = wins / len(bucket_signals)
                expected_rate = (bucket_min + bucket_max) / 2

                calibration_data.append({
                    'bucket': f"{bucket_min:.1f}-{bucket_max:.1f}",
                    'count': len(bucket_signals),
                    'expected_win_rate': expected_rate,
                    'actual_win_rate': actual_rate,
                    'calibration_error': actual_rate - expected_rate
                })

        # Calculate overall Brier score
        brier_score = sum(
            (s.confidence - (1 if s.outcome == "WIN" else 0)) ** 2
            for s in resolved
        ) / len(resolved)

        return {
            'buckets': calibration_data,
            'brier_score': round(brier_score, 4),
            'total_resolved': len(resolved),
            'is_well_calibrated': brier_score < 0.25
        }

    def get_recent_performance(
        self,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get performance summary for recent period.

        Args:
            hours: Lookback period in hours

        Returns:
            Recent performance summary
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent = [s for s in self.signals.values() if s.timestamp >= cutoff]
        resolved_recent = [s for s in recent if s.market_resolved]

        summary = {
            'period_hours': hours,
            'total_signals': len(recent),
            'resolved_signals': len(resolved_recent),
            'pending_signals': len(recent) - len(resolved_recent)
        }

        if resolved_recent:
            wins = sum(1 for s in resolved_recent if s.outcome == "WIN")
            summary['wins'] = wins
            summary['losses'] = len(resolved_recent) - wins
            summary['win_rate'] = wins / len(resolved_recent)

            returns = [s.actual_return for s in resolved_recent if s.actual_return is not None]
            if returns:
                summary['total_return'] = sum(returns)
                summary['avg_return'] = sum(returns) / len(returns)

        # Breakdown by strategy
        strategy_breakdown = {}
        for signal in recent:
            if signal.strategy_name not in strategy_breakdown:
                strategy_breakdown[signal.strategy_name] = {'total': 0, 'wins': 0, 'losses': 0}
            strategy_breakdown[signal.strategy_name]['total'] += 1
            if signal.outcome == "WIN":
                strategy_breakdown[signal.strategy_name]['wins'] += 1
            elif signal.outcome == "LOSS":
                strategy_breakdown[signal.strategy_name]['losses'] += 1

        summary['by_strategy'] = strategy_breakdown

        return summary

    def get_top_performing_strategies(
        self,
        metric: str = 'win_rate',
        min_signals: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Get strategies ranked by performance.

        Args:
            metric: Metric to rank by (win_rate, avg_return, total_return)
            min_signals: Minimum resolved signals to include

        Returns:
            List of (strategy_name, metric_value) tuples
        """
        self.calculate_strategy_performance()

        valid_strategies = [
            (name, perf) for name, perf in self.strategy_metrics.items()
            if perf.resolved_signals >= min_signals
        ]

        if metric == 'win_rate':
            ranked = sorted(valid_strategies, key=lambda x: x[1].win_rate, reverse=True)
            return [(name, perf.win_rate) for name, perf in ranked]
        elif metric == 'avg_return':
            ranked = sorted(valid_strategies, key=lambda x: x[1].avg_return, reverse=True)
            return [(name, perf.avg_return) for name, perf in ranked]
        elif metric == 'total_return':
            ranked = sorted(valid_strategies, key=lambda x: x[1].total_return, reverse=True)
            return [(name, perf.total_return) for name, perf in ranked]
        else:
            return []

    def generate_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive performance report.

        Returns:
            Full performance report
        """
        self.calculate_strategy_performance()

        total_signals = len(self.signals)
        resolved = [s for s in self.signals.values() if s.market_resolved]

        report = {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'summary': {
                'total_signals': total_signals,
                'resolved_signals': len(resolved),
                'pending_signals': total_signals - len(resolved),
                'resolution_rate': len(resolved) / total_signals if total_signals else 0
            },
            'overall_performance': {},
            'by_strategy': {
                name: perf.to_dict()
                for name, perf in self.strategy_metrics.items()
            },
            'calibration': self.get_calibration_analysis(),
            'recent_24h': self.get_recent_performance(24),
            'recent_7d': self.get_recent_performance(168),
            'top_strategies': {
                'by_win_rate': self.get_top_performing_strategies('win_rate'),
                'by_avg_return': self.get_top_performing_strategies('avg_return')
            }
        }

        # Overall performance
        if resolved:
            wins = sum(1 for s in resolved if s.outcome == "WIN")
            returns = [s.actual_return for s in resolved if s.actual_return is not None]

            report['overall_performance'] = {
                'total_wins': wins,
                'total_losses': len(resolved) - wins,
                'overall_win_rate': wins / len(resolved),
                'total_return': sum(returns) if returns else 0,
                'avg_return': sum(returns) / len(returns) if returns else 0
            }

        return report


def create_performance_tracker(storage_path: Optional[str] = None) -> PerformanceTracker:
    """
    Create a performance tracker instance.

    Args:
        storage_path: Optional path for data storage

    Returns:
        Configured PerformanceTracker
    """
    return PerformanceTracker(storage_path=storage_path)


# Convenience functions
def analyze_strategy(
    tracker: PerformanceTracker,
    strategy_name: str
) -> Dict[str, Any]:
    """
    Get detailed analysis for a specific strategy.

    Args:
        tracker: Performance tracker instance
        strategy_name: Strategy to analyze

    Returns:
        Detailed strategy analysis
    """
    metrics = tracker.calculate_strategy_performance(strategy_name=strategy_name)

    if strategy_name not in metrics:
        return {'error': f'No data for strategy: {strategy_name}'}

    perf = metrics[strategy_name]

    return {
        'strategy': strategy_name,
        'metrics': perf.to_dict(),
        'signals': [
            s.to_dict() for s in tracker.signals.values()
            if s.strategy_name == strategy_name
        ]
    }
