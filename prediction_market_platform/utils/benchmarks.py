"""
Performance Benchmarking Utilities.

Provides tools for measuring and tracking performance of platform components.

Usage:
    from utils.benchmarks import benchmark, run_all_benchmarks

    @benchmark
    def my_function():
        ...

    # Or run all benchmarks
    python -m utils.benchmarks
"""

import time
import statistics
import functools
from datetime import datetime
from typing import Callable, List, Dict, Any, Optional
from dataclasses import dataclass, field
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class BenchmarkResult:
    """Result of a benchmark run."""
    name: str
    iterations: int
    total_time: float
    avg_time: float
    min_time: float
    max_time: float
    std_dev: float
    ops_per_second: float
    timestamp: datetime = field(default_factory=lambda: datetime.now())

    def to_dict(self) -> dict:
        return {
            'name': self.name,
            'iterations': self.iterations,
            'total_time_ms': round(self.total_time * 1000, 3),
            'avg_time_ms': round(self.avg_time * 1000, 3),
            'min_time_ms': round(self.min_time * 1000, 3),
            'max_time_ms': round(self.max_time * 1000, 3),
            'std_dev_ms': round(self.std_dev * 1000, 3),
            'ops_per_second': round(self.ops_per_second, 2),
            'timestamp': self.timestamp.isoformat()
        }


def benchmark(func: Callable = None, iterations: int = 100, warmup: int = 5):
    """
    Decorator to benchmark a function.

    Args:
        func: Function to benchmark
        iterations: Number of iterations to run
        warmup: Number of warmup iterations

    Usage:
        @benchmark
        def my_function():
            ...

        @benchmark(iterations=1000)
        def my_fast_function():
            ...
    """
    def decorator(fn: Callable):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)

        # Store benchmark metadata
        wrapper._benchmark = True
        wrapper._iterations = iterations
        wrapper._warmup = warmup
        return wrapper

    if func is not None:
        return decorator(func)
    return decorator


def run_benchmark(
    func: Callable,
    iterations: int = 100,
    warmup: int = 5,
    args: tuple = (),
    kwargs: dict = None
) -> BenchmarkResult:
    """
    Run a benchmark on a function.

    Args:
        func: Function to benchmark
        iterations: Number of iterations
        warmup: Warmup iterations (not counted)
        args: Positional arguments for function
        kwargs: Keyword arguments for function

    Returns:
        BenchmarkResult with timing statistics
    """
    kwargs = kwargs or {}

    # Warmup
    for _ in range(warmup):
        func(*args, **kwargs)

    # Timed runs
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        func(*args, **kwargs)
        end = time.perf_counter()
        times.append(end - start)

    total_time = sum(times)
    avg_time = statistics.mean(times)
    min_time = min(times)
    max_time = max(times)
    std_dev = statistics.stdev(times) if len(times) > 1 else 0
    ops_per_sec = iterations / total_time if total_time > 0 else 0

    return BenchmarkResult(
        name=func.__name__,
        iterations=iterations,
        total_time=total_time,
        avg_time=avg_time,
        min_time=min_time,
        max_time=max_time,
        std_dev=std_dev,
        ops_per_second=ops_per_sec
    )


class BenchmarkSuite:
    """
    Collection of benchmarks to run together.

    Usage:
        suite = BenchmarkSuite("My Benchmarks")

        @suite.add
        def benchmark_something():
            ...

        results = suite.run()
    """

    def __init__(self, name: str):
        self.name = name
        self.benchmarks: List[Dict[str, Any]] = []

    def add(
        self,
        func: Callable = None,
        iterations: int = 100,
        warmup: int = 5
    ):
        """Add a benchmark to the suite."""
        def decorator(fn: Callable):
            self.benchmarks.append({
                'func': fn,
                'iterations': iterations,
                'warmup': warmup,
                'args': (),
                'kwargs': {}
            })
            return fn

        if func is not None:
            return decorator(func)
        return decorator

    def run(self, verbose: bool = True) -> List[BenchmarkResult]:
        """Run all benchmarks in the suite."""
        if verbose:
            print(f"\n{'='*60}")
            print(f" Benchmark Suite: {self.name}")
            print(f"{'='*60}\n")

        results = []
        for bench in self.benchmarks:
            if verbose:
                print(f"Running: {bench['func'].__name__}...", end=" ", flush=True)

            result = run_benchmark(
                bench['func'],
                iterations=bench['iterations'],
                warmup=bench['warmup'],
                args=bench['args'],
                kwargs=bench['kwargs']
            )
            results.append(result)

            if verbose:
                print(f"{result.avg_time*1000:.3f}ms avg ({result.ops_per_second:.0f} ops/s)")

        if verbose:
            print(f"\n{'='*60}")
            self._print_summary(results)

        return results

    def _print_summary(self, results: List[BenchmarkResult]):
        """Print summary of benchmark results."""
        print("\nSummary:")
        print(f"{'Benchmark':<40} {'Avg (ms)':<12} {'Min (ms)':<12} {'Ops/s':<12}")
        print("-" * 76)
        for r in results:
            print(f"{r.name:<40} {r.avg_time*1000:<12.3f} {r.min_time*1000:<12.3f} {r.ops_per_second:<12.0f}")


