#!/usr/bin/env python3
"""
Live Data Runner.

This script runs the full prediction market research pipeline with real data:
1. Collects live data from Polymarket and Kalshi
2. Runs all edge detection strategies
3. Scores and ranks opportunities
4. Optionally executes trades (with confirmation)

Usage:
    python run_live.py                    # Research mode only
    python run_live.py --trading          # Enable trading mode (dry run)
    python run_live.py --trading --live   # Enable live trading (REAL MONEY!)

IMPORTANT: Live trading uses real money. Start with --dry-run mode first.
"""

import sys
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from engine.data_ingestion import get_database, MarketSource
from engine.data_ingestion.polymarket_collector import PolymarketCollector
from engine.data_ingestion.kalshi_collector import KalshiCollector
from engine.signal_generation import SignalEngine
from engine.opportunity_scoring import OpportunityScorer
from engine.opportunity_scoring.advanced_scorer import AdvancedOpportunityScorer
from engine.algorithms import (
    LiveDataValidator,
    ArbitrageDetector,
    MarketCorrelationAnalyzer,
    MarketClusterer
)
from engine.alerts import create_default_alert_manager
from engine.social import (
    SocialFeed,
    RedditCollector,
    TwitterCollector,
    SocialPost,
    SocialSource,
    create_social_feed,
)
from output import ReportGenerator

from utils.logging_setup import setup_logging, get_logger
from utils.config_loader import load_config


def print_banner():
    """Print welcome banner."""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║             PREDICTION MARKET RESEARCH PLATFORM v1.0                         ║
║                         LIVE DATA RUNNER                                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


def collect_live_data(db, sources: list, max_markets: int = 100) -> dict:
    """
    Collect live data from specified sources.

    Args:
        db: Database instance
        sources: List of sources to collect from
        max_markets: Max markets per source

    Returns:
        Dictionary with collected data
    """
    logger = get_logger("live_runner")
    results = {
        'polymarket': {'snapshots': [], 'order_books': []},
        'kalshi': {'snapshots': [], 'order_books': []}
    }

    if 'polymarket' in sources:
        logger.info("Collecting from Polymarket...")
        print("\n📊 Collecting Polymarket data...")

        try:
            collector = PolymarketCollector(db=db)
            snapshots, order_books = collector.collect_all_snapshots(
                max_markets=max_markets,
                include_order_books=True
            )
            results['polymarket']['snapshots'] = snapshots
            results['polymarket']['order_books'] = order_books
            print(f"   ✓ {len(snapshots)} markets, {len(order_books)} order books")
        except Exception as e:
            logger.error(f"Polymarket collection failed: {e}")
            print(f"   ✗ Failed: {e}")

    if 'kalshi' in sources:
        logger.info("Collecting from Kalshi...")
        print("\n📊 Collecting Kalshi data...")

        try:
            collector = KalshiCollector(db=db)
            snapshots, order_books = collector.collect_all_snapshots(
                max_markets=max_markets,
                include_order_books=True
            )
            results['kalshi']['snapshots'] = snapshots
            results['kalshi']['order_books'] = order_books
            print(f"   ✓ {len(snapshots)} markets, {len(order_books)} order books")
        except Exception as e:
            logger.error(f"Kalshi collection failed: {e}")
            print(f"   ✗ Failed: {e}")

    total_snapshots = len(results['polymarket']['snapshots']) + len(results['kalshi']['snapshots'])
    print(f"\n📈 Total: {total_snapshots} market snapshots collected")

    return results


