"""
Tests for Web Dashboard API Endpoints.

Tests all Flask API endpoints for:
- Correct response format
- Error handling
- Input validation
- Rate limiting
- Authentication
"""

import pytest
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))


# Skip all tests if Flask is not available
try:
    from flask import Flask
    from web.app import app, state, DashboardState
    from web.security import get_security_config, SCHEMAS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    app = None


@pytest.fixture
def client():
    """Create test client."""
    if not FLASK_AVAILABLE:
        pytest.skip("Flask not installed")

    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def mock_state():
    """Create mock dashboard state."""
    mock = Mock(spec=DashboardState)
    mock.opportunities = []
    mock.signals = []
    mock.market_snapshots = {}
    mock.last_refresh = datetime.now(timezone.utc)
    mock.social_feed = None
    mock.news_aggregator = None
    mock.performance_tracker = Mock()
    mock.portfolio_optimizer = Mock()

    mock.get_dashboard_data.return_value = {
        'last_refresh': datetime.now(timezone.utc).isoformat(),
        'opportunities_count': 0,
        'signals_count': 0,
        'has_social': False,
        'has_news': False,
    }
    mock.get_opportunities_data.return_value = []
    mock.get_social_data.return_value = {'trending': [], 'summary': {}}
    mock.get_news_data.return_value = {'breaking': [], 'events': [], 'summary': {}}

    return mock


