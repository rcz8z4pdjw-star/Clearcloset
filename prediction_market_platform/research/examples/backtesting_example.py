"""
Backtesting Example.

Demonstrates how to:
- Run strategy backtests
- Analyze performance metrics
- Compare multiple strategies
- Generate backtest reports

Usage:
    python backtesting_example.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from datetime import datetime, timedelta

# Data generation
from data.sample_data_generator import SampleDataGenerator

# Backtesting
from engine.backtesting import BacktestEngine, BacktestConfig

# Strategies
from strategies.structural_edges import (
    LateResolutionStrategy,
    LiquidityVacuumStrategy,
    SpreadExploitationStrategy
)
from strategies.behavioral_edges import (
    FavoriteLongshotBiasStrategy,
    OverreactionStrategy
)

# Analysis
from research.strategy_analysis import StrategyAnalyzer, generate_strategy_report


def main():
    print("\n" + "=" * 70)
    print("BACKTESTING EXAMPLE")
    print("=" * 70)
    print("\nThis example demonstrates strategy backtesting capabilities.\n")

    # Configuration
    print("-" * 50)
    print("Step 1: Configuring Backtest")
    print("-" * 50)

    config = BacktestConfig(
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 12, 31),
        initial_capital=10000.0,
        max_position_size=0.10,  # 10% max per position
        commission_rate=0.01,  # 1% commission
        slippage_model="proportional",
        slippage_factor=0.005
    )

    print(f"Period: {config.start_date.date()} to {config.end_date.date()}")
    print(f"Initial Capital: ${config.initial_capital:,.0f}")
    print(f"Max Position Size: {config.max_position_size:.0%}")
    print(f"Commission Rate: {config.commission_rate:.0%}")

    # Generate sample historical data
    print("\n" + "-" * 50)
    print("Step 2: Generating Historical Data")
    print("-" * 50)

    generator = SampleDataGenerator(seed=123)

    # Generate a year's worth of market evolution
    all_snapshots = []
    for month in range(1, 13):
        snapshots, _, _ = generator.generate_market_batch(
            num_markets=50,
            history_hours=720  # 30 days
        )
        # Backdate to appropriate month
        month_start = datetime(2024, month, 1)
        for snapshot in snapshots:
            snapshot.timestamp = month_start
            all_snapshots.append(snapshot)

    print(f"Generated {len(all_snapshots)} historical snapshots")

    # Initialize backtesting engine
    print("\n" + "-" * 50)
    print("Step 3: Running Backtests")
    print("-" * 50)

    engine = BacktestEngine(config=config)

    strategies = [
        ("Late Resolution", LateResolutionStrategy()),
        ("Liquidity Vacuum", LiquidityVacuumStrategy()),
        ("Favorite-Longshot Bias", FavoriteLongshotBiasStrategy()),
        ("Spread Exploitation", SpreadExploitationStrategy()),
        ("Overreaction", OverreactionStrategy())
    ]

    results = []

    for name, strategy in strategies:
        print(f"\nBacktesting: {name}")
        result = engine.run_backtest(strategy)
        results.append(result)

        print(f"  Trades: {result.total_trades}")
        print(f"  Win Rate: {result.win_rate:.1%}")
        print(f"  Total Return: {result.total_return:+.2%}")
        print(f"  Sharpe Ratio: {result.sharpe_ratio:.2f}")
        print(f"  Max Drawdown: {result.max_drawdown:.2%}")
        print(f"  Brier Score: {result.brier_score:.4f}")

    # Performance comparison
    print("\n" + "-" * 50)
    print("Step 4: Performance Comparison")
    print("-" * 50)

    print(f"\n{'Strategy':<25} {'Return':<10} {'Sharpe':<8} {'Win Rate':<10} {'MaxDD':<10} {'Brier':<8}")
    print("-" * 75)

    for result in sorted(results, key=lambda x: -x.sharpe_ratio):
        print(f"{result.strategy_name:<25} "
              f"{result.total_return:+.2%}    "
              f"{result.sharpe_ratio:<8.2f} "
              f"{result.win_rate:<10.1%} "
              f"{result.max_drawdown:<10.2%} "
              f"{result.brier_score:<8.4f}")

    # Head-to-head comparison
    print("\n" + "-" * 50)
    print("Step 5: Strategy Analysis")
    print("-" * 50)

    analyzer = StrategyAnalyzer()

    if len(results) >= 2:
        # Compare top two strategies by Sharpe
        sorted_results = sorted(results, key=lambda x: -x.sharpe_ratio)
        comparison = analyzer.compare_strategies(sorted_results[0], sorted_results[1])

        print(f"\nHead-to-Head: {comparison.strategy_a} vs {comparison.strategy_b}")
        print(f"  Better Strategy: {comparison.better_strategy}")
        print(f"  Confidence: {comparison.confidence:.0%}")
        print(f"  Return Difference: {comparison.return_diff:+.2%}")
        print(f"  Sharpe Difference: {comparison.sharpe_diff:+.2f}")
        print(f"  Correlation: {comparison.correlation:.2f}")
        print(f"\nAnalysis: {comparison.analysis}")

    # Strategy correlations
    print("\n" + "-" * 50)
    print("Step 6: Strategy Correlations")
    print("-" * 50)

    correlations = analyzer.calculate_strategy_correlation(results)

    print("\nReturn Correlations:")
    for (strat_a, strat_b), corr in sorted(correlations.items(), key=lambda x: -x[1]):
        interpretation = (
            "highly correlated" if corr > 0.7 else
            "moderately correlated" if corr > 0.4 else
            "uncorrelated (good for diversification)"
        )
        print(f"  {strat_a[:20]:<20} vs {strat_b[:20]:<20}: {corr:.2f} ({interpretation})")

    # Generate full report
    print("\n" + "-" * 50)
    print("Step 7: Generating Report")
    print("-" * 50)

    report = generate_strategy_report(results)
    print("\nStrategy Comparison Report Preview:")
    print("-" * 40)
    # Print first 30 lines of report
    for line in report.split('\n')[:30]:
        print(line)
    print("...")

    # Key insights
    print("\n" + "-" * 50)
    print("KEY INSIGHTS")
    print("-" * 50)

    best_return = max(results, key=lambda x: x.total_return)
    best_sharpe = max(results, key=lambda x: x.sharpe_ratio)
    best_calibration = min(results, key=lambda x: x.brier_score)
    lowest_drawdown = min(results, key=lambda x: x.max_drawdown)

    print(f"\n1. Best Total Return: {best_return.strategy_name}")
    print(f"   Return: {best_return.total_return:+.2%}")

    print(f"\n2. Best Risk-Adjusted Return: {best_sharpe.strategy_name}")
    print(f"   Sharpe Ratio: {best_sharpe.sharpe_ratio:.2f}")

    print(f"\n3. Best Calibration: {best_calibration.strategy_name}")
    print(f"   Brier Score: {best_calibration.brier_score:.4f}")

    print(f"\n4. Lowest Risk: {lowest_drawdown.strategy_name}")
    print(f"   Max Drawdown: {lowest_drawdown.max_drawdown:.2%}")

    # Portfolio suggestion
    print("\n" + "-" * 50)
    print("PORTFOLIO SUGGESTION")
    print("-" * 50)

    # Find uncorrelated strategies
    uncorrelated_pairs = [
        (a, b, c) for (a, b), c in correlations.items()
        if c < 0.4
    ]

    if uncorrelated_pairs:
        print("\nLow-correlation strategy pairs for diversification:")
        for strat_a, strat_b, corr in sorted(uncorrelated_pairs, key=lambda x: x[2])[:3]:
            print(f"  - {strat_a} + {strat_b} (correlation: {corr:.2f})")
    else:
        print("\nAll strategies show moderate-to-high correlation.")
        print("Consider using the single best risk-adjusted strategy.")

    print("\n" + "=" * 70)
    print("Backtesting Example Complete!")
    print("=" * 70)
    print("\nNOTE: These results are based on simulated data.")
    print("Real market performance may differ significantly.")
    print("Always validate strategies on live data before trading.\n")


if __name__ == "__main__":
    main()
