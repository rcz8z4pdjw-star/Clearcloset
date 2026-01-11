#!/usr/bin/env python3
"""
Prediction Market Research Platform

Main entry point for running the research platform.

This platform is for RESEARCH PURPOSES ONLY.
No automated trading is performed.
All trading decisions must be made manually.

Usage:
    python main.py collect        # Collect market data
    python main.py analyze        # Run all strategies and generate signals
    python main.py report         # Generate opportunity report
    python main.py backtest       # Run backtests
    python main.py full           # Full pipeline (collect → analyze → report)

For help:
    python main.py --help
"""

import sys
import argparse
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from engine.data_ingestion import get_database, MarketSource
from engine.data_ingestion.polymarket_collector import PolymarketCollector
from engine.data_ingestion.kalshi_collector import KalshiCollector
from engine.signal_generation import SignalEngine
from engine.opportunity_scoring import OpportunityScorer
from engine.backtesting import BacktestEngine, BacktestConfig
from output import ReportGenerator
from strategies.structural_edges import LateResolutionStrategy, LiquidityVacuumStrategy
from strategies.behavioral_edges import FavoriteLongshotBiasStrategy
from utils.logging_setup import setup_logging, get_logger
from utils.config_loader import load_config


def print_banner():
    """Print welcome banner."""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║             PREDICTION MARKET RESEARCH PLATFORM v1.0                         ║
║                                                                              ║
║                     FOR RESEARCH PURPOSES ONLY                               ║
║                  No automated trading is performed                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


def collect_data(args):
    """Collect market data from configured sources."""
    logger = get_logger("main")
    logger.info("Starting data collection...")

    db = get_database()

    # Collect from Polymarket
    if not args.kalshi_only:
        logger.info("Collecting from Polymarket...")
        poly_collector = PolymarketCollector(db=db)
        try:
            snapshots, order_books = poly_collector.collect_all_snapshots(
                max_markets=args.max_markets,
                include_order_books=True
            )
            logger.info(f"Polymarket: {len(snapshots)} markets collected")
        except Exception as e:
            logger.error(f"Polymarket collection failed: {e}")

    # Collect from Kalshi
    if not args.polymarket_only:
        logger.info("Collecting from Kalshi...")
        kalshi_collector = KalshiCollector(db=db)
        try:
            snapshots, order_books = kalshi_collector.collect_all_snapshots(
                max_markets=args.max_markets,
                include_order_books=True
            )
            logger.info(f"Kalshi: {len(snapshots)} markets collected")
        except Exception as e:
            logger.error(f"Kalshi collection failed: {e}")

    logger.info("Data collection complete")


def analyze_markets(args):
    """Run strategies and generate signals."""
    logger = get_logger("main")
    logger.info("Starting market analysis...")

    db = get_database()
    engine = SignalEngine(db=db)

    # Determine source filter
    source = None
    if args.polymarket_only:
        source = MarketSource.POLYMARKET
    elif args.kalshi_only:
        source = MarketSource.KALSHI

    # Generate signals
    batch = engine.generate_signals(source=source, save_to_db=True)

    logger.info(f"Analysis complete: {batch.total_signals} signals generated")
    logger.info(f"Signals by strategy: {batch.signals_by_strategy}")

    if batch.errors:
        logger.warning(f"{len(batch.errors)} errors occurred during analysis")

    return batch