# ==============================================================================
# PLATFORM BENCHMARKS
# ==============================================================================

platform_benchmarks = BenchmarkSuite("Platform Performance")


@platform_benchmarks.add(iterations=100)
def benchmark_signal_generation():
    """Benchmark signal generation for a single market."""
    from engine.signal_generation import SignalEngine
    from engine.data_ingestion.models import MarketSnapshot, MarketSource, MarketStatus, OutcomeResult
    from datetime import datetime, timezone

    # Create sample market
    market = MarketSnapshot(
        market_id="benchmark_market",
        source=MarketSource.POLYMARKET,
        timestamp=datetime.now(timezone.utc),
        question="Benchmark market question?",
        yes_price=0.65,
        no_price=0.35,
        volume_24h=10000,
        liquidity=50000,
        status=MarketStatus.ACTIVE,
        outcome=OutcomeResult.PENDING
    )

    engine = SignalEngine()
    engine.analyze_market(market)


@platform_benchmarks.add(iterations=50)
def benchmark_opportunity_scoring():
    """Benchmark opportunity scoring."""
    from engine.opportunity_scoring import OpportunityScorer
    from engine.data_ingestion.models import MarketSnapshot, MarketSource, MarketStatus, OutcomeResult
    from engine.signal_generation.models import StrategyResult
    from datetime import datetime, timezone

    market = MarketSnapshot(
        market_id="benchmark_market",
        source=MarketSource.POLYMARKET,
        timestamp=datetime.now(timezone.utc),
        question="Benchmark market?",
        yes_price=0.65,
        no_price=0.35,
        volume_24h=10000,
        liquidity=50000,
        status=MarketStatus.ACTIVE,
        outcome=OutcomeResult.PENDING
    )

    signals = [
        StrategyResult(
            strategy_name="test_strategy",
            market_id="benchmark_market",
            timestamp=datetime.now(timezone.utc),
            direction="BUY",
            strength=0.7,
            confidence=0.8,
            expected_value=0.05
        )
    ]

    scorer = OpportunityScorer()
    scorer.score_market(market, signals)


@platform_benchmarks.add(iterations=1000)
def benchmark_kelly_calculation():
    """Benchmark Kelly criterion calculation."""
    from engine.portfolio import kelly_fraction, optimal_kelly_bet

    kelly_fraction(0.6, 1.5)
    optimal_kelly_bet(10000, 0.6, 0.5, 0.25)


@platform_benchmarks.add(iterations=50)
def benchmark_database_write():
    """Benchmark database write operations."""
    from engine.data_ingestion import get_database
    from engine.data_ingestion.models import MarketSnapshot, MarketSource, MarketStatus, OutcomeResult
    from datetime import datetime, timezone
    import tempfile
    import os

    # Use temp database
    temp_dir = tempfile.mkdtemp()
    os.environ['DATABASE_PATH'] = f"{temp_dir}/bench.db"

    db = get_database()

    market = MarketSnapshot(
        market_id=f"bench_{time.time()}",
        source=MarketSource.POLYMARKET,
        timestamp=datetime.now(timezone.utc),
        question="Benchmark market?",
        yes_price=0.65,
        no_price=0.35,
        status=MarketStatus.ACTIVE,
        outcome=OutcomeResult.PENDING
    )

    db.save_snapshot(market)


@platform_benchmarks.add(iterations=100)
def benchmark_database_read():
    """Benchmark database read operations."""
    from engine.data_ingestion import get_database

    db = get_database()
    db.get_active_markets()


@platform_benchmarks.add(iterations=20)
def benchmark_strategy_all():
    """Benchmark running all strategies."""
    from strategies import get_all_strategies
    from engine.data_ingestion.models import MarketSnapshot, MarketSource, MarketStatus, OutcomeResult
    from datetime import datetime, timezone

    market = MarketSnapshot(
        market_id="benchmark_market",
        source=MarketSource.POLYMARKET,
        timestamp=datetime.now(timezone.utc),
        question="Benchmark market?",
        yes_price=0.65,
        no_price=0.35,
        volume_24h=10000,
        liquidity=50000,
        spread=0.02,
        status=MarketStatus.ACTIVE,
        outcome=OutcomeResult.PENDING
    )

    strategies = get_all_strategies()
    for name, strategy in strategies.items():
        try:
            strategy.analyze(market)
        except Exception:
            pass  # Some strategies may fail without full data


def run_all_benchmarks(output_file: Optional[str] = None) -> List[BenchmarkResult]:
    """
    Run all platform benchmarks.

    Args:
        output_file: Optional JSON file to save results

    Returns:
        List of benchmark results
    """
    results = platform_benchmarks.run(verbose=True)

    if output_file:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump([r.to_dict() for r in results], f, indent=2)
        print(f"\nResults saved to: {output_file}")

    return results


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Run platform benchmarks')
    parser.add_argument('-o', '--output', help='Output JSON file for results')
    args = parser.parse_args()

    run_all_benchmarks(output_file=args.output)
