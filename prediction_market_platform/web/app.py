"""
Web Dashboard for Prediction Market Research Platform.

Provides a modern, interactive web interface for:
- Viewing market opportunities
- Monitoring social sentiment
- Tracking news and events
- Analyzing portfolio performance
- Managing trading strategies

Run with: python web/app.py
Access at: http://localhost:5000
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import json
import threading
import time

# Try Flask import
try:
    from flask import Flask, render_template, jsonify, request, Response
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("Flask not installed. Install with: pip install flask")

from engine.data_ingestion import get_database, MarketSource
from engine.signal_generation import SignalEngine
from engine.opportunity_scoring import OpportunityScorer
from engine.opportunity_scoring.advanced_scorer import AdvancedOpportunityScorer
from engine.social import create_social_feed, SocialFeed
from engine.news.news_collector import create_news_aggregator, NewsAggregator
from engine.algorithms import LiveDataValidator, ArbitrageDetector
from engine.performance import create_performance_tracker, PerformanceTracker
from engine.portfolio import create_portfolio_optimizer, PortfolioOptimizer

from utils.logging_setup import get_logger

logger = get_logger("web_dashboard")

# Initialize Flask app
if FLASK_AVAILABLE:
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static')
    app.config['SECRET_KEY'] = 'prediction-market-research-2024'


class DashboardState:
    """Maintains current state for the dashboard."""

    def __init__(self):
        self.db = get_database()
        self.opportunities: List[Any] = []
        self.signals: List[Any] = []
        self.social_feed: Optional[SocialFeed] = None
        self.news_aggregator: Optional[NewsAggregator] = None
        self.performance_tracker: Optional[PerformanceTracker] = None
        self.portfolio_optimizer: Optional[PortfolioOptimizer] = None
        self.market_snapshots: Dict[str, Any] = {}
        self.last_refresh: Optional[datetime] = None
        self.refresh_interval = 300  # 5 minutes
        self._lock = threading.Lock()

    def refresh_data(self):
        """Refresh all data sources."""
        with self._lock:
            logger.info("Refreshing dashboard data...")

            # Initialize if needed
            if not self.social_feed:
                self.social_feed = create_social_feed()

            if not self.news_aggregator:
                self.news_aggregator = create_news_aggregator()
                self.news_aggregator.refresh()

            if not self.performance_tracker:
                self.performance_tracker = create_performance_tracker()

            if not self.portfolio_optimizer:
                self.portfolio_optimizer = create_portfolio_optimizer()

            # Get opportunities from database
            try:
                recent_opps = self.db.get_recent_opportunities(limit=50)
                if recent_opps:
                    self.opportunities = recent_opps
            except:
                pass

            # Get recent signals
            try:
                recent_signals = self.db.get_signals(
                    since=datetime.now(timezone.utc) - timedelta(hours=24)
                )
                if recent_signals:
                    self.signals = recent_signals
            except:
                pass

            self.last_refresh = datetime.now(timezone.utc)
            logger.info("Dashboard data refreshed")

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get all data for main dashboard."""
        return {
            'last_refresh': self.last_refresh.isoformat() if self.last_refresh else None,
            'opportunities_count': len(self.opportunities),
            'signals_count': len(self.signals),
            'has_social': self.social_feed is not None,
            'has_news': self.news_aggregator is not None,
        }

    def get_opportunities_data(self) -> List[Dict[str, Any]]:
        """Get opportunities for display."""
        return [
            {
                'rank': i + 1,
                'market_id': getattr(opp, 'market_id', 'N/A'),
                'market_name': getattr(opp, 'market_name', 'Unknown')[:60],
                'score': round(getattr(opp, 'composite_score', 0), 3),
                'ev': round(getattr(opp, 'expected_value', 0) * 100, 1),
                'confidence': round(getattr(opp, 'confidence', 0) * 100, 0),
                'side': getattr(opp, 'suggested_side', 'N/A'),
                'price': round(getattr(opp, 'current_price', 0) * 100, 1),
                'liquidity': round(getattr(opp, 'liquidity', 0), 0),
                'factors': getattr(opp, 'key_factors', [])[:2],
            }
            for i, opp in enumerate(self.opportunities[:20])
        ]

    def get_social_data(self) -> Dict[str, Any]:
        """Get social sentiment data."""
        if not self.social_feed:
            return {'trending': [], 'summary': {}}

        summary = self.social_feed.get_feed_summary()
        trending = self.social_feed.aggregator.get_trending_topics(min_posts=3)

        return {
            'summary': summary,
            'trending': [
                {
                    'topic': topic,
                    'posts': mention.total_posts,
                    'sentiment': round(mention.avg_sentiment, 2),
                    'trending': mention.is_trending,
                    'volume_change': round(mention.volume_change_1h, 1),
                }
                for topic, mention in trending[:10]
            ]
        }

    def get_news_data(self) -> Dict[str, Any]:
        """Get news data."""
        if not self.news_aggregator:
            return {'breaking': [], 'events': [], 'summary': {}}

        summary = self.news_aggregator.get_news_summary()

        return {
            'breaking': summary.get('breaking_news', []),
            'events': summary.get('imminent_events', []),
            'category_counts': summary.get('category_counts', {}),
        }