def collect_social_data(market_questions: Dict[str, str]) -> SocialFeed:
    """
    Collect social sentiment data from X and Reddit.

    Args:
        market_questions: Dict mapping market_id to question text

    Returns:
        SocialFeed with collected data
    """
    logger = get_logger("live_runner")
    print("\n📱 Collecting social sentiment data...")

    feed = create_social_feed()
    feed.set_known_markets(market_questions)

    # Collect from Reddit
    print("   Scanning Reddit...")
    try:
        reddit = RedditCollector()
        reddit_posts = list(reddit.collect_all_subreddits(sort='new', limit_per_sub=25))

        # Convert to SocialPost format
        for post_data in reddit_posts:
            post = feed.process_reddit_post(
                post_data,
                post_data.get('_subreddit', 'unknown')
            )
            feed.ingest_posts([post])

        print(f"   ✓ Reddit: {len(reddit_posts)} posts")
    except Exception as e:
        logger.error(f"Reddit collection failed: {e}")
        print(f"   ✗ Reddit failed: {e}")

    # Collect from Twitter/X
    print("   Scanning X (Twitter)...")
    try:
        twitter = TwitterCollector()
        tweets = list(twitter.collect_all())

        # Convert to SocialPost format
        for tweet_data in tweets:
            post = feed.process_twitter_post(tweet_data)
            feed.ingest_posts([post])

        print(f"   ✓ Twitter: {len(tweets)} tweets")
    except Exception as e:
        logger.error(f"Twitter collection failed: {e}")
        print(f"   ✗ Twitter failed: {e}")

    # Get feed summary
    summary = feed.get_feed_summary()
    print(f"   📊 Total posts tracked: {summary['total_posts_tracked']}")
    print(f"   📊 Topics: {summary['topics_tracked']}")

    return feed


def display_social_sentiment(feed: SocialFeed, snapshots: list):
    """
    Display social sentiment analysis for markets.

    Args:
        feed: SocialFeed with collected data
        snapshots: Market snapshots to analyze
    """
    print("\n" + "=" * 80)
    print("SOCIAL SENTIMENT ANALYSIS")
    print("=" * 80)

    # Get trending topics
    trending = feed.aggregator.get_trending_topics(min_posts=3)

    if trending:
        print("\n🔥 TRENDING TOPICS:")
        for topic, mention in trending[:5]:
            sentiment_emoji = "🟢" if mention.avg_sentiment > 0.2 else "🔴" if mention.avg_sentiment < -0.2 else "⚪"
            print(f"   {sentiment_emoji} {topic}: {mention.total_posts} posts, sentiment: {mention.avg_sentiment:+.2f}")
            if mention.is_trending:
                print(f"      📈 Volume up {mention.volume_change_1h:.1f}x in last hour")

    # Get signals for top markets
    print("\n📊 MARKET SENTIMENT SIGNALS:")

    signals_generated = 0
    for snapshot in snapshots[:10]:
        signal = feed.get_market_signal(
            snapshot.market_id,
            snapshot.question,
            snapshot.yes_price
        )

        if signal:
            signals_generated += 1
            direction_emoji = "🟢" if signal.direction == "bullish" else "🔴" if signal.direction == "bearish" else "⚪"

            print(f"\n   {direction_emoji} {snapshot.question[:50]}...")
            print(f"      Direction: {signal.direction.upper()} (strength: {signal.strength:.2f})")
            print(f"      Sentiment: {signal.sentiment_score:+.2f} | Mentions: {signal.total_mentions}")

            if abs(signal.divergence_score) > 0.1:
                div_dir = "higher" if signal.divergence_score > 0 else "lower"
                print(f"      ⚠️  Social sentiment suggests price should be {div_dir}")

            print(f"      X: {signal.twitter_sentiment:+.2f} | Reddit: {signal.reddit_sentiment:+.2f}")

    if signals_generated == 0:
        print("   No social signals generated (need more mentions)")

    # Show sentiment leaders
    leaders = feed.aggregator.get_sentiment_leaders(hours=24)
    if leaders:
        print("\n👥 INFLUENTIAL VOICES:")
        for topic, posts in list(leaders.items())[:3]:
            print(f"\n   Topic: {topic}")
            for post in posts[:2]:
                sentiment_emoji = "🟢" if post.sentiment_score > 0.2 else "🔴" if post.sentiment_score < -0.2 else "⚪"
                print(f"      {sentiment_emoji} @{post.author}: sentiment {post.sentiment_score:+.2f}, engagement: {post.engagement_score:.0f}")

    print("\n" + "=" * 80)


