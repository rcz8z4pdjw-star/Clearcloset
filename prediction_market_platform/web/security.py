"""
Security utilities for the Web Dashboard.

Provides:
- API key authentication
- Input validation
- CORS configuration
- Rate limiting
- Security headers
"""

import os
import secrets
import time
from functools import wraps
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime, timezone

# Try Flask imports
try:
    from flask import request, jsonify, g, current_app
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False


class SecurityConfig:
    """Security configuration loaded from environment."""

    def __init__(self):
        # Flask secret key
        self.secret_key = os.environ.get(
            'FLASK_SECRET_KEY',
            secrets.token_hex(32)  # Generate if not provided
        )

        # API key authentication
        self.api_key = os.environ.get('API_KEY', '')
        self.api_key_enabled = os.environ.get('API_KEY_ENABLED', 'false').lower() == 'true'

        # CORS configuration
        cors_origins = os.environ.get('CORS_ORIGINS', '*')
        self.cors_origins = [o.strip() for o in cors_origins.split(',')] if cors_origins != '*' else ['*']

        # Rate limiting
        self.rate_limit_rpm = int(os.environ.get('RATE_LIMIT_RPM', '60'))
        self.rate_limit_enabled = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'

        # Security headers
        self.enable_security_headers = True


# Global config instance
_config: Optional[SecurityConfig] = None


def get_security_config() -> SecurityConfig:
    """Get or create security configuration."""
    global _config
    if _config is None:
        _config = SecurityConfig()
    return _config


# Rate limiting storage (in production, use Redis)
_rate_limit_storage: Dict[str, List[float]] = {}


def get_client_ip() -> str:
    """Get client IP address from request."""
    if not FLASK_AVAILABLE:
        return '0.0.0.0'

    # Check for proxy headers
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr or '0.0.0.0'


def check_rate_limit(client_ip: str, rpm_limit: int = 60) -> bool:
    """
    Check if client is within rate limit.

    Args:
        client_ip: Client IP address
        rpm_limit: Requests per minute limit

    Returns:
        True if within limit, False if rate limited
    """
    now = time.time()
    window_start = now - 60  # 1 minute window

    if client_ip not in _rate_limit_storage:
        _rate_limit_storage[client_ip] = []

    # Clean old entries
    _rate_limit_storage[client_ip] = [
        t for t in _rate_limit_storage[client_ip] if t > window_start
    ]

    # Check limit
    if len(_rate_limit_storage[client_ip]) >= rpm_limit:
        return False

    # Add current request
    _rate_limit_storage[client_ip].append(now)
    return True


def require_api_key(f: Callable) -> Callable:
    """
    Decorator to require API key authentication.

    The API key can be provided in:
    - X-API-Key header
    - api_key query parameter
    - Authorization: Bearer <key> header
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        config = get_security_config()

        # Skip if API key auth is disabled
        if not config.api_key_enabled:
            return f(*args, **kwargs)

        # Check for API key
        api_key = None

        # Check X-API-Key header
        if request.headers.get('X-API-Key'):
            api_key = request.headers.get('X-API-Key')
        # Check Authorization header
        elif request.headers.get('Authorization', '').startswith('Bearer '):
            api_key = request.headers.get('Authorization')[7:]
        # Check query parameter
        elif request.args.get('api_key'):
            api_key = request.args.get('api_key')

        if not api_key:
            return jsonify({
                'error': 'API key required',
                'message': 'Provide API key via X-API-Key header, Authorization: Bearer <key>, or api_key query parameter'
            }), 401

        if not secrets.compare_digest(api_key, config.api_key):
            return jsonify({
                'error': 'Invalid API key',
                'message': 'The provided API key is not valid'
            }), 403

        return f(*args, **kwargs)

    return decorated


def rate_limit(rpm: Optional[int] = None):
    """
    Decorator to apply rate limiting to an endpoint.

    Args:
        rpm: Requests per minute limit (uses config default if not specified)
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            config = get_security_config()

            if not config.rate_limit_enabled:
                return f(*args, **kwargs)

            limit = rpm or config.rate_limit_rpm
            client_ip = get_client_ip()

            if not check_rate_limit(client_ip, limit):
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {limit} requests per minute allowed',
                    'retry_after': 60
                }), 429

            return f(*args, **kwargs)

        return decorated
    return decorator


