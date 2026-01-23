"""
Data Exploration Example.

Demonstrates how to:
- Analyze market data distributions
- Identify patterns and anomalies
- Validate data quality
- Generate statistical summaries

Usage:
    python data_exploration.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from datetime import datetime, timedelta
from collections import Counter
import math

# Data generation
from data.sample_data_generator import SampleDataGenerator

# Validation
from engine.data_ingestion.validation import DataValidator, validate_data_quality

# Features
from engine.feature_engineering import FeatureExtractor, TechnicalIndicators


def calculate_statistics(values):
    """Calculate basic statistics for a list of values."""
    if not values:
        return {}

    n = len(values)
    mean = sum(values) / n
    variance = sum((x - mean) ** 2 for x in values) / n
    std_dev = math.sqrt(variance)

    sorted_values = sorted(values)
    median = sorted_values[n // 2] if n % 2 else (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2

    return {
        'count': n,
        'mean': mean,
        'std_dev': std_dev,
        'min': min(values),
        'max': max(values),
        'median': median,
        'q25': sorted_values[int(n * 0.25)],
        'q75': sorted_values[int(n * 0.75)]
    }


def main():
    print("\n" + "=" * 70)
    print("DATA EXPLORATION EXAMPLE")
    print("=" * 70)
    print("\nThis example demonstrates data analysis capabilities.\n")

    # Generate sample data
    print("-" * 50)
    print("Step 1: Generating Sample Data")
    print("-" * 50)

    generator = SampleDataGenerator(seed=42)
    snapshots, order_books, histories = generator.generate_market_batch(
        num_markets=100,
        history_hours=168  # 1 week
    )

    print(f"Generated {len(snapshots)} market snapshots")
    print(f"Generated {len(order_books)} order books")
    print(f"Generated {len(histories)} price histories")

    # Price distribution analysis
    print("\n" + "-" * 50)
    print("Step 2: Price Distribution Analysis")
    print("-" * 50)

    prices = [s.yes_price for s in snapshots if s.yes_price is not None]
    price_stats = calculate_statistics(prices)

    print(f"\nYES Price Distribution:")
    print(f"  Count: {price_stats['count']}")
    print(f"  Mean: {price_stats['mean']:.2%}")
    print(f"  Std Dev: {price_stats['std_dev']:.2%}")
    print(f"  Min: {price_stats['min']:.2%}")
    print(f"  25th Percentile: {price_stats['q25']:.2%}")
    print(f"  Median: {price_stats['median']:.2%}")
    print(f"  75th Percentile: {price_stats['q75']:.2%}")
    print(f"  Max: {price_stats['max']:.2%}")

    # Price buckets
    buckets = {'0-10%': 0, '10-30%': 0, '30-50%': 0, '50-70%': 0, '70-90%': 0, '90-100%': 0}
    for p in prices:
        if p < 0.1:
            buckets['0-10%'] += 1
        elif p < 0.3:
            buckets['10-30%'] += 1
        elif p < 0.5:
            buckets['30-50%'] += 1
        elif p < 0.7:
            buckets['50-70%'] += 1
        elif p < 0.9:
            buckets['70-90%'] += 1
        else:
            buckets['90-100%'] += 1

    print(f"\nPrice Distribution Buckets:")
    for bucket, count in buckets.items():
        bar = '█' * int(count / len(prices) * 40)
        print(f"  {bucket:<10}: {bar} ({count}, {count/len(prices):.1%})")

    # Liquidity analysis
    print("\n" + "-" * 50)
    print("Step 3: Liquidity Analysis")
    print("-" * 50)

    liquidity_values = [s.liquidity for s in snapshots if s.liquidity is not None]
    liq_stats = calculate_statistics(liquidity_values)

    print(f"\nLiquidity Distribution:")
    print(f"  Mean: ${liq_stats['mean']:,.0f}")
    print(f"  Median: ${liq_stats['median']:,.0f}")
    print(f"  Std Dev: ${liq_stats['std_dev']:,.0f}")
    print(f"  Min: ${liq_stats['min']:,.0f}")
    print(f"  Max: ${liq_stats['max']:,.0f}")

    # Classify by liquidity
    low_liq = sum(1 for l in liquidity_values if l < 1000)
    med_liq = sum(1 for l in liquidity_values if 1000 <= l < 10000)
    high_liq = sum(1 for l in liquidity_values if l >= 10000)

    print(f"\nLiquidity Classification:")
    print(f"  Low (<$1,000): {low_liq} markets ({low_liq/len(liquidity_values):.1%})")
    print(f"  Medium ($1K-$10K): {med_liq} markets ({med_liq/len(liquidity_values):.1%})")
    print(f"  High (>$10K): {high_liq} markets ({high_liq/len(liquidity_values):.1%})")

    # Spread analysis
    print("\n" + "-" * 50)
    print("Step 4: Spread Analysis")
    print("-" * 50)

    spreads = [s.spread for s in snapshots if s.spread is not None and s.spread > 0]
    if spreads:
        spread_stats = calculate_statistics(spreads)

        print(f"\nBid-Ask Spread Distribution:")
        print(f"  Mean: {spread_stats['mean']:.2%}")
        print(f"  Median: {spread_stats['median']:.2%}")
        print(f"  Min: {spread_stats['min']:.2%}")
        print(f"  Max: {spread_stats['max']:.2%}")

        # Wide spreads (potential opportunity)
        wide_spreads = sum(1 for s in spreads if s > 0.05)
        print(f"\n  Markets with spread > 5%: {wide_spreads} ({wide_spreads/len(spreads):.1%})")
        print(f"  (Wide spreads may indicate edge opportunities)")

    # Time to resolution analysis
    print("\n" + "-" * 50)
    print("Step 5: Time to Resolution Analysis")
    print("-" * 50)

    ttrs = [s.hours_to_resolution for s in snapshots
            if s.hours_to_resolution is not None and s.hours_to_resolution > 0]

    if ttrs:
        ttr_stats = calculate_statistics(ttrs)

        print(f"\nHours to Resolution:")
        print(f"  Mean: {ttr_stats['mean']:.0f} hours ({ttr_stats['mean']/24:.1f} days)")
        print(f"  Median: {ttr_stats['median']:.0f} hours ({ttr_stats['median']/24:.1f} days)")
        print(f"  Min: {ttr_stats['min']:.0f} hours")
        print(f"  Max: {ttr_stats['max']:.0f} hours")

        # Time buckets
        imminent = sum(1 for t in ttrs if t < 24)
        short_term = sum(1 for t in ttrs if 24 <= t < 168)
        medium_term = sum(1 for t in ttrs if 168 <= t < 720)
        long_term = sum(1 for t in ttrs if t >= 720)

        print(f"\nResolution Timeline:")
        print(f"  <24h (Imminent): {imminent} ({imminent/len(ttrs):.1%})")
        print(f"  1-7 days (Short): {short_term} ({short_term/len(ttrs):.1%})")
        print(f"  1-4 weeks (Medium): {medium_term} ({medium_term/len(ttrs):.1%})")
        print(f"  >4 weeks (Long): {long_term} ({long_term/len(ttrs):.1%})")

    # Price volatility analysis
    print("\n" + "-" * 50)
    print("Step 6: Volatility Analysis")
    print("-" * 50)

    volatilities = []
    for market_id, history in histories.items():
        if history.volatility:
            volatilities.append(history.volatility)

    if volatilities:
        vol_stats = calculate_statistics(volatilities)

        print(f"\nPrice Volatility (Std Dev of Returns):")
        print(f"  Mean: {vol_stats['mean']:.4f}")
        print(f"  Median: {vol_stats['median']:.4f}")
        print(f"  Min: {vol_stats['min']:.4f}")
        print(f"  Max: {vol_stats['max']:.4f}")

        high_vol = sum(1 for v in volatilities if v > 0.05)
        print(f"\n  High volatility markets (>5%): {high_vol} ({high_vol/len(volatilities):.1%})")

    # Order book analysis
    print("\n" + "-" * 50)
    print("Step 7: Order Book Analysis")
    print("-" * 50)

    imbalances = []
    for market_id, ob in order_books.items():
        if ob.imbalance is not None:
            imbalances.append(ob.imbalance)

    if imbalances:
        imb_stats = calculate_statistics(imbalances)

        print(f"\nOrder Book Imbalance:")
        print(f"  Mean: {imb_stats['mean']:.3f}")
        print(f"  Std Dev: {imb_stats['std_dev']:.3f}")

        bid_heavy = sum(1 for i in imbalances if i > 0.2)
        ask_heavy = sum(1 for i in imbalances if i < -0.2)
        balanced = len(imbalances) - bid_heavy - ask_heavy

        print(f"\n  Bid-heavy (>0.2): {bid_heavy} ({bid_heavy/len(imbalances):.1%})")
        print(f"  Balanced: {balanced} ({balanced/len(imbalances):.1%})")
        print(f"  Ask-heavy (<-0.2): {ask_heavy} ({ask_heavy/len(imbalances):.1%})")

    # Data quality validation
    print("\n" + "-" * 50)
    print("Step 8: Data Quality Validation")
    print("-" * 50)

    report = validate_data_quality(snapshots, list(order_books.values()))

    print(f"\nData Quality Report:")
    print(f"  Markets Validated: {report.markets_validated}")
    print(f"  Total Issues: {report.total_issues}")

    # Count by severity
    severity_counts = {'info': 0, 'warning': 0, 'error': 0, 'critical': 0}
    for result in report.results:
        for issue in result.issues:
            severity_counts[issue.severity.value] += 1

    print(f"\nIssues by Severity:")
    for severity, count in severity_counts.items():
        status = "✓" if count == 0 else "⚠" if severity in ['info', 'warning'] else "✗"
        print(f"  {status} {severity.title()}: {count}")

    # Technical indicator examples
    print("\n" + "-" * 50)
    print("Step 9: Technical Indicator Samples")
    print("-" * 50)

    # Pick a market with good history
    sample_history = list(histories.values())[0]
    prices_list = sample_history.prices[-30:]  # Last 30 data points

    if len(prices_list) >= 20:
        # Calculate indicators
        sma_10 = TechnicalIndicators.sma(prices_list, period=10)
        rsi = TechnicalIndicators.rsi(prices_list, period=14)

        print(f"\nSample Market Technical Indicators (last 30 periods):")
        print(f"  Current Price: {prices_list[-1]:.2%}")
        print(f"  SMA(10): {sma_10[-1]:.2%}")
        print(f"  Price vs SMA: {'Above' if prices_list[-1] > sma_10[-1] else 'Below'}")

        if rsi:
            print(f"  RSI(14): {rsi[-1]:.1f}")
            rsi_signal = (
                "Overbought (>70)" if rsi[-1] > 70 else
                "Oversold (<30)" if rsi[-1] < 30 else
                "Neutral"
            )
            print(f"  RSI Signal: {rsi_signal}")

    # Pattern identification
    print("\n" + "-" * 50)
    print("Step 10: Pattern Identification")
    print("-" * 50)

    # Find markets with specific patterns
    extreme_longshots = [s for s in snapshots if s.yes_price and s.yes_price < 0.10]
    extreme_favorites = [s for s in snapshots if s.yes_price and s.yes_price > 0.90]
    coin_flips = [s for s in snapshots if s.yes_price and 0.45 <= s.yes_price <= 0.55]

    print(f"\nMarket Patterns Detected:")
    print(f"  Extreme Longshots (<10%): {len(extreme_longshots)}")
    print(f"  Extreme Favorites (>90%): {len(extreme_favorites)}")
    print(f"  Coin Flips (45-55%): {len(coin_flips)}")

    # Low liquidity + wide spread (opportunity candidates)
    opportunity_candidates = [
        s for s in snapshots
        if s.liquidity and s.spread
        and s.liquidity < 2000 and s.spread > 0.05
    ]
    print(f"  Low Liquidity + Wide Spread: {len(opportunity_candidates)}")

    print("\n" + "=" * 70)
    print("Data Exploration Complete!")
    print("=" * 70)
    print("\nKey Observations:")
    print("1. Price distribution shows market characteristics")
    print("2. Liquidity varies significantly across markets")
    print("3. Wide spreads present potential opportunities")
    print("4. Order book imbalances may signal directional pressure")
    print("5. Data quality is crucial for accurate analysis")
    print("\nUse these insights to refine strategy parameters.\n")


if __name__ == "__main__":
    main()