def run_analysis(db, data: dict, use_advanced_scoring: bool = True, social_feed: SocialFeed = None) -> dict:
    """
    Run signal generation and opportunity scoring.

    Args:
        db: Database instance
        data: Collected data
        use_advanced_scoring: Use ML-based advanced scorer

    Returns:
        Analysis results
    """
    logger = get_logger("live_runner")

    # Combine all snapshots
    all_snapshots = (
        data['polymarket']['snapshots'] +
        data['kalshi']['snapshots']
    )

    all_order_books = (
        data['polymarket']['order_books'] +
        data['kalshi']['order_books']
    )

    if not all_snapshots:
        print("   ⚠ No market data to analyze")
        return {'signals': [], 'opportunities': [], 'validation': None}

    # Step 1: Validate data quality
    print("\n🔎 Validating data quality...")
    validator = LiveDataValidator()
    validation = validator.validate_batch(all_snapshots)
    quality_score = validator.get_data_quality_score(all_snapshots)

    print(f"   Data Quality Score: {quality_score:.1%}")
    print(f"   Valid markets: {validation['valid']}/{validation['total']}")

    if validation['invalid'] > 0:
        print(f"   ⚠ {validation['invalid']} markets with data issues")

    # Step 2: Check for arbitrage opportunities
    print("\n🔄 Checking for arbitrage opportunities...")
    arb_detector = ArbitrageDetector(min_spread=0.03)

    poly_map = {s.market_id: s for s in data['polymarket']['snapshots']}
    kalshi_map = {s.market_id: s for s in data['kalshi']['snapshots']}

    arb_opportunities = arb_detector.detect_cross_platform_arb(
        poly_map, kalshi_map, similarity_threshold=0.7
    )

    if arb_opportunities:
        print(f"   ✓ Found {len(arb_opportunities)} potential arbitrage opportunities")
        for arb in arb_opportunities[:3]:
            print(f"     - Spread: {arb.spread:.1%}, Edge: {arb.edge_size:.1%}")
    else:
        print("   No cross-platform arbitrage detected")

    # Step 3: Run signal engine
    print("\n🔍 Running edge detection strategies...")
    engine = SignalEngine(db=db)
    print(f"   Running {len(engine.get_available_strategies())} strategies...")

    batch = engine.generate_signals(save_to_db=True)

    print(f"   ✓ Generated {batch.total_signals} signals")

    # Print signal breakdown
    if batch.signals_by_strategy:
        print("\n   Signals by strategy:")
        for strategy, count in sorted(batch.signals_by_strategy.items(), key=lambda x: -x[1])[:5]:
            print(f"     - {strategy}: {count}")

    # Step 4: Score opportunities
    print("\n📋 Scoring and ranking opportunities...")

    market_map = {s.market_id: s for s in all_snapshots}
    order_book_map = {ob.market_id: ob for ob in all_order_books}

    if use_advanced_scoring:
        print("   Using advanced ML-based scoring...")
        scorer = AdvancedOpportunityScorer()
        ranked_opps = scorer.score_opportunities(
            signals=batch.signals,
            markets=market_map,
            order_books=order_book_map,
            top_n=50
        )
        # Extract opportunities from RankedOpportunity objects
        opportunities = [r.opportunity for r in ranked_opps]

        # Print scoring summary
        summary = scorer.get_scoring_summary(ranked_opps)
        print(f"   Avg Score: {summary.get('avg_score', 0):.3f}")
        print(f"   High Confidence: {summary.get('high_confidence_count', 0)}")
    else:
        scorer = OpportunityScorer(db=db)
        opportunities = scorer.score_opportunities(
            signals=batch.signals,
            markets=market_map,
            top_n=50
        )

    print(f"   ✓ Ranked {len(opportunities)} opportunities")

    return {
        'signals': batch.signals,
        'opportunities': opportunities,
        'batch': batch,
        'validation': validation,
        'quality_score': quality_score,
        'arbitrage': arb_opportunities
    }


def display_opportunities(opportunities: list, top_n: int = 10):
    """Display top opportunities."""
    print("\n" + "=" * 80)
    print(f"TOP {min(top_n, len(opportunities))} OPPORTUNITIES")
    print("=" * 80)

    for opp in opportunities[:top_n]:
        ev_pct = opp.expected_value * 100

        print(f"\n#{opp.rank}: {opp.market_name[:60]}")
        print(f"   Score: {opp.composite_score:.3f} | EV: {ev_pct:+.1f}% | Conf: {opp.confidence:.0%}")
        print(f"   Side: {opp.suggested_side.upper()} | Price: {opp.current_price:.1%} | Liquidity: ${opp.liquidity:,.0f}")

        if opp.key_factors:
            print(f"   Factors: {', '.join(opp.key_factors[:2])}")

    print("\n" + "=" * 80)