# Global state
state = DashboardState()


# Routes
if FLASK_AVAILABLE:

    @app.route('/')
    def index():
        """Main dashboard page."""
        return render_template('dashboard.html')

    @app.route('/opportunities')
    def opportunities():
        """Opportunities page."""
        return render_template('opportunities.html')

    @app.route('/social')
    def social():
        """Social sentiment page."""
        return render_template('social.html')

    @app.route('/news')
    def news():
        """News and events page."""
        return render_template('news.html')

    @app.route('/portfolio')
    def portfolio():
        """Portfolio tracking page."""
        return render_template('portfolio.html')

    @app.route('/settings')
    def settings():
        """Settings page."""
        return render_template('settings.html')

    @app.route('/signals')
    def signals():
        """Signals page."""
        return render_template('signals.html')

    # API Endpoints
    @app.route('/api/dashboard')
    def api_dashboard():
        """Get dashboard summary data."""
        return jsonify(state.get_dashboard_data())

    @app.route('/api/opportunities')
    def api_opportunities():
        """Get opportunities data."""
        return jsonify(state.get_opportunities_data())

    @app.route('/api/social')
    def api_social():
        """Get social sentiment data."""
        return jsonify(state.get_social_data())

    @app.route('/api/news')
    def api_news():
        """Get news data."""
        return jsonify(state.get_news_data())

    @app.route('/api/refresh', methods=['POST'])
    def api_refresh():
        """Trigger data refresh."""
        state.refresh_data()
        return jsonify({'status': 'ok', 'timestamp': datetime.now(timezone.utc).isoformat()})

    @app.route('/api/signals')
    def api_signals():
        """Get recent signals."""
        signals_data = [
            {
                'strategy': getattr(s, 'strategy_name', 'Unknown'),
                'market_id': getattr(s, 'market_id', 'N/A'),
                'direction': getattr(s, 'direction', 'N/A'),
                'strength': round(getattr(s, 'strength', 0), 2),
                'confidence': round(getattr(s, 'confidence', 0), 2),
                'ev': round(getattr(s, 'expected_value', 0) * 100, 1),
                'timestamp': getattr(s, 'timestamp', datetime.now()).isoformat() if hasattr(s, 'timestamp') else None,
            }
            for s in state.signals[:50]
        ]
        return jsonify(signals_data)

    @app.route('/api/stats')
    def api_stats():
        """Get platform statistics."""
        return jsonify({
            'total_opportunities': len(state.opportunities),
            'total_signals': len(state.signals),
            'markets_tracked': len(state.market_snapshots),
            'last_refresh': state.last_refresh.isoformat() if state.last_refresh else None,
            'uptime_hours': 0,  # TODO: Track actual uptime
        })

    @app.route('/api/performance')
    def api_performance():
        """Get performance tracking data."""
        if not state.performance_tracker:
            return jsonify({'error': 'Performance tracker not initialized'})

        return jsonify(state.performance_tracker.generate_report())

    @app.route('/api/performance/strategy/<strategy_name>')
    def api_strategy_performance(strategy_name):
        """Get performance for a specific strategy."""
        if not state.performance_tracker:
            return jsonify({'error': 'Performance tracker not initialized'})

        metrics = state.performance_tracker.calculate_strategy_performance(
            strategy_name=strategy_name
        )

        if strategy_name not in metrics:
            return jsonify({'error': f'No data for strategy: {strategy_name}'})

        return jsonify(metrics[strategy_name].to_dict())

    @app.route('/api/portfolio')
    def api_portfolio():
        """Get portfolio state and positions."""
        if not state.portfolio_optimizer:
            return jsonify({'error': 'Portfolio optimizer not initialized'})

        return jsonify(state.portfolio_optimizer.generate_report())

    @app.route('/api/portfolio/position-size', methods=['POST'])
    def api_position_size():
        """Calculate optimal position size."""
        if not state.portfolio_optimizer:
            return jsonify({'error': 'Portfolio optimizer not initialized'})

        data = request.json or {}

        sizing = state.portfolio_optimizer.calculate_position_size(
            estimated_prob=data.get('estimated_prob', 0.5),
            market_price=data.get('market_price', 0.5),
            market_id=data.get('market_id', ''),
            category=data.get('category')
        )

        return jsonify(sizing)

    @app.route('/api/kelly', methods=['POST'])
    def api_kelly():
        """Calculate Kelly criterion bet size."""
        data = request.json or {}

        win_prob = data.get('win_prob', 0.5)
        odds = data.get('odds', 2.0)
        bankroll = data.get('bankroll', 10000)
        kelly_mult = data.get('kelly_fraction', 0.25)

        from engine.portfolio import kelly_fraction, optimal_kelly_bet

        # Simple Kelly
        simple_kelly = kelly_fraction(win_prob, odds - 1)

        # Position sizing
        if 'market_price' in data:
            bet_amount, side = optimal_kelly_bet(
                bankroll=bankroll,
                win_prob=win_prob,
                current_price=data['market_price'],
                kelly_multiplier=kelly_mult
            )
        else:
            bet_amount = bankroll * simple_kelly * kelly_mult
            side = "YES" if win_prob > 0.5 else "NO"

        return jsonify({
            'full_kelly': round(simple_kelly, 4),
            'adjusted_kelly': round(simple_kelly * kelly_mult, 4),
            'bet_amount': round(bet_amount, 2),
            'suggested_side': side,
            'edge': round((win_prob * odds) - 1, 4)
        })


