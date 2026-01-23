"""
Strategy Analysis and Comparison Tools.

Provides tools for:
- Head-to-head strategy comparison
- Performance attribution
- Signal quality analysis
- Edge decay analysis
- Strategy correlation
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import math

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.data_ingestion.models import BacktestResult, BacktestTrade, Signal
from strategies.base import Strategy, StrategyResult
from utils.helpers import brier_score, calibration_error


@dataclass
class StrategyComparison:
    """Results of comparing two strategies."""
    strategy_a: str
    strategy_b: str

    # Performance comparison
    return_diff: float  # A - B
    sharpe_diff: float
    win_rate_diff: float

    # Statistical tests
    outperformance_pct: float  # % of periods A beat B
    correlation: float  # Correlation of returns

    # Recommendation
    better_strategy: str
    confidence: float
    analysis: str


@dataclass
class SignalQualityMetrics:
    """Quality metrics for a strategy's signals."""
    strategy_name: str

    # Accuracy metrics
    hit_rate: float  # Correct direction
    brier_score: float
    calibration_error: float

    # Signal characteristics
    avg_confidence: float
    avg_expected_value: float
    signal_count: int

    # Timing metrics
    avg_time_to_resolution: float
    early_signal_hit_rate: float  # Signals > 24h before resolution
    late_signal_hit_rate: float   # Signals < 24h before resolution

    # Edge metrics
    realized_ev: float  # Actual EV achieved
    ev_capture_rate: float  # realized_ev / predicted_ev