def run_trading_mode(opportunities: list, args):
    """
    Run trading mode (if enabled).

    Args:
        opportunities: Ranked opportunities
        args: Command line arguments
    """
    from trading import TradeExecutor, RiskManager, PositionTracker
    from trading.executor import OrderSide, OrderType

    logger = get_logger("live_runner")
    dry_run = not args.live

    print("\n" + "=" * 80)
    print("TRADING MODE" + (" (DRY RUN)" if dry_run else " (LIVE!)"))
    print("=" * 80)

    if not dry_run:
        print("\n⚠️  WARNING: LIVE TRADING IS ENABLED!")
        print("⚠️  This will execute real trades with real money!")
        confirm = input("\nType 'CONFIRM' to proceed: ")
        if confirm != "CONFIRM":
            print("Trading cancelled.")
            return

    # Initialize trading components
    executor = TradeExecutor(dry_run=dry_run)
    risk_manager = RiskManager()
    tracker = PositionTracker()

    # Filter opportunities for trading
    trade_candidates = [
        opp for opp in opportunities
        if opp.composite_score >= args.min_score
        and opp.expected_value >= args.min_ev
        and opp.confidence >= args.min_confidence
    ]

    print(f"\n{len(trade_candidates)} opportunities meet trading criteria:")
    print(f"   Min Score: {args.min_score}")
    print(f"   Min EV: {args.min_ev:.1%}")
    print(f"   Min Confidence: {args.min_confidence:.0%}")

    if not trade_candidates:
        print("\nNo opportunities meet criteria. No trades executed.")
        return

    # Execute trades
    trades_executed = 0
    for opp in trade_candidates[:args.max_trades]:
        print(f"\n--- Evaluating: {opp.market_name[:50]}...")

        # Create order
        order = executor.create_order(
            market_id=opp.market_id,
            side=OrderSide.BUY,
            outcome=opp.suggested_side,
            quantity=args.position_size / opp.current_price,  # $ amount
            price=opp.current_price,
            order_type=OrderType.LIMIT
        )

        # Risk check
        risk_check = risk_manager.check_order(order)

        if not risk_check.passed:
            print(f"   ✗ Risk check failed: {risk_check.violations}")
            continue

        if risk_check.warnings:
            print(f"   ⚠ Warnings: {risk_check.warnings}")

        # Execute (or simulate)
        result = executor.execute(order)

        if result.success:
            trades_executed += 1
            print(f"   ✓ {'Simulated' if dry_run else 'Executed'}: {order.side.value} {order.quantity:.0f} @ {order.price:.2f}")

            # Record in risk manager
            risk_manager.record_trade(
                opp.market_id,
                order.side,
                order.quantity,
                order.filled_price or order.price
            )
        else:
            print(f"   ✗ Execution failed: {result.error_message}")

    print(f"\n{'=' * 80}")
    print(f"TRADING SUMMARY")
    print(f"{'=' * 80}")
    print(f"Trades Executed: {trades_executed}")

    # Show risk status
    status = risk_manager.get_status()
    print(f"Current Balance: ${status['current_balance']:,.2f}")
    print(f"Open Positions: {status['open_positions']}")
    print(f"Daily P&L: ${status['daily_pnl']:,.2f}")

    if dry_run:
        print("\n(This was a DRY RUN - no real trades were executed)")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Live Data Runner for Prediction Market Research Platform"
    )

    # Data collection options
    parser.add_argument(
        '--polymarket-only', action='store_true',
        help='Only collect from Polymarket'
    )
    parser.add_argument(
        '--kalshi-only', action='store_true',
        help='Only collect from Kalshi'
    )
    parser.add_argument(
        '--max-markets', type=int, default=100,
        help='Max markets per source (default: 100)'
    )

    # Analysis options
    parser.add_argument(
        '--top-n', type=int, default=20,
        help='Number of opportunities to display (default: 20)'
    )

    # Trading options
    parser.add_argument(
        '--trading', action='store_true',
        help='Enable trading mode (dry run by default)'
    )
    parser.add_argument(
        '--live', action='store_true',
        help='Enable LIVE trading (real money!)'
    )
    parser.add_argument(
        '--min-score', type=float, default=0.70,
        help='Minimum score for trading (default: 0.70)'
    )
    parser.add_argument(
        '--min-ev', type=float, default=0.03,
        help='Minimum EV for trading (default: 0.03)'
    )
    parser.add_argument(
        '--min-confidence', type=float, default=0.60,
        help='Minimum confidence for trading (default: 0.60)'
    )
    parser.add_argument(
        '--position-size', type=float, default=50.0,
        help='Position size in $ (default: 50)'
    )
    parser.add_argument(
        '--max-trades', type=int, default=5,
        help='Max trades per run (default: 5)'
    )

    # Social sentiment options
    parser.add_argument(
        '--social', action='store_true',
        help='Enable social sentiment analysis (X and Reddit)'
    )
    parser.add_argument(
        '--no-social', action='store_true',
        help='Disable social sentiment analysis'
    )

    # Other options
    parser.add_argument(
        '--verbose', '-v', action='store_true',
        help='Verbose output'
    )
    parser.add_argument(
        '--continuous', action='store_true',
        help='Run continuously (every 15 minutes)'
    )

    args = parser.parse_args()

    # Setup
    print_banner()
    load_config()
    setup_logging(
        level="DEBUG" if args.verbose else "INFO",
        log_file="logs/live_runner.log"
    )

    logger = get_logger("live_runner")
    logger.info("Starting live data runner")

    # Determine sources
    sources = []
    if args.polymarket_only:
        sources = ['polymarket']
    elif args.kalshi_only:
        sources = ['kalshi']
    else:
        sources = ['polymarket', 'kalshi']

    print(f"📡 Sources: {', '.join(sources)}")
    print(f"📊 Max markets per source: {args.max_markets}")

    if args.trading:
        mode = "LIVE TRADING" if args.live else "DRY RUN TRADING"
        print(f"💰 Mode: {mode}")
    else:
        print("📚 Mode: Research Only")

    # Social sentiment enabled by default, can be disabled with --no-social
    enable_social = args.social or not args.no_social
    if enable_social:
        print("📱 Social Sentiment: Enabled (X + Reddit)")
    else:
        print("📱 Social Sentiment: Disabled")

    # Initialize
    db = get_database()
    alert_manager = create_default_alert_manager()

    def run_cycle():
        """Run one data collection and analysis cycle."""
        print(f"\n{'='*80}")
        print(f"CYCLE START: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print('='*80)

        # Step 1: Collect market data
        data = collect_live_data(db, sources, args.max_markets)

        total = len(data['polymarket']['snapshots']) + len(data['kalshi']['snapshots'])
        if total == 0:
            print("\n⚠️  No data collected. Check API connectivity.")
            return

        all_snapshots = data['polymarket']['snapshots'] + data['kalshi']['snapshots']

        # Step 2: Collect social sentiment data
        social_feed = None
        if enable_social:
            market_questions = {s.market_id: s.question for s in all_snapshots}
            social_feed = collect_social_data(market_questions)

        # Step 3: Run analysis
        results = run_analysis(db, data, social_feed=social_feed)

        # Step 4: Display social sentiment analysis
        if enable_social and social_feed:
            display_social_sentiment(social_feed, all_snapshots)

        # Step 5: Display opportunities
        if results['opportunities']:
            display_opportunities(results['opportunities'], args.top_n)

            # Generate reports
            print("\n📄 Generating reports...")
            generator = ReportGenerator()
            report_path = generator.generate_daily_opportunity_report(results['opportunities'])
            csv_path = generator.export_opportunities_csv(results['opportunities'])
            print(f"   Report: {report_path}")
            print(f"   CSV: {csv_path}")

            # Check alerts
            alert_manager.check_opportunities(results['opportunities'])

            # Step 6: Trading (if enabled)
            if args.trading:
                run_trading_mode(results['opportunities'], args)
        else:
            print("\n⚠️  No opportunities generated.")

        print(f"\n{'='*80}")
        print(f"CYCLE COMPLETE")
        print('='*80)

    # Run
    if args.continuous:
        print("\n🔄 Running in continuous mode (Ctrl+C to stop)")
        while True:
            try:
                run_cycle()
                print(f"\n⏳ Waiting 15 minutes until next cycle...")
                time.sleep(900)  # 15 minutes
            except KeyboardInterrupt:
                print("\n\n👋 Stopping continuous mode...")
                break
    else:
        run_cycle()

    print("\n✓ Live data runner complete.")


if __name__ == "__main__":
    main()
