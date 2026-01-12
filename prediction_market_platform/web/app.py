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
import os
import signal
import atexit
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import json
import threading
import time
import csv
from io import StringIO

# Try Flask import
try:
    from flask import Flask, render_template, jsonify, request, Response, g
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

# Import security module
from web.security import (
    init_security, require_api_key, rate_limit, validate_json_schema,
    get_security_config, SCHEMAS
)

logger = get_logger("web_dashboard")

# Track start time for uptime calculation
_start_time = datetime.now(timezone.utc)

# Shutdown flag for graceful shutdown
_shutdown_event = threading.Event()
_active_requests = 0
_requests_lock = threading.Lock()

# Request metrics
_request_count = 0
_request_latencies: List[float] = []

# Initialize Flask app
if FLASK_AVAILABLE:
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static')
    # Initialize security (sets secret key from environment)
    init_security(app)

    # =============================================================================
    # Request Logging Middleware
    # =============================================================================
    @app.before_request
    def before_request_handler():
        """Track request start time and count."""
        global _active_requests, _request_count
        g.start_time = time.time()
        with _requests_lock:
            _active_requests += 1
            _request_count += 1

    @app.after_request
    def after_request_handler(response):
        """Log request and track latency."""
        global _active_requests
        # Calculate latency
        if hasattr(g, 'start_time'):
            latency = (time.time() - g.start_time) * 1000  # ms
            _request_latencies.append(latency)
            # Keep only last 1000 latencies to prevent memory growth
            if len(_request_latencies) > 1000:
                _request_latencies.pop(0)

            # Log request details (skip health checks to reduce noise)
            if not request.path.startswith('/health') and not request.path == '/metrics':
                logger.info(
                    f"{request.method} {request.path} - {response.status_code} - {latency:.2f}ms"
                )

        with _requests_lock:
            _active_requests -= 1

        return response


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
            except AttributeError:
                logger.debug("get_recent_opportunities not available")
            except Exception as e:
                logger.warning(f"Failed to get opportunities: {e}")

            # Get recent signals
            try:
                recent_signals = self.db.get_signals(
                    since=datetime.now(timezone.utc) - timedelta(hours=24)
                )
                if recent_signals:
                    self.signals = recent_signals
            except AttributeError:
                logger.debug("get_signals not available")
            except Exception as e:
                logger.warning(f"Failed to get signals: {e}")

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
    @rate_limit(rpm=10)  # Limit refresh calls to prevent abuse
    @require_api_key
    def api_refresh():
        """Trigger data refresh."""
        try:
            state.refresh_data()
            return jsonify({'status': 'ok', 'timestamp': datetime.now(timezone.utc).isoformat()})
        except Exception as e:
            logger.error(f"Refresh error: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

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
    @rate_limit(rpm=120)
    def api_stats():
        """Get platform statistics."""
        uptime_seconds = (datetime.now(timezone.utc) - _start_time).total_seconds()
        uptime_hours = uptime_seconds / 3600

        return jsonify({
            'total_opportunities': len(state.opportunities),
            'total_signals': len(state.signals),
            'markets_tracked': len(state.market_snapshots),
            'last_refresh': state.last_refresh.isoformat() if state.last_refresh else None,
            'uptime_hours': round(uptime_hours, 2),
            'uptime_seconds': int(uptime_seconds),
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
    @rate_limit(rpm=60)
    @validate_json_schema(SCHEMAS['position_size'])
    def api_position_size():
        """Calculate optimal position size."""
        if not state.portfolio_optimizer:
            return jsonify({'error': 'Portfolio optimizer not initialized'}), 503

        # Use validated data from schema validation
        data = g.validated_data

        try:
            sizing = state.portfolio_optimizer.calculate_position_size(
                estimated_prob=data.get('estimated_prob', 0.5),
                market_price=data.get('market_price', 0.5),
                market_id=data.get('market_id', ''),
                category=data.get('category')
            )
            return jsonify(sizing)
        except ValueError as e:
            return jsonify({'error': 'Invalid input', 'message': str(e)}), 400
        except Exception as e:
            logger.error(f"Position size calculation error: {e}")
            return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

    @app.route('/api/kelly', methods=['POST'])
    @rate_limit(rpm=60)
    @validate_json_schema(SCHEMAS['kelly'])
    def api_kelly():
        """Calculate Kelly criterion bet size."""
        # Use validated data from schema validation
        data = g.validated_data

        win_prob = data.get('win_prob', 0.5)
        odds = data.get('odds', 2.0)
        bankroll = data.get('bankroll', 10000)
        kelly_mult = data.get('kelly_fraction', 0.25)

        try:
            from engine.portfolio import kelly_fraction as calc_kelly_fraction, optimal_kelly_bet

            # Simple Kelly
            simple_kelly = calc_kelly_fraction(win_prob, odds - 1)

            # Position sizing
            if 'market_price' in data and data['market_price'] is not None:
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
        except ValueError as e:
            return jsonify({'error': 'Invalid input', 'message': str(e)}), 400
        except Exception as e:
            logger.error(f"Kelly calculation error: {e}")
            return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500


# =============================================================================
# Data Export Endpoints
# =============================================================================

if FLASK_AVAILABLE:
    @app.route('/api/export/opportunities')
    @rate_limit(rpm=30)
    def export_opportunities():
        """
        Export opportunities data in CSV or JSON format.

        Query params:
            format: 'csv' or 'json' (default: json)
            limit: max records (default: 100, max: 1000)
        """
        export_format = request.args.get('format', 'json').lower()
        limit = min(int(request.args.get('limit', 100)), 1000)

        data = state.get_opportunities_data()[:limit]

        if export_format == 'csv':
            if not data:
                return Response('No data', mimetype='text/csv')

            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            for row in data:
                # Convert list fields to strings
                row_copy = row.copy()
                for k, v in row_copy.items():
                    if isinstance(v, list):
                        row_copy[k] = '; '.join(str(x) for x in v)
                writer.writerow(row_copy)

            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=opportunities.csv'}
            )

        return jsonify(data)

    @app.route('/api/export/signals')
    @rate_limit(rpm=30)
    def export_signals():
        """
        Export signals data in CSV or JSON format.

        Query params:
            format: 'csv' or 'json' (default: json)
            limit: max records (default: 100, max: 1000)
        """
        export_format = request.args.get('format', 'json').lower()
        limit = min(int(request.args.get('limit', 100)), 1000)

        signals_data = [
            {
                'strategy': getattr(s, 'strategy_name', 'Unknown'),
                'market_id': getattr(s, 'market_id', 'N/A'),
                'direction': str(getattr(s, 'direction', 'N/A')),
                'strength': round(getattr(s, 'strength', 0), 4),
                'confidence': round(getattr(s, 'confidence', 0), 4),
                'ev': round(getattr(s, 'expected_value', 0), 4),
                'timestamp': getattr(s, 'timestamp', datetime.now()).isoformat() if hasattr(s, 'timestamp') else None,
            }
            for s in state.signals[:limit]
        ]

        if export_format == 'csv':
            if not signals_data:
                return Response('No data', mimetype='text/csv')

            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=signals_data[0].keys())
            writer.writeheader()
            writer.writerows(signals_data)

            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=signals.csv'}
            )

        return jsonify(signals_data)

    @app.route('/api/export/portfolio')
    @rate_limit(rpm=30)
    def export_portfolio():
        """
        Export portfolio data in CSV or JSON format.

        Query params:
            format: 'csv' or 'json' (default: json)
        """
        if not state.portfolio_optimizer:
            return jsonify({'error': 'Portfolio optimizer not initialized'}), 503

        export_format = request.args.get('format', 'json').lower()
        report = state.portfolio_optimizer.generate_report()

        if export_format == 'csv':
            positions = report.get('positions', [])
            if not positions:
                return Response('No positions', mimetype='text/csv')

            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=positions[0].keys())
            writer.writeheader()
            writer.writerows(positions)

            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=portfolio.csv'}
            )

        return jsonify(report)

    @app.route('/api/export/performance')
    @rate_limit(rpm=30)
    def export_performance():
        """
        Export performance report in JSON format.
        """
        if not state.performance_tracker:
            return jsonify({'error': 'Performance tracker not initialized'}), 503

        return jsonify(state.performance_tracker.generate_report())