class StrategyAnalyzer:
    """
    Analyzes and compares strategy performance.

    Provides insights into:
    - Which strategies perform best
    - How strategies correlate
    - Signal quality and timing
    - Edge persistence over time
    """

    def compare_strategies(
        self,
        result_a: BacktestResult,
        result_b: BacktestResult
    ) -> StrategyComparison:
        """
        Compare two strategies head-to-head.

        Args:
            result_a: First strategy results
            result_b: Second strategy results

        Returns:
            StrategyComparison with detailed analysis
        """
        # Calculate differences
        return_diff = result_a.total_return - result_b.total_return
        sharpe_diff = result_a.sharpe_ratio - result_b.sharpe_ratio
        win_rate_diff = result_a.win_rate - result_b.win_rate

        # Calculate period-by-period comparison
        outperformance = self._calculate_outperformance(
            result_a.equity_curve,
            result_b.equity_curve
        )

        # Calculate return correlation
        correlation = self._calculate_correlation(
            self._equity_to_returns(result_a.equity_curve),
            self._equity_to_returns(result_b.equity_curve)
        )

        # Determine better strategy
        score_a = 0
        score_b = 0

        if result_a.total_return > result_b.total_return:
            score_a += 1
        else:
            score_b += 1

        if result_a.sharpe_ratio > result_b.sharpe_ratio:
            score_a += 2  # Weight risk-adjusted return higher
        else:
            score_b += 2

        if result_a.max_drawdown < result_b.max_drawdown:
            score_a += 1
        else:
            score_b += 1

        if result_a.brier_score < result_b.brier_score:
            score_a += 1
        else:
            score_b += 1

        better = result_a.strategy_name if score_a > score_b else result_b.strategy_name
        confidence = abs(score_a - score_b) / 5.0

        # Generate analysis
        analysis = self._generate_comparison_analysis(
            result_a, result_b,
            return_diff, sharpe_diff, win_rate_diff,
            outperformance, correlation
        )

        return StrategyComparison(
            strategy_a=result_a.strategy_name,
            strategy_b=result_b.strategy_name,
            return_diff=return_diff,
            sharpe_diff=sharpe_diff,
            win_rate_diff=win_rate_diff,
            outperformance_pct=outperformance,
            correlation=correlation,
            better_strategy=better,
            confidence=confidence,
            analysis=analysis
        )

    def analyze_signal_quality(
        self,
        signals: List[StrategyResult],
        outcomes: Dict[str, int]  # market_id -> 0 or 1
    ) -> SignalQualityMetrics:
        """
        Analyze quality of strategy signals.

        Args:
            signals: List of strategy signals
            outcomes: Actual outcomes by market_id

        Returns:
            SignalQualityMetrics
        """
        if not signals:
            return SignalQualityMetrics(
                strategy_name="unknown",
                hit_rate=0, brier_score=0, calibration_error=0,
                avg_confidence=0, avg_expected_value=0, signal_count=0,
                avg_time_to_resolution=0, early_signal_hit_rate=0,
                late_signal_hit_rate=0, realized_ev=0, ev_capture_rate=0
            )

        strategy_name = signals[0].strategy_name

        # Calculate accuracy metrics
        predictions = []
        actuals = []
        correct_direction = 0
        total_predicted_ev = 0
        total_realized_ev = 0

        early_correct = 0
        early_total = 0
        late_correct = 0
        late_total = 0

        times_to_resolution = []

        for signal in signals:
            if signal.market_id not in outcomes:
                continue

            outcome = outcomes[signal.market_id]
            predicted_prob = signal.probability_estimate

            predictions.append(predicted_prob)
            actuals.append(outcome)

            # Direction accuracy
            predicted_direction = 1 if predicted_prob > 0.5 else 0
            if predicted_direction == outcome:
                correct_direction += 1

            # EV tracking
            total_predicted_ev += signal.expected_value

            # Calculate realized EV
            # If we predicted YES (prob > 0.5) and outcome was YES (1), we won
            if predicted_prob > signal.market_probability:
                # We thought YES was underpriced
                if outcome == 1:
                    # Correct - we would have made money
                    realized = (1 / signal.market_probability) - 1
                else:
                    realized = -1
            else:
                # We thought NO was underpriced
                if outcome == 0:
                    realized = (1 / (1 - signal.market_probability)) - 1
                else:
                    realized = -1

            total_realized_ev += realized

            # Timing analysis
            hours = signal.time_horizon_hours
            if hours:
                times_to_resolution.append(hours)
                if hours > 24:
                    early_total += 1
                    if predicted_direction == outcome:
                        early_correct += 1
                else:
                    late_total += 1
                    if predicted_direction == outcome:
                        late_correct += 1

        # Calculate metrics
        hit_rate = correct_direction / len(predictions) if predictions else 0
        bs = brier_score(predictions, actuals) if predictions else 0
        cal_err = calibration_error(predictions, actuals) if predictions else 0

        avg_confidence = sum(s.confidence for s in signals) / len(signals)
        avg_ev = sum(s.expected_value for s in signals) / len(signals)
        avg_time = sum(times_to_resolution) / len(times_to_resolution) if times_to_resolution else 0

        early_hit = early_correct / early_total if early_total > 0 else 0
        late_hit = late_correct / late_total if late_total > 0 else 0

        realized_ev = total_realized_ev / len(predictions) if predictions else 0
        ev_capture = realized_ev / avg_ev if avg_ev > 0 else 0

        return SignalQualityMetrics(
            strategy_name=strategy_name,
            hit_rate=hit_rate,
            brier_score=bs,
            calibration_error=cal_err,
            avg_confidence=avg_confidence,
            avg_expected_value=avg_ev,
            signal_count=len(signals),
            avg_time_to_resolution=avg_time,
            early_signal_hit_rate=early_hit,
            late_signal_hit_rate=late_hit,
            realized_ev=realized_ev,
            ev_capture_rate=ev_capture
        )

    def analyze_edge_decay(
        self,
        signals: List[StrategyResult],
        outcomes: Dict[str, int],
        time_buckets: List[int] = [6, 12, 24, 48, 72, 168]
    ) -> Dict[int, float]:
        """
        Analyze how edge varies with time to resolution.

        Args:
            signals: Strategy signals
            outcomes: Actual outcomes
            time_buckets: Hours before resolution to analyze

        Returns:
            Dictionary mapping hours to hit rate
        """
        bucket_results = {h: [] for h in time_buckets}

        for signal in signals:
            if signal.market_id not in outcomes:
                continue

            hours = signal.time_horizon_hours
            if hours is None:
                continue

            outcome = outcomes[signal.market_id]
            predicted_direction = 1 if signal.probability_estimate > 0.5 else 0
            correct = 1 if predicted_direction == outcome else 0

            # Find appropriate bucket
            for bucket in sorted(time_buckets):
                if hours <= bucket:
                    bucket_results[bucket].append(correct)
                    break

        # Calculate hit rate per bucket
        return {
            h: sum(results) / len(results) if results else 0
            for h, results in bucket_results.items()
        }

    def calculate_strategy_correlation(
        self,
        results: List[BacktestResult]
    ) -> Dict[Tuple[str, str], float]:
        """
        Calculate correlation between strategy returns.

        Args:
            results: List of backtest results

        Returns:
            Dictionary of (strategy_a, strategy_b) -> correlation
        """
        correlations = {}

        for i, result_a in enumerate(results):
            for result_b in results[i + 1:]:
                returns_a = self._equity_to_returns(result_a.equity_curve)
                returns_b = self._equity_to_returns(result_b.equity_curve)

                # Align lengths
                min_len = min(len(returns_a), len(returns_b))
                returns_a = returns_a[:min_len]
                returns_b = returns_b[:min_len]

                corr = self._calculate_correlation(returns_a, returns_b)

                key = (result_a.strategy_name, result_b.strategy_name)
                correlations[key] = corr

        return correlations

    def _calculate_outperformance(
        self,
        equity_a: List[float],
        equity_b: List[float]
    ) -> float:
        """Calculate % of periods A outperformed B."""
        min_len = min(len(equity_a), len(equity_b))
        if min_len < 2:
            return 0.5

        outperform_count = 0
        for i in range(1, min_len):
            return_a = (equity_a[i] - equity_a[i - 1]) / equity_a[i - 1] if equity_a[i - 1] > 0 else 0
            return_b = (equity_b[i] - equity_b[i - 1]) / equity_b[i - 1] if equity_b[i - 1] > 0 else 0
            if return_a > return_b:
                outperform_count += 1

        return outperform_count / (min_len - 1)

    def _equity_to_returns(self, equity: List[float]) -> List[float]:
        """Convert equity curve to returns."""
        returns = []
        for i in range(1, len(equity)):
            if equity[i - 1] > 0:
                returns.append((equity[i] - equity[i - 1]) / equity[i - 1])
            else:
                returns.append(0)
        return returns

    def _calculate_correlation(
        self,
        x: List[float],
        y: List[float]
    ) -> float:
        """Calculate Pearson correlation."""
        n = min(len(x), len(y))
        if n < 2:
            return 0

        x = x[:n]
        y = y[:n]

        mean_x = sum(x) / n
        mean_y = sum(y) / n

        numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        var_x = sum((xi - mean_x) ** 2 for xi in x)
        var_y = sum((yi - mean_y) ** 2 for yi in y)

        denominator = math.sqrt(var_x * var_y)
        if denominator == 0:
            return 0

        return numerator / denominator

    def _generate_comparison_analysis(
        self,
        result_a: BacktestResult,
        result_b: BacktestResult,
        return_diff: float,
        sharpe_diff: float,
        win_rate_diff: float,
        outperformance: float,
        correlation: float
    ) -> str:
        """Generate human-readable comparison analysis."""
        lines = []

        # Return comparison
        if abs(return_diff) < 0.01:
            lines.append(f"Returns are similar ({result_a.total_return:.1%} vs {result_b.total_return:.1%}).")
        elif return_diff > 0:
            lines.append(f"{result_a.strategy_name} outperforms on raw return by {return_diff:.1%}.")
        else:
            lines.append(f"{result_b.strategy_name} outperforms on raw return by {-return_diff:.1%}.")

        # Risk-adjusted comparison
        if abs(sharpe_diff) < 0.2:
            lines.append("Risk-adjusted returns (Sharpe) are comparable.")
        elif sharpe_diff > 0:
            lines.append(f"{result_a.strategy_name} has better risk-adjusted return (Sharpe diff: +{sharpe_diff:.2f}).")
        else:
            lines.append(f"{result_b.strategy_name} has better risk-adjusted return (Sharpe diff: {sharpe_diff:.2f}).")

        # Correlation insight
        if correlation > 0.7:
            lines.append(f"Strategies are highly correlated ({correlation:.2f}) - similar signals.")
        elif correlation < 0.3:
            lines.append(f"Strategies are uncorrelated ({correlation:.2f}) - good for diversification.")
        else:
            lines.append(f"Moderate correlation ({correlation:.2f}) - some diversification benefit.")

        # Calibration comparison
        if result_a.brier_score < result_b.brier_score:
            lines.append(f"{result_a.strategy_name} has better calibration (Brier: {result_a.brier_score:.4f} vs {result_b.brier_score:.4f}).")
        else:
            lines.append(f"{result_b.strategy_name} has better calibration (Brier: {result_b.brier_score:.4f} vs {result_a.brier_score:.4f}).")

        return " ".join(lines)


