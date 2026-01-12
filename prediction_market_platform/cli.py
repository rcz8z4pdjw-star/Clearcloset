#!/usr/bin/env python3
"""
Prediction Market Research Platform - Command Line Interface

Unified CLI for all platform functionality:
- Run live data collection and analysis
- Start the web dashboard
- Execute backtests
- Manage data and configuration
- Run tests and diagnostics

Usage:
    python cli.py <command> [options]

Examples:
    python cli.py live              # Run live data collection
    python cli.py dashboard         # Start web dashboard
    python cli.py backtest          # Run backtesting engine
    python cli.py collect           # One-time data collection
    python cli.py status            # Check platform status
    python cli.py test              # Run test suite
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime, timezone

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import validators
from utils.validators import CLIValidator


def cmd_live(args):
    """Run live data collection and analysis."""
    from run_live import run_live_platform

    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           PREDICTION MARKET RESEARCH PLATFORM - LIVE MODE                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    run_live_platform(
        interval=args.interval,
        single_run=args.once,
        enable_social=not args.no_social,
        enable_news=not args.no_news
    )


def cmd_dashboard(args):
    """Start the web dashboard."""
    from web.app import run_dashboard

    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           PREDICTION MARKET RESEARCH PLATFORM - WEB DASHBOARD                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    run_dashboard(
        host=args.host,
        port=args.port,
        debug=args.debug
    )


def cmd_backtest(args):
    """Run backtesting engine."""
    from engine.backtesting import BacktestEngine
    from strategies import get_all_strategies

    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           PREDICTION MARKET RESEARCH PLATFORM - BACKTESTING                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    engine = BacktestEngine()
    strategies = get_all_strategies()

    print(f"Running backtest with {len(strategies)} strategies...")
    print(f"  Date range: {args.start_date} to {args.end_date}")
    print(f"  Initial capital: ${args.capital:,.2f}")
    print()

    results = engine.run_backtest(
        strategies=strategies,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.capital
    )

    print("\n=== Backtest Results ===")
    print(f"Total Return: {results.get('total_return', 0):.2%}")
    print(f"Sharpe Ratio: {results.get('sharpe_ratio', 0):.3f}")
    print(f"Max Drawdown: {results.get('max_drawdown', 0):.2%}")
    print(f"Win Rate: {results.get('win_rate', 0):.1%}")
    print(f"Total Trades: {results.get('total_trades', 0)}")


def cmd_collect(args):
    """Run one-time data collection."""
    from engine.data_ingestion import PolymarketCollector, KalshiCollector, get_database

    print("Starting data collection...")

    db = get_database()
    markets_collected = 0

    if not args.kalshi_only:
        print("\n[1/2] Collecting from Polymarket...")
        try:
            collector = PolymarketCollector()
            markets = collector.collect_active_markets()
            for market in markets:
                db.save_market(market)
            markets_collected += len(markets)
            print(f"  Collected {len(markets)} markets from Polymarket")
        except Exception as e:
            print(f"  Error collecting from Polymarket: {e}")

    if not args.polymarket_only:
        print("\n[2/2] Collecting from Kalshi...")
        try:
            collector = KalshiCollector()
            markets = collector.collect_active_markets()
            for market in markets:
                db.save_market(market)
            markets_collected += len(markets)
            print(f"  Collected {len(markets)} markets from Kalshi")
        except Exception as e:
            print(f"  Error collecting from Kalshi: {e}")

    print(f"\nTotal markets collected: {markets_collected}")


def cmd_status(args):
    """Check platform status and health."""
    from engine.data_ingestion import get_database
    from engine.signal_generation import SignalEngine
    from strategies import get_all_strategies

    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                        PLATFORM STATUS CHECK                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    # Database status
    print("Database:")
    db = get_database()
    print(f"  Status: OK")
    print(f"  Path: {db.db_path}")

    # Get market counts
    try:
        markets = db.get_all_markets()
        print(f"  Markets stored: {len(markets)}")
    except Exception as e:
        print(f"  Markets stored: Unknown (error: {e})")

    # Strategies
    print("\nStrategies:")
    strategies = get_all_strategies()
    print(f"  Loaded: {len(strategies)}")
    for name, strategy in strategies.items():
        print(f"    - {name}")

    # Signal Engine
    print("\nSignal Engine:")
    engine = SignalEngine()
    print(f"  Status: OK")
    print(f"  Active strategies: {len(engine.strategies)}")

    # Web Dashboard
    print("\nWeb Dashboard:")
    try:
        import flask
        print(f"  Flask version: {flask.__version__}")
        print(f"  Status: Available")
    except ImportError:
        print(f"  Status: Flask not installed")

    # Social Sentiment
    print("\nSocial Sentiment:")
    try:
        from engine.social import create_social_feed
        feed = create_social_feed()
        print(f"  Status: OK")
    except Exception as e:
        print(f"  Status: Error - {e}")

    # News Collector
    print("\nNews Collector:")
    try:
        from engine.news import create_news_aggregator
        news = create_news_aggregator()
        print(f"  Status: OK")
    except Exception as e:
        print(f"  Status: Error - {e}")

    print("\n" + "=" * 60)
    print("Platform is operational")


def cmd_test(args):
    """Run the test suite."""
    import subprocess

    print("Running test suite...\n")

    test_args = ['python', '-m', 'pytest', 'tests/', '-v']

    if args.coverage:
        test_args.extend(['--cov=.', '--cov-report=term-missing'])

    if args.fast:
        test_args.append('-x')  # Stop on first failure

    result = subprocess.run(test_args, cwd=str(PROJECT_ROOT))
    sys.exit(result.returncode)


def cmd_analyze(args):
    """Analyze a specific market."""
    from engine.data_ingestion import get_database
    from engine.signal_generation import SignalEngine
    from engine.opportunity_scoring import OpportunityScorer

    print(f"Analyzing market: {args.market_id}\n")

    db = get_database()

    # Get market data
    market = db.get_market(args.market_id)
    if not market:
        print(f"Market not found: {args.market_id}")
        return

    print(f"Market: {market.title}")
    print(f"Source: {market.source.value}")
    print(f"Category: {market.category}")
    print(f"Current Price: {market.yes_price:.1%}")
    print(f"Volume: ${market.volume_24h:,.0f}")
    print()

    # Generate signals
    engine = SignalEngine()
    signals = engine.analyze_market(market)

    print("=== Signal Analysis ===")
    for signal in signals:
        print(f"\n{signal.strategy_name}:")
        print(f"  Direction: {signal.direction}")
        print(f"  Strength: {signal.strength:.2f}")
        print(f"  Confidence: {signal.confidence:.1%}")
        print(f"  Expected Value: {signal.expected_value:.1%}")

    # Score opportunity
    scorer = OpportunityScorer()
    score = scorer.score_market(market, signals)

    print(f"\n=== Opportunity Score ===")
    print(f"Composite Score: {score.composite_score:.3f}")
    print(f"Suggested Action: {score.suggested_side}")


def cmd_kelly(args):
    """Calculate Kelly criterion position size."""
    from engine.portfolio import kelly_fraction, optimal_kelly_bet

    print("=== Kelly Criterion Calculator ===\n")

    if args.market_price:
        bet_amount, side = optimal_kelly_bet(
            bankroll=args.bankroll,
            win_prob=args.probability,
            current_price=args.market_price,
            kelly_multiplier=args.fraction
        )

        print(f"Bankroll: ${args.bankroll:,.2f}")
        print(f"Win Probability: {args.probability:.1%}")
        print(f"Market Price: {args.market_price:.1%}")
        print(f"Kelly Fraction: {args.fraction:.0%}")
        print()
        print(f"Suggested Side: {side}")
        print(f"Bet Amount: ${bet_amount:,.2f}")
        print(f"Bet % of Bankroll: {bet_amount/args.bankroll:.1%}")
    else:
        # Simple Kelly with odds
        odds = 1 / args.probability - 1 if args.probability < 1 else 0
        full_kelly = kelly_fraction(args.probability, odds)
        adjusted = full_kelly * args.fraction

        print(f"Win Probability: {args.probability:.1%}")
        print(f"Implied Odds: {odds:.2f}:1")
        print()
        print(f"Full Kelly: {full_kelly:.1%}")
        print(f"Adjusted Kelly ({args.fraction:.0%}): {adjusted:.1%}")
        print(f"Bet Amount: ${args.bankroll * adjusted:,.2f}")


def cmd_export(args):
    """Export data to various formats."""
    from engine.data_ingestion import get_database
    import json

    print(f"Exporting data to {args.output}...")

    db = get_database()
    data = {}

    if args.markets or args.all:
        markets = db.get_all_markets()
        data['markets'] = [m.to_dict() for m in markets]
        print(f"  Exported {len(markets)} markets")

    if args.signals or args.all:
        signals = db.get_signals()
        data['signals'] = [s.to_dict() for s in signals]
        print(f"  Exported {len(signals)} signals")

    if args.opportunities or args.all:
        opps = db.get_recent_opportunities(limit=1000)
        data['opportunities'] = [o.to_dict() for o in opps]
        print(f"  Exported {len(opps)} opportunities")

    # Write output
    output_path = Path(args.output)
    if args.format == 'json':
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    elif args.format == 'csv':
        # Export each type to separate CSV
        try:
            import pandas as pd
            for key, items in data.items():
                if items:
                    df = pd.DataFrame(items)
                    csv_path = output_path.with_name(f"{output_path.stem}_{key}.csv")
                    df.to_csv(csv_path, index=False)
                    print(f"  Written to {csv_path}")
        except ImportError:
            print("  CSV export requires pandas. Install with: pip install pandas")

    print(f"\nExport complete: {args.output}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Prediction Market Research Platform CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  live       Run live data collection and analysis
  dashboard  Start the web dashboard
  backtest   Run backtesting engine
  collect    One-time data collection
  status     Check platform status
  test       Run test suite
  analyze    Analyze a specific market
  kelly      Kelly criterion calculator
  export     Export data to file

Examples:
  %(prog)s live --interval 300
  %(prog)s dashboard --port 8080
  %(prog)s analyze MARKET_ID
  %(prog)s kelly -p 0.65 -b 10000
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Live command
    live_parser = subparsers.add_parser('live', help='Run live data collection')
    live_parser.add_argument('-i', '--interval', type=int, default=300,
                            help='Refresh interval in seconds (default: 300)')
    live_parser.add_argument('--once', action='store_true',
                            help='Run once and exit')
    live_parser.add_argument('--no-social', action='store_true',
                            help='Disable social sentiment collection')
    live_parser.add_argument('--no-news', action='store_true',
                            help='Disable news collection')

    # Dashboard command
    dash_parser = subparsers.add_parser('dashboard', help='Start web dashboard')
    dash_parser.add_argument('--host', default='0.0.0.0',
                            help='Host to bind to (default: 0.0.0.0)')
    dash_parser.add_argument('--port', type=int, default=5000,
                            help='Port to listen on (default: 5000)')
    dash_parser.add_argument('--debug', action='store_true',
                            help='Enable debug mode')

    # Backtest command
    bt_parser = subparsers.add_parser('backtest', help='Run backtesting')
    bt_parser.add_argument('--start-date', default='2024-01-01',
                          help='Start date (YYYY-MM-DD)')
    bt_parser.add_argument('--end-date', default='2024-12-31',
                          help='End date (YYYY-MM-DD)')
    bt_parser.add_argument('--capital', type=float, default=10000,
                          help='Initial capital (default: 10000)')

    # Collect command
    collect_parser = subparsers.add_parser('collect', help='Collect market data')
    collect_parser.add_argument('--polymarket-only', action='store_true',
                               help='Only collect from Polymarket')
    collect_parser.add_argument('--kalshi-only', action='store_true',
                               help='Only collect from Kalshi')

    # Status command
    subparsers.add_parser('status', help='Check platform status')

    # Test command
    test_parser = subparsers.add_parser('test', help='Run test suite')
    test_parser.add_argument('--coverage', action='store_true',
                            help='Generate coverage report')
    test_parser.add_argument('--fast', action='store_true',
                            help='Stop on first failure')

    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze a market')
    analyze_parser.add_argument('market_id', help='Market ID to analyze')

    # Kelly command
    kelly_parser = subparsers.add_parser('kelly', help='Kelly criterion calculator')
    kelly_parser.add_argument('-p', '--probability', type=float, required=True,
                             help='Win probability (0-1)')
    kelly_parser.add_argument('-b', '--bankroll', type=float, default=10000,
                             help='Bankroll amount (default: 10000)')
    kelly_parser.add_argument('-m', '--market-price', type=float,
                             help='Current market price (for PM-specific calc)')
    kelly_parser.add_argument('-f', '--fraction', type=float, default=0.25,
                             help='Kelly fraction to use (default: 0.25)')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export data')
    export_parser.add_argument('-o', '--output', default='export.json',
                              help='Output file path')
    export_parser.add_argument('--format', choices=['json', 'csv'], default='json',
                              help='Output format')
    export_parser.add_argument('--markets', action='store_true',
                              help='Export markets')
    export_parser.add_argument('--signals', action='store_true',
                              help='Export signals')
    export_parser.add_argument('--opportunities', action='store_true',
                              help='Export opportunities')
    export_parser.add_argument('--all', action='store_true',
                              help='Export everything')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Dispatch to command handler
    commands = {
        'live': cmd_live,
        'dashboard': cmd_dashboard,
        'backtest': cmd_backtest,
        'collect': cmd_collect,
        'status': cmd_status,
        'test': cmd_test,
        'analyze': cmd_analyze,
        'kelly': cmd_kelly,
        'export': cmd_export,
    }

    handler = commands.get(args.command)
    if handler:
        # Validate arguments
        validator = CLIValidator()
        validation_map = {
            'backtest': validator.validate_backtest_args,
            'kelly': validator.validate_kelly_args,
            'analyze': validator.validate_analyze_args,
            'export': validator.validate_export_args,
            'live': validator.validate_live_args,
        }

        if args.command in validation_map:
            if not validation_map[args.command](args):
                print(validator.get_error_message())
                sys.exit(1)

        try:
            handler(args)
        except KeyboardInterrupt:
            print("\n\nInterrupted by user")
            sys.exit(0)
        except Exception as e:
            print(f"\nError: {e}")
            if args.command == 'live':
                import traceback
                traceback.print_exc()
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