# =============================================================================
# API Documentation Endpoint
# =============================================================================

OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Prediction Market Research Platform API",
        "description": "API for analyzing prediction market opportunities across Polymarket and Kalshi",
        "version": "1.0.0",
        "contact": {"name": "API Support"},
        "license": {"name": "MIT"}
    },
    "servers": [
        {"url": "/", "description": "Current server"}
    ],
    "paths": {
        "/health": {
            "get": {
                "summary": "Health check",
                "tags": ["Monitoring"],
                "responses": {"200": {"description": "Server is healthy"}}
            }
        },
        "/health/detailed": {
            "get": {
                "summary": "Detailed health check",
                "tags": ["Monitoring"],
                "responses": {"200": {"description": "Component health status"}}
            }
        },
        "/metrics": {
            "get": {
                "summary": "Prometheus metrics",
                "tags": ["Monitoring"],
                "responses": {"200": {"description": "Metrics in Prometheus format"}}
            }
        },
        "/ready": {
            "get": {
                "summary": "Readiness probe",
                "tags": ["Monitoring"],
                "responses": {
                    "200": {"description": "Server is ready"},
                    "503": {"description": "Server not ready"}
                }
            }
        },
        "/api/dashboard": {
            "get": {
                "summary": "Dashboard summary",
                "tags": ["Dashboard"],
                "responses": {"200": {"description": "Dashboard data"}}
            }
        },
        "/api/opportunities": {
            "get": {
                "summary": "List opportunities",
                "tags": ["Opportunities"],
                "parameters": [
                    {"name": "min_score", "in": "query", "schema": {"type": "number"}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 50}}
                ],
                "responses": {"200": {"description": "List of opportunities"}}
            }
        },
        "/api/signals": {
            "get": {
                "summary": "List trading signals",
                "tags": ["Signals"],
                "parameters": [
                    {"name": "strategy", "in": "query", "schema": {"type": "string"}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 100}}
                ],
                "responses": {"200": {"description": "List of signals"}}
            }
        },
        "/api/portfolio": {
            "get": {
                "summary": "Portfolio state",
                "tags": ["Portfolio"],
                "responses": {"200": {"description": "Current portfolio state"}}
            }
        },
        "/api/kelly": {
            "post": {
                "summary": "Calculate Kelly criterion",
                "tags": ["Tools"],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["win_probability"],
                                "properties": {
                                    "win_probability": {"type": "number", "minimum": 0, "maximum": 1},
                                    "odds": {"type": "number", "default": 2.0},
                                    "kelly_multiplier": {"type": "number", "default": 0.25},
                                    "bankroll": {"type": "number", "default": 10000}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Kelly calculation result"},
                    "400": {"description": "Invalid input"}
                }
            }
        },
        "/api/export/opportunities": {
            "get": {
                "summary": "Export opportunities",
                "tags": ["Export"],
                "parameters": [
                    {"name": "format", "in": "query", "schema": {"type": "string", "enum": ["json", "csv"]}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "maximum": 1000}}
                ],
                "responses": {"200": {"description": "Exported data"}}
            }
        },
        "/api/export/signals": {
            "get": {
                "summary": "Export signals",
                "tags": ["Export"],
                "parameters": [
                    {"name": "format", "in": "query", "schema": {"type": "string", "enum": ["json", "csv"]}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "maximum": 1000}}
                ],
                "responses": {"200": {"description": "Exported data"}}
            }
        },
        "/api/export/portfolio": {
            "get": {
                "summary": "Export portfolio",
                "tags": ["Export"],
                "parameters": [
                    {"name": "format", "in": "query", "schema": {"type": "string", "enum": ["json", "csv"]}}
                ],
                "responses": {"200": {"description": "Exported data"}}
            }
        },
        "/api/export/performance": {
            "get": {
                "summary": "Export performance report",
                "tags": ["Export"],
                "responses": {"200": {"description": "Performance report"}}
            }
        }
    },
    "tags": [
        {"name": "Monitoring", "description": "Health and metrics endpoints"},
        {"name": "Dashboard", "description": "Dashboard data"},
        {"name": "Opportunities", "description": "Market opportunities"},
        {"name": "Signals", "description": "Trading signals"},
        {"name": "Portfolio", "description": "Portfolio management"},
        {"name": "Tools", "description": "Analysis tools"},
        {"name": "Export", "description": "Data export endpoints"}
    ]
}