def run_dashboard(host: str = '0.0.0.0', port: int = 5000, debug: bool = False):
    """
    Run the web dashboard.

    Args:
        host: Host to bind to
        port: Port to listen on
        debug: Enable debug mode
    """
    if not FLASK_AVAILABLE:
        print("Flask is required. Install with: pip install flask")
        return

    # Initial data load
    print("Loading initial data...")
    state.refresh_data()

    # Start background refresh thread
    def background_refresh():
        while True:
            time.sleep(state.refresh_interval)
            try:
                state.refresh_data()
            except Exception as e:
                logger.error(f"Background refresh error: {e}")

    refresh_thread = threading.Thread(target=background_refresh, daemon=True)
    refresh_thread.start()

    print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              PREDICTION MARKET RESEARCH DASHBOARD                            ║
║                                                                              ║
║  Access the dashboard at: http://{host}:{port}                              ║
║                                                                              ║
║  Pages:                                                                      ║
║    /                  - Main dashboard                                       ║
║    /opportunities     - View opportunities                                   ║
║    /signals           - Trading signals                                      ║
║    /social            - Social sentiment                                     ║
║    /news              - News and events                                      ║
║    /portfolio         - Portfolio tracking                                   ║
║    /settings          - Configuration                                        ║
║                                                                              ║
║  API Endpoints:                                                              ║
║    /api/dashboard     - Dashboard summary                                    ║
║    /api/opportunities - Opportunities data                                   ║
║    /api/signals       - Trading signals                                      ║
║    /api/social        - Social data                                          ║
║    /api/news          - News data                                            ║
║    /api/performance   - Performance tracking                                 ║
║    /api/portfolio     - Portfolio state                                      ║
║    /api/kelly         - Kelly criterion calculator (POST)                    ║
║    /api/refresh       - Trigger refresh (POST)                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Run the prediction market dashboard')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to listen on')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()
    run_dashboard(host=args.host, port=args.port, debug=args.debug)