def validate_json_schema(schema: Dict[str, Any]):
    """
    Decorator to validate JSON request body against a schema.

    Schema format:
    {
        'field_name': {
            'type': 'float' | 'int' | 'str' | 'bool' | 'list' | 'dict',
            'required': True | False,
            'min': <min_value>,  # for numeric types
            'max': <max_value>,  # for numeric types
            'min_length': <min>,  # for strings/lists
            'max_length': <max>,  # for strings/lists
            'pattern': <regex>,  # for strings
            'enum': [<allowed_values>],  # allowed values
            'default': <default_value>  # default if not provided
        }
    }
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            data = request.json or {}
            errors = []
            validated = {}

            for field, rules in schema.items():
                value = data.get(field)
                field_type = rules.get('type', 'str')
                required = rules.get('required', False)

                # Check required
                if value is None:
                    if required:
                        errors.append(f"'{field}' is required")
                        continue
                    elif 'default' in rules:
                        validated[field] = rules['default']
                        continue
                    else:
                        continue

                # Type validation
                type_map = {
                    'float': (float, int),
                    'int': int,
                    'str': str,
                    'bool': bool,
                    'list': list,
                    'dict': dict
                }

                expected_type = type_map.get(field_type)
                if expected_type and not isinstance(value, expected_type):
                    errors.append(f"'{field}' must be of type {field_type}")
                    continue

                # Convert int to float if needed
                if field_type == 'float' and isinstance(value, int):
                    value = float(value)

                # Numeric range validation
                if field_type in ('float', 'int'):
                    if 'min' in rules and value < rules['min']:
                        errors.append(f"'{field}' must be >= {rules['min']}")
                        continue
                    if 'max' in rules and value > rules['max']:
                        errors.append(f"'{field}' must be <= {rules['max']}")
                        continue

                # String/list length validation
                if field_type in ('str', 'list'):
                    if 'min_length' in rules and len(value) < rules['min_length']:
                        errors.append(f"'{field}' must have at least {rules['min_length']} items/characters")
                        continue
                    if 'max_length' in rules and len(value) > rules['max_length']:
                        errors.append(f"'{field}' must have at most {rules['max_length']} items/characters")
                        continue

                # Enum validation
                if 'enum' in rules and value not in rules['enum']:
                    errors.append(f"'{field}' must be one of: {rules['enum']}")
                    continue

                validated[field] = value

            if errors:
                return jsonify({
                    'error': 'Validation failed',
                    'details': errors
                }), 400

            # Store validated data in g for endpoint use
            g.validated_data = validated

            return f(*args, **kwargs)

        return decorated
    return decorator


def add_security_headers(response):
    """Add security headers to response."""
    config = get_security_config()

    if not config.enable_security_headers:
        return response

    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Permissions policy - restrict browser features
    response.headers['Permissions-Policy'] = (
        'geolocation=(), microphone=(), camera=(), '
        'payment=(), usb=(), magnetometer=(), gyroscope=()'
    )

    # Strict Transport Security (HSTS) - for HTTPS deployments
    # Uncomment in production with HTTPS
    # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Content Security Policy - tightened for production
    # Note: 'unsafe-inline' is needed for inline scripts/styles in templates
    # In production, consider using nonce-based CSP
    is_production = os.environ.get('FLASK_ENV', 'development') == 'production'

    if is_production:
        # Stricter CSP for production
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
    else:
        # More permissive CSP for development (allows inline scripts for debugging)
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self'"
        )

    return response


def add_cors_headers(response):
    """Add CORS headers to response."""
    config = get_security_config()

    origin = request.headers.get('Origin', '')

    # Check if origin is allowed
    if '*' in config.cors_origins:
        response.headers['Access-Control-Allow-Origin'] = '*'
    elif origin in config.cors_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        # Default to first allowed origin for non-browser requests
        if config.cors_origins:
            response.headers['Access-Control-Allow-Origin'] = config.cors_origins[0]

    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key'
    response.headers['Access-Control-Max-Age'] = '86400'  # Cache preflight for 24 hours

    return response


def init_security(app):
    """
    Initialize security features on Flask app.

    Call this after creating your Flask app:
        from web.security import init_security
        init_security(app)
    """
    config = get_security_config()

    # Set secret key from environment
    app.config['SECRET_KEY'] = config.secret_key

    # Check if we're in production mode
    is_production = os.environ.get('FLASK_ENV', 'development') == 'production'
    has_env_secret = os.environ.get('FLASK_SECRET_KEY') is not None

    # Warn or fail if using default secret key
    if not has_env_secret:
        import warnings
        warning_msg = (
            "Using auto-generated Flask secret key. "
            "Set FLASK_SECRET_KEY environment variable for production."
        )
        if is_production:
            # In production, this is a critical error
            raise RuntimeError(
                "FLASK_SECRET_KEY environment variable must be set in production mode. "
                "Generate a secure key with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        else:
            warnings.warn(warning_msg, RuntimeWarning)

    # Register after_request handlers
    @app.after_request
    def apply_security(response):
        response = add_security_headers(response)
        response = add_cors_headers(response)
        return response

    # Handle OPTIONS requests for CORS preflight
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = current_app.make_default_options_response()
            return add_cors_headers(response)

    return app


# Input validation schemas for common endpoints
SCHEMAS = {
    'position_size': {
        'estimated_prob': {
            'type': 'float',
            'required': True,
            'min': 0.0,
            'max': 1.0
        },
        'market_price': {
            'type': 'float',
            'required': True,
            'min': 0.0,
            'max': 1.0
        },
        'market_id': {
            'type': 'str',
            'required': False,
            'default': ''
        },
        'category': {
            'type': 'str',
            'required': False
        }
    },
    'kelly': {
        'win_prob': {
            'type': 'float',
            'required': True,
            'min': 0.0,
            'max': 1.0
        },
        'odds': {
            'type': 'float',
            'required': False,
            'min': 1.0,
            'default': 2.0
        },
        'bankroll': {
            'type': 'float',
            'required': False,
            'min': 0,
            'default': 10000
        },
        'kelly_fraction': {
            'type': 'float',
            'required': False,
            'min': 0.0,
            'max': 1.0,
            'default': 0.25
        },
        'market_price': {
            'type': 'float',
            'required': False,
            'min': 0.0,
            'max': 1.0
        }
    }
}
