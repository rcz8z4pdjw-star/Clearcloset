"""
Getting Started Example.

This script demonstrates basic usage of the Prediction Market Research Platform.
Run this to verify your installation and see core features.

Usage:
    python getting_started.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from datetime import datetime, timedelta

# Data generation
from data.sample_data_generator import SampleDataGenerator

# Core engine components
from engine.signal_generation import SignalEngine
from engine.opportunity_scoring import OpportunityScorer
from engine.feature_engineering import FeatureExtractor

# Strategies
from strategies.structural_edges import LateResolutionStrategy, LiquidityVacuumStrategy
from strategies.behavioral_edges import FavoriteLongshotBiasStrategy

# Output
from output import ReportGenerator


def main():
    print("\n" + "=" * 70)
    print("PREDICTION MARKET RESEARCH PLATFORM - Getting Started")
    print("=" * 70)
    print("\nThis example demonstrates core platform capabilities.")
    print("NOTE: For RESEARCH purposes only. No automated trading.\n")

    # Step 1: Generate sample data
    print("-" * 50)
    print("Step 1: Generating Sample Market Data")
    print("-" * 50)

    generator = SampleDataGenerator(seed=42)
    snapshots, order_books, histories = generator.generate_market_batch(
        num_markets=20,
        history_hours=72
    )

    print(f"Generated {len(snapshots)} market snapshots")
    print(f"Generated {len(order_books)} order books")
    print(f"Generated {len(histories)} price histories")

    # Show sample market
    sample = snapshots[0]
    print(f"\nSample Market:")
    print(f"  ID: {sample.market_id}")
    print(f"  Question: {sample.question[:50]}...")
    print(f"  Price: {sample.yes_price:.2%}")
    print(f"  Liquidity: ${sample.liquidity:,.0f}")

    # Step 2: Extract features
    print("\n" + "-" * 50)
    print("Step 2: Feature Extraction")
    print("-" * 50)

    extractor = FeatureExtractor()
    features = extractor.extract(
        snapshots[0],
        order_book=order_books.get(snapshots[0].market_id),
        price_history=histories.get(snapshots[0].market_id)
    )

    print(f"Extracted features for {sample.market_id}:")
    print(f"  Price: {features.price:.2%}")
    print(f"  Spread: {features.spread:.4f}" if features.spread else "  Spread: N/A")
    print(f"  Liquidity Score: {features.liquidity_score:.2f}")
    print(f"  Volatility: {features.volatility:.4f}" if features.volatility else "  Volatility: N/A")

    # Step 3: Run individual strategies
    print("\n" + "-" * 50)
    print("Step 3: Running Individual Strategies")
    print("-" * 50)

    strategies = [
        LateResolutionStrategy(),
        LiquidityVacuumStrategy(),
        FavoriteLongshotBiasStrategy()
    ]

    for strategy in strategies:
        print(f"\n{strategy.name.upper()}")
        print(f"  Category: {strategy.category}")

        signals_found = 0
        for snapshot in snapshots:
            ob = order_books.get(snapshot.market_id)
            history = histories.get(snapshot.market_id)

            result = strategy.analyze(
                snapshot,
                order_book=ob,
                price_history=history
            )

            if result and abs(result.signal_strength) > 0.3:
                signals_found += 1
                if signals_found == 1:  # Show first signal
                    print(f"  Sample Signal:")
                    print(f"    Market: {result.market_name[:40]}...")
                    print(f"    Direction: {result.direction.value}")
                    print(f"    Strength: {result.signal_strength:.2f}")
                    print(f"    Expected Value: {result.expected_value:+.2%}")

        print(f"  Total signals generated: {signals_found}")

    # Step 4: Generate signals using engine
    print("\n" + "-" * 50)
    print("Step 4: Running Signal Engine (All Strategies)")
    print("-" * 50)

    engine = SignalEngine()
    print(f"Available strategies: {', '.join(engine.get_available_strategies())}")

    # Create a mapping for the engine
    market_map = {s.market_id: s for s in snapshots}

    # Run all strategies on our sample data
    all_signals = []
    for snapshot in snapshots:
        ob = order_books.get(snapshot.market_id)
        history = histories.get(snapshot.market_id)

        for strategy in engine.strategies.values():
            result = strategy.analyze(snapshot, order_book=ob, price_history=history)
            if result:
                all_signals.append(result)

    print(f"Total signals generated: {len(all_signals)}")

    # Group by strategy
    by_strategy = {}
    for sig in all_signals:
        by_strategy[sig.strategy_name] = by_strategy.get(sig.strategy_name, 0) + 1

    print("Signals by strategy:")
    for name, count in sorted(by_strategy.items(), key=lambda x: -x[1]):
        print(f"  {name}: {count}")

    # Step 5: Score and rank opportunities
    print("\n" + "-" * 50)
    print("Step 5: Scoring and Ranking Opportunities")
    print("-" * 50)

    scorer = OpportunityScorer()
    opportunities = scorer.score_opportunities(
        signals=all_signals,
        markets=market_map,
        top_n=10
    )

    print(f"Top {len(opportunities)} opportunities:\n")
    print(f"{'Rank':<5} {'Score':<8} {'EV':<8} {'Market':<40}")
    print("-" * 65)

    for opp in opportunities[:5]:
        print(f"{opp.rank:<5} {opp.composite_score:<8.3f} {opp.expected_value:+.2%}   {opp.market_name[:40]}")

    # Step 6: Show best opportunity details
    if opportunities:
        print("\n" + "-" * 50)
        print("Step 6: Top Opportunity Details")
        print("-" * 50)

        best = opportunities[0]
        print(f"\nMarket: {best.market_name}")
        print(f"Score: {best.composite_score:.3f}")
        print(f"Expected Value: {best.expected_value:+.2%}")
        print(f"Confidence: {best.confidence:.0%}")
        print(f"Suggested Side: {best.suggested_side.upper()}")
        print(f"Suggested Size: {best.suggested_size:.1%} of capital")
        print(f"\nKey Factors:")
        for factor in best.key_factors[:3]:
            print(f"  - {factor}")
        print(f"\nRisks:")
        for risk in best.risks[:3]:
            print(f"  - {risk}")

    print("\n" + "=" * 70)
    print("Example Complete!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Run `python main.py collect` to fetch real market data")
    print("2. Run `python main.py analyze` to generate signals")
    print("3. Run `python main.py report` to create opportunity reports")
    print("4. See other examples in research/examples/ for advanced usage")
    print("\nREMEMBER: This platform is for RESEARCH only.")
    print("All trading decisions must be made manually.\n")


if __name__ == "__main__":
    main()