def generate_report(args, signals=None):
    """Generate opportunity report."""
    logger = get_logger("main")
    logger.info("Generating opportunity report...")

    db = get_database()

    # Load signals if not provided
    if signals is None:
        from engine.signal_generation.engine import SignalEngine
        engine = SignalEngine(db=db)

        source = None
        if args.polymarket_only:
            source = MarketSource.POLYMARKET
        elif args.kalshi_only:
            source = MarketSource.KALSHI

        batch = engine.generate_signals(source=source, save_to_db=False)
        signal_results = batch.signals
    else:
        signal_results = signals.signals

    # Load market snapshots
    markets = {}
    for market in db.get_active_markets():
        markets[market.market_id] = market

    # Score and rank opportunities
    scorer = OpportunityScorer(db=db)
    opportunities = scorer.score_opportunities(
        signals=signal_results,
        markets=markets,
        top_n=args.top_n
    )

    # Generate report
    generator = ReportGenerator()
    report_path = generator.generate_daily_opportunity_report(opportunities)

    # Export CSV
    csv_path = generator.export_opportunities_csv(opportunities)

    logger.info(f"Report generated: {report_path}")
    logger.info(f"CSV export: {csv_path}")

    # Print top 5 to console
    print("\n" + "=" * 80)
    print("TOP 5 OPPORTUNITIES")
    print("=" * 80)

    for opp in opportunities[:5]:
        print(f"\n#{opp.rank}: {opp.market_name[:60]}")
        print(f"   Score: {opp.composite_score:.3f} | EV: {opp.expected_value:+.1%} | "
              f"Confidence: {opp.confidence:.0%}")
        print(f"   Side: {opp.suggested_side.upper()} | Price: {opp.current_price:.1%} | "
              f"Liquidity: ${opp.liquidity:,.0f}")

    print("\n" + "=" * 80)
    print(f"Full report: {report_path}")
    print("=" * 80 + "\n")

    return opportunities


def run_backtest(args):
    """Run strategy backtests."""
    logger = get_logger("main")
    logger.info("Starting backtests...")

    # Create backtest config
    config = BacktestConfig.from_config(
        start_date=args.start_date,
        end_date=args.end_date
    )

    engine = BacktestEngine(config=config)

    # Run backtests for key strategies
    strategies = [
        LateResolutionStrategy(),
        FavoriteLongshotBiasStrategy(),
        LiquidityVacuumStrategy(),
    ]

    generator = ReportGenerator()

    for strategy in strategies:
        logger.info(f"Backtesting {strategy.name}...")
        result = engine.run_backtest(strategy)

        # Generate report
        report_path = generator.generate_strategy_performance_report(result)
        logger.info(f"Backtest report: {report_path}")

        # Print summary
        print(f"\n{strategy.name}:")
        print(f"  Trades: {result.total_trades} | Win Rate: {result.win_rate:.1%}")
        print(f"  Return: {result.total_return:+.2%} | Sharpe: {result.sharpe_ratio:.2f}")


def run_full_pipeline(args):
    """Run full pipeline: collect → analyze → report."""
    logger = get_logger("main")
    logger.info("Running full pipeline...")

    # Step 1: Collect data
    collect_data(args)

    # Step 2: Analyze markets
    signals = analyze_markets(args)

    # Step 3: Generate report
    generate_report(args, signals)

    logger.info("Full pipeline complete")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Prediction Market Research Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py collect                    # Collect market data
  python main.py analyze                    # Generate signals
  python main.py report                     # Generate opportunity report
  python main.py full                       # Run full pipeline
  python main.py backtest --start 2024-01-01

DISCLAIMER: This platform is for research purposes only.
No automated trading is performed.
        """
    )

    parser.add_argument(
        'command',
        choices=['collect', 'analyze', 'report', 'backtest', 'full'],
        help='Command to run'
    )

    parser.add_argument(
        '--max-markets', type=int, default=200,
        help='Maximum markets to collect (default: 200)'
    )
    parser.add_argument(
        '--top-n', type=int, default=50,
        help='Number of top opportunities to report (default: 50)'
    )
    parser.add_argument(
        '--polymarket-only', action='store_true',
        help='Only use Polymarket data'
    )
    parser.add_argument(
        '--kalshi-only', action='store_true',
        help='Only use Kalshi data'
    )
    parser.add_argument(
        '--start-date', type=str, default='2024-01-01',
        help='Backtest start date (default: 2024-01-01)'
    )
    parser.add_argument(
        '--end-date', type=str, default=None,
        help='Backtest end date (default: today)'
    )
    parser.add_argument(
        '--verbose', '-v', action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Setup
    print_banner()
    load_config()
    setup_logging(
        level="DEBUG" if args.verbose else "INFO",
        log_file="logs/platform.log"
    )

    # Route command
    if args.command == 'collect':
        collect_data(args)
    elif args.command == 'analyze':
        analyze_markets(args)
    elif args.command == 'report':
        generate_report(args)
    elif args.command == 'backtest':
        run_backtest(args)
    elif args.command == 'full':
        run_full_pipeline(args)

    print("\n✓ Complete. See output/ for reports and exports.")


if __name__ == "__main__":
    main()