def generate_strategy_report(
    results: List[BacktestResult],
    output_path: Optional[str] = None
) -> str:
    """
    Generate comprehensive strategy comparison report.

    Args:
        results: List of backtest results
        output_path: Optional output path

    Returns:
        Markdown report string
    """
    analyzer = StrategyAnalyzer()

    lines = [
        "# Strategy Comparison Report",
        f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        "",
        "## Performance Summary",
        "",
        "| Strategy | Return | Sharpe | Win Rate | Max DD | Brier |",
        "|----------|--------|--------|----------|--------|-------|",
    ]

    for r in sorted(results, key=lambda x: -x.total_return):
        lines.append(
            f"| {r.strategy_name} | {r.total_return:+.2%} | {r.sharpe_ratio:.2f} | "
            f"{r.win_rate:.1%} | {r.max_drawdown:.1%} | {r.brier_score:.4f} |"
        )

    # Head-to-head comparisons
    if len(results) >= 2:
        lines.extend([
            "",
            "## Head-to-Head Comparisons",
            "",
        ])

        for i, result_a in enumerate(results):
            for result_b in results[i + 1:]:
                comparison = analyzer.compare_strategies(result_a, result_b)
                lines.extend([
                    f"### {result_a.strategy_name} vs {result_b.strategy_name}",
                    "",
                    f"**Winner:** {comparison.better_strategy} (confidence: {comparison.confidence:.0%})",
                    "",
                    comparison.analysis,
                    "",
                ])

    # Correlation matrix
    if len(results) >= 2:
        correlations = analyzer.calculate_strategy_correlation(results)
        lines.extend([
            "## Strategy Correlations",
            "",
        ])
        for (a, b), corr in correlations.items():
            lines.append(f"- {a} vs {b}: {corr:.2f}")

    report = "\n".join(lines)

    if output_path:
        with open(output_path, 'w') as f:
            f.write(report)

    return report