if FLASK_AVAILABLE:
    @app.route('/api/docs')
    def api_docs():
        """Return OpenAPI specification."""
        return jsonify(OPENAPI_SPEC)

    @app.route('/api/docs/ui')
    def api_docs_ui():
        """Swagger UI for API documentation."""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation - Prediction Market Platform</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: "BaseLayout"
        });
    </script>
</body>
</html>
"""
        return Response(html, mimetype='text/html')


# =============================================================================
# Admin/Operations Endpoints
# =============================================================================

if FLASK_AVAILABLE:
    @app.route('/api/admin/cache/stats')
    @rate_limit(rpm=60)
    def cache_stats():
        """Get cache statistics."""
        try:
            from engine.cache import get_cache
            cache = get_cache()
            return jsonify(cache.get_stats())
        except ImportError:
            return jsonify({'error': 'Cache module not available'}), 503

    @app.route('/api/admin/cache/clear', methods=['POST'])
    @rate_limit(rpm=10)
    def cache_clear():
        """Clear the cache."""
        try:
            from engine.cache import get_cache
            cache = get_cache()
            count = cache.clear()
            return jsonify({'cleared': count, 'status': 'success'})
        except ImportError:
            return jsonify({'error': 'Cache module not available'}), 503

    @app.route('/api/admin/backups')
    @rate_limit(rpm=30)
    def list_backups():
        """List available backups."""
        try:
            from engine.backup import get_backup_manager
            manager = get_backup_manager()
            backups = manager.list_backups()
            return jsonify({'backups': backups, 'count': len(backups)})
        except ImportError:
            return jsonify({'error': 'Backup module not available'}), 503
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/admin/backups', methods=['POST'])
    @rate_limit(rpm=5)
    def create_backup():
        """Create a new backup."""
        try:
            from engine.backup import get_backup_manager
            manager = get_backup_manager()
            include_data = request.json.get('include_data', True) if request.is_json else True
            result = manager.create_backup(include_data=include_data)
            return jsonify({'status': 'success', 'backup': result})
        except ImportError:
            return jsonify({'error': 'Backup module not available'}), 503
        except Exception as e:
            logger.error(f"Backup creation failed: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/admin/backups/<backup_name>')
    @rate_limit(rpm=30)
    def get_backup_info(backup_name):
        """Get information about a specific backup."""
        try:
            from engine.backup import get_backup_manager
            manager = get_backup_manager()
            info = manager.get_backup_info(backup_name)
            if info:
                return jsonify(info)
            return jsonify({'error': 'Backup not found'}), 404
        except ImportError:
            return jsonify({'error': 'Backup module not available'}), 503

    @app.route('/api/admin/backups/<backup_name>/restore', methods=['POST'])
    @rate_limit(rpm=2)
    def restore_backup(backup_name):
        """Restore from a backup."""
        try:
            from engine.backup import get_backup_manager
            manager = get_backup_manager()
            result = manager.restore_backup(backup_name)
            return jsonify({'status': 'success', 'result': result})
        except ImportError:
            return jsonify({'error': 'Backup module not available'}), 503
        except FileNotFoundError:
            return jsonify({'error': 'Backup not found'}), 404
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/admin/alerts/history')
    @rate_limit(rpm=60)
    def get_alert_history():
        """Get recent alert history."""
        try:
            from engine.alerts import create_default_alert_manager
            manager = create_default_alert_manager()
            limit = request.args.get('limit', 50, type=int)
            alerts = manager.get_history(limit=limit)
            return jsonify({
                'alerts': [a.to_dict() if hasattr(a, 'to_dict') else str(a) for a in alerts],
                'count': len(alerts)
            })
        except ImportError:
            return jsonify({'error': 'Alerts module not available'}), 503
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/admin/config')
    @rate_limit(rpm=30)
    def get_config_info():
        """Get current configuration (non-sensitive)."""
        try:
            from engine.config import get_config
            config = get_config()
            # Return non-sensitive config info
            return jsonify({
                'database': {
                    'path': config.database.path,
                    'pool_size': config.database.pool_size,
                },
                'web': {
                    'host': config.web.host,
                    'port': config.web.port,
                    'debug': config.web.debug,
                    'rate_limit_rpm': config.web.rate_limit_rpm,
                },
                'api': {
                    'version': config.api.version,
                    'key_enabled': config.api.key_enabled,
                },
                'alerts': {
                    'enabled': config.alerts.enabled,
                    'min_ev_threshold': config.alerts.min_ev_threshold,
                    'min_confidence': config.alerts.min_confidence,
                },
                'logging': {
                    'level': config.logging.level,
                }
            })
        except ImportError:
            return jsonify({'error': 'Config module not available'}), 503

    @app.route('/api/admin/scheduler/status')
    @rate_limit(rpm=60)
    def scheduler_status():
        """Get scheduler status."""
        try:
            from engine.scheduler import create_default_scheduler
            scheduler = create_default_scheduler()
            tasks_info = []
            for task_id, task in scheduler.tasks.items():
                tasks_info.append({
                    'id': task_id,
                    'name': task.name,
                    'enabled': task.enabled,
                    'frequency': task.frequency.value,
                    'last_run': task.last_run.isoformat() if task.last_run else None,
                    'run_count': task.run_count,
                    'failure_count': task.failure_count,
                })
            return jsonify({
                'running': scheduler.running,
                'task_count': len(scheduler.tasks),
                'tasks': tasks_info
            })
        except ImportError:
            return jsonify({'error': 'Scheduler module not available'}), 503

    @app.route('/api/admin/scheduler/tasks/<task_name>/run', methods=['POST'])
    @rate_limit(rpm=10)
    def run_scheduled_task(task_name):
        """Run a scheduled task immediately."""
        try:
            from engine.scheduler import create_default_scheduler
            scheduler = create_default_scheduler()
            task = scheduler.tasks.get(task_name)
            if task:
                result = scheduler.run_task(task)
                return jsonify({
                    'status': 'success',
                    'result': {
                        'task_id': result.task_id,
                        'status': result.status.value,
                        'duration': result.duration_seconds,
                        'error': result.error
                    }
                })
            return jsonify({'error': 'Task not found'}), 404
        except ImportError:
            return jsonify({'error': 'Scheduler module not available'}), 503

    @app.route('/api/admin/scheduler/tasks/<task_name>/enable', methods=['POST'])
    @rate_limit(rpm=30)
    def enable_scheduled_task(task_name):
        """Enable a scheduled task."""
        try:
            from engine.scheduler import create_default_scheduler
            scheduler = create_default_scheduler()
            if task_name in scheduler.tasks:
                scheduler.tasks[task_name].enabled = True
                return jsonify({'status': 'enabled', 'task': task_name})
            return jsonify({'error': 'Task not found'}), 404
        except ImportError:
            return jsonify({'error': 'Scheduler module not available'}), 503

    @app.route('/api/admin/scheduler/tasks/<task_name>/disable', methods=['POST'])
    @rate_limit(rpm=30)
    def disable_scheduled_task(task_name):
        """Disable a scheduled task."""
        try:
            from engine.scheduler import create_default_scheduler
            scheduler = create_default_scheduler()
            if task_name in scheduler.tasks:
                scheduler.tasks[task_name].enabled = False
                return jsonify({'status': 'disabled', 'task': task_name})
            return jsonify({'error': 'Task not found'}), 404
        except ImportError:
            return jsonify({'error': 'Scheduler module not available'}), 503

    @app.route('/api/admin/migrations/status')
    @rate_limit(rpm=30)
    def migrations_status():
        """Get database migration status."""
        try:
            from engine.migrations import get_migration_status
            return jsonify(get_migration_status())
        except ImportError:
            return jsonify({'error': 'Migrations module not available'}), 503

    @app.route('/api/admin/migrations/run', methods=['POST'])
    @rate_limit(rpm=5)
    def run_migrations():
        """Run pending database migrations."""
        try:
            from engine.migrations import run_migrations as do_migrations
            count = do_migrations()
            return jsonify({'status': 'success', 'migrations_applied': count})
        except ImportError:
            return jsonify({'error': 'Migrations module not available'}), 503
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return jsonify({'error': str(e)}), 500


# =============================================================================
# Health Check & Monitoring Endpoints
# =============================================================================

if FLASK_AVAILABLE:
    @app.route('/health')
    def health_check():
        """
        Health check endpoint for load balancers and monitoring.

        Returns basic health status without authentication.
        """
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

    @app.route('/health/detailed')
    def detailed_health_check():
        """
        Detailed health check with component status.

        Returns comprehensive health information.
        """
        components = {}

        # Check database
        try:
            db = get_database()
            markets = db.get_all_markets()
            components['database'] = {
                'status': 'healthy',
                'markets_count': len(markets) if markets else 0
            }
        except Exception as e:
            components['database'] = {
                'status': 'unhealthy',
                'error': str(e)
            }

        # Check signal engine
        try:
            engine = SignalEngine()
            components['signal_engine'] = {
                'status': 'healthy',
                'strategies_loaded': len(engine.strategies)
            }
        except Exception as e:
            components['signal_engine'] = {
                'status': 'unhealthy',
                'error': str(e)
            }

        # Check social feed
        try:
            if state.social_feed:
                components['social_feed'] = {'status': 'healthy'}
            else:
                components['social_feed'] = {'status': 'not_initialized'}
        except Exception as e:
            components['social_feed'] = {
                'status': 'unhealthy',
                'error': str(e)
            }

        # Overall status
        all_healthy = all(
            c.get('status') in ['healthy', 'not_initialized']
            for c in components.values()
        )

        return jsonify({
            'status': 'healthy' if all_healthy else 'degraded',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'uptime_seconds': (datetime.now(timezone.utc) - _start_time).total_seconds(),
            'components': components
        })

    @app.route('/metrics')
    def metrics():
        """
        Prometheus-compatible metrics endpoint.

        Returns metrics in plain text format.
        """
        uptime = (datetime.now(timezone.utc) - _start_time).total_seconds()

        metrics_text = []
        metrics_text.append(f'# HELP pm_uptime_seconds Time since server start')
        metrics_text.append(f'# TYPE pm_uptime_seconds gauge')
        metrics_text.append(f'pm_uptime_seconds {uptime:.2f}')

        metrics_text.append(f'# HELP pm_opportunities_count Number of current opportunities')
        metrics_text.append(f'# TYPE pm_opportunities_count gauge')
        metrics_text.append(f'pm_opportunities_count {len(state.opportunities)}')

        metrics_text.append(f'# HELP pm_signals_count Number of current signals')
        metrics_text.append(f'# TYPE pm_signals_count gauge')
        metrics_text.append(f'pm_signals_count {len(state.signals)}')

        metrics_text.append(f'# HELP pm_markets_count Number of tracked markets')
        metrics_text.append(f'# TYPE pm_markets_count gauge')
        metrics_text.append(f'pm_markets_count {len(state.market_snapshots)}')

        # Request metrics
        metrics_text.append(f'# HELP pm_request_count_total Total number of HTTP requests')
        metrics_text.append(f'# TYPE pm_request_count_total counter')
        metrics_text.append(f'pm_request_count_total {_request_count}')

        metrics_text.append(f'# HELP pm_active_requests Number of currently active requests')
        metrics_text.append(f'# TYPE pm_active_requests gauge')
        metrics_text.append(f'pm_active_requests {_active_requests}')

        # Latency metrics
        if _request_latencies:
            avg_latency = sum(_request_latencies) / len(_request_latencies)
            max_latency = max(_request_latencies)
            sorted_latencies = sorted(_request_latencies)
            p50 = sorted_latencies[len(sorted_latencies) // 2]
            p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)]
            p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)]

            metrics_text.append(f'# HELP pm_request_latency_ms Request latency in milliseconds')
            metrics_text.append(f'# TYPE pm_request_latency_ms summary')
            metrics_text.append(f'pm_request_latency_ms{{quantile="0.5"}} {p50:.2f}')
            metrics_text.append(f'pm_request_latency_ms{{quantile="0.95"}} {p95:.2f}')
            metrics_text.append(f'pm_request_latency_ms{{quantile="0.99"}} {p99:.2f}')
            metrics_text.append(f'pm_request_latency_avg_ms {avg_latency:.2f}')
            metrics_text.append(f'pm_request_latency_max_ms {max_latency:.2f}')

        return Response('\n'.join(metrics_text), mimetype='text/plain')

    @app.route('/ready')
    def readiness_check():
        """
        Readiness check for Kubernetes-style deployments.

        Returns 200 if app is ready to serve traffic.
        """
        # Check if initial data load is complete
        if state.last_refresh is None:
            return jsonify({
                'status': 'not_ready',
                'reason': 'Initial data load not complete'
            }), 503

        return jsonify({
            'status': 'ready',
            'last_refresh': state.last_refresh.isoformat() if state.last_refresh else None
        })


def graceful_shutdown(signum, frame):
    """
    Handle graceful shutdown on SIGTERM/SIGINT.

    Waits for active requests to complete before exiting.
    """
    global _shutdown_event
    signal_name = signal.Signals(signum).name if hasattr(signal, 'Signals') else str(signum)
    logger.info(f"Received {signal_name}, initiating graceful shutdown...")
    print(f"\n[Shutdown] Received {signal_name}, shutting down gracefully...")

    _shutdown_event.set()

    # Wait for active requests to complete (max 30 seconds)
    shutdown_timeout = 30
    start_time = time.time()
    while _active_requests > 0 and (time.time() - start_time) < shutdown_timeout:
        remaining = _active_requests
        logger.info(f"Waiting for {remaining} active request(s) to complete...")
        print(f"[Shutdown] Waiting for {remaining} active request(s)...")
        time.sleep(0.5)

    if _active_requests > 0:
        logger.warning(f"Timeout reached with {_active_requests} active requests, forcing shutdown")
        print(f"[Shutdown] Timeout reached, forcing shutdown")
    else:
        logger.info("All requests completed, shutting down cleanly")
        print("[Shutdown] Clean shutdown complete")

    # Cleanup
    cleanup_resources()
    sys.exit(0)


def cleanup_resources():
    """Clean up resources on shutdown."""
    logger.info("Cleaning up resources...")
    try:
        # Close database connections
        if state.db:
            if hasattr(state.db, 'close'):
                state.db.close()
            logger.info("Database connection closed")

        # Persist portfolio state
        if state.portfolio_optimizer:
            try:
                state.portfolio_optimizer.save_state()
                logger.info("Portfolio state saved")
            except Exception as e:
                logger.warning(f"Failed to save portfolio state: {e}")

        # Persist performance data
        if state.performance_tracker:
            try:
                state.performance_tracker.save()
                logger.info("Performance data saved")
            except Exception as e:
                logger.warning(f"Failed to save performance data: {e}")

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")


# Register cleanup on exit
atexit.register(cleanup_resources)


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

    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, graceful_shutdown)
    signal.signal(signal.SIGINT, graceful_shutdown)

    # Initial data load
    print("Loading initial data...")
    state.refresh_data()

    # Start background refresh thread
    def background_refresh():
        while not _shutdown_event.is_set():
            # Use wait with timeout to allow checking shutdown event
            _shutdown_event.wait(timeout=state.refresh_interval)
            if _shutdown_event.is_set():
                break
            try:
                state.refresh_data()
            except Exception as e:
                logger.error(f"Background refresh error: {e}")

    refresh_thread = threading.Thread(target=background_refresh, daemon=True)
    refresh_thread.start()

    print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║              PREDICTION MARKET RESEARCH DASHBOARD                            ║
║  Access at: http://{host}:{port}                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Pages:           /                  - Main dashboard                        ║
║                   /opportunities     - View opportunities                    ║
║                   /signals           - Trading signals                       ║
║                   /social            - Social sentiment                      ║
║                   /news              - News and events                       ║
║                   /portfolio         - Portfolio tracking                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  API:             /api/dashboard     - Dashboard summary                     ║
║                   /api/opportunities - Opportunities data                    ║
║                   /api/signals       - Trading signals                       ║
║                   /api/portfolio     - Portfolio state                       ║
║                   /api/kelly         - Kelly calculator (POST)               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Export:          /api/export/opportunities?format=csv                       ║
║                   /api/export/signals?format=csv                             ║
║                   /api/export/portfolio?format=csv                           ║
║                   /api/export/performance                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Monitoring:      /health            - Basic health check                    ║
║                   /health/detailed   - Component health                      ║
║                   /metrics           - Prometheus metrics                    ║
║                   /ready             - Readiness probe                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Documentation:   /api/docs          - OpenAPI specification (JSON)          ║
║                   /api/docs/ui       - Swagger UI                            ║
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