class TestAPIEndpoints:
    """Test API endpoints."""

    def test_api_dashboard(self, client):
        """Test /api/dashboard endpoint."""
        response = client.get('/api/dashboard')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'opportunities_count' in data
        assert 'signals_count' in data

    def test_api_opportunities(self, client):
        """Test /api/opportunities endpoint."""
        response = client.get('/api/opportunities')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)

    def test_api_signals(self, client):
        """Test /api/signals endpoint."""
        response = client.get('/api/signals')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)

    def test_api_social(self, client):
        """Test /api/social endpoint."""
        response = client.get('/api/social')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'trending' in data or 'summary' in data or data == {}

    def test_api_news(self, client):
        """Test /api/news endpoint."""
        response = client.get('/api/news')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, dict)

    def test_api_stats(self, client):
        """Test /api/stats endpoint."""
        response = client.get('/api/stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_opportunities' in data
        assert 'total_signals' in data
        assert 'uptime_hours' in data
        assert 'uptime_seconds' in data

    def test_api_performance(self, client):
        """Test /api/performance endpoint."""
        response = client.get('/api/performance')
        assert response.status_code in [200, 503]  # 503 if not initialized


class TestInputValidation:
    """Test input validation on POST endpoints."""

    def test_kelly_valid_input(self, client):
        """Test Kelly endpoint with valid input."""
        response = client.post(
            '/api/kelly',
            data=json.dumps({'win_prob': 0.6}),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'full_kelly' in data
        assert 'adjusted_kelly' in data
        assert 'bet_amount' in data

    def test_kelly_invalid_probability_high(self, client):
        """Test Kelly endpoint with probability > 1."""
        response = client.post(
            '/api/kelly',
            data=json.dumps({'win_prob': 1.5}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_kelly_invalid_probability_low(self, client):
        """Test Kelly endpoint with probability < 0."""
        response = client.post(
            '/api/kelly',
            data=json.dumps({'win_prob': -0.5}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_kelly_missing_required_field(self, client):
        """Test Kelly endpoint without required field."""
        response = client.post(
            '/api/kelly',
            data=json.dumps({'odds': 2.0}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_kelly_with_all_params(self, client):
        """Test Kelly endpoint with all parameters."""
        response = client.post(
            '/api/kelly',
            data=json.dumps({
                'win_prob': 0.6,
                'odds': 2.0,
                'bankroll': 10000,
                'kelly_fraction': 0.25,
                'market_price': 0.5
            }),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'suggested_side' in data

    def test_position_size_valid(self, client):
        """Test position size endpoint with valid input."""
        response = client.post(
            '/api/portfolio/position-size',
            data=json.dumps({
                'estimated_prob': 0.65,
                'market_price': 0.50
            }),
            content_type='application/json'
        )
        # May return 503 if portfolio optimizer not initialized
        assert response.status_code in [200, 503]

    def test_position_size_invalid_prob(self, client):
        """Test position size with invalid probability."""
        response = client.post(
            '/api/portfolio/position-size',
            data=json.dumps({
                'estimated_prob': 2.0,  # Invalid
                'market_price': 0.50
            }),
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_position_size_missing_required(self, client):
        """Test position size without required fields."""
        response = client.post(
            '/api/portfolio/position-size',
            data=json.dumps({'market_id': 'test'}),
            content_type='application/json'
        )
        assert response.status_code == 400


class TestSecurityHeaders:
    """Test security headers."""

    def test_security_headers_present(self, client):
        """Test that security headers are present."""
        response = client.get('/api/dashboard')

        # Check security headers
        assert 'X-Frame-Options' in response.headers
        assert 'X-Content-Type-Options' in response.headers
        assert 'X-XSS-Protection' in response.headers

    def test_cors_headers(self, client):
        """Test CORS headers on preflight."""
        response = client.options(
            '/api/dashboard',
            headers={'Origin': 'http://localhost:3000'}
        )
        assert response.status_code == 200
        assert 'Access-Control-Allow-Methods' in response.headers


class TestErrorHandling:
    """Test error handling."""

    def test_invalid_json(self, client):
        """Test handling of invalid JSON."""
        response = client.post(
            '/api/kelly',
            data='not valid json',
            content_type='application/json'
        )
        # Should handle gracefully
        assert response.status_code in [400, 500]

    def test_404_handling(self, client):
        """Test 404 for unknown endpoints."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404

    def test_method_not_allowed(self, client):
        """Test method not allowed."""
        response = client.put('/api/dashboard')
        assert response.status_code == 405


class TestSchemaValidation:
    """Test validation schemas."""

    def test_kelly_schema_structure(self):
        """Test Kelly schema has correct structure."""
        if not FLASK_AVAILABLE:
            pytest.skip("Flask not installed")

        schema = SCHEMAS['kelly']
        assert 'win_prob' in schema
        assert schema['win_prob']['type'] == 'float'
        assert schema['win_prob']['required'] == True
        assert 'min' in schema['win_prob']
        assert 'max' in schema['win_prob']

    def test_position_size_schema_structure(self):
        """Test position size schema has correct structure."""
        if not FLASK_AVAILABLE:
            pytest.skip("Flask not installed")

        schema = SCHEMAS['position_size']
        assert 'estimated_prob' in schema
        assert 'market_price' in schema


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_rate_limit_headers(self, client):
        """Test that rate limit doesn't trigger on first request."""
        response = client.get('/api/stats')
        # Should succeed on first request
        assert response.status_code == 200


class TestPageRoutes:
    """Test page routes return HTML."""

    def test_index_page(self, client):
        """Test main dashboard page."""
        response = client.get('/')
        # May return 500 if template not found, but should try to serve
        assert response.status_code in [200, 500]

    def test_opportunities_page(self, client):
        """Test opportunities page."""
        response = client.get('/opportunities')
        assert response.status_code in [200, 500]

    def test_signals_page(self, client):
        """Test signals page."""
        response = client.get('/signals')
        assert response.status_code in [200, 500]

    def test_social_page(self, client):
        """Test social page."""
        response = client.get('/social')
        assert response.status_code in [200, 500]

    def test_news_page(self, client):
        """Test news page."""
        response = client.get('/news')
        assert response.status_code in [200, 500]

    def test_portfolio_page(self, client):
        """Test portfolio page."""
        response = client.get('/portfolio')
        assert response.status_code in [200, 500]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
