"""
Configuration validation and management for the prediction market platform.

Validates all configuration settings on startup and provides defaults.
"""

import os
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from pathlib import Path


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    path: str = "data/prediction_markets.db"
    pool_size: int = 5
    timeout: int = 30

    def validate(self) -> List[str]:
        """Validate database configuration."""
        errors = []
        if self.pool_size < 1:
            errors.append("Database pool_size must be >= 1")
        if self.timeout < 1:
            errors.append("Database timeout must be >= 1 second")
        # Check parent directory exists for database
        db_dir = Path(self.path).parent
        if not db_dir.exists():
            try:
                db_dir.mkdir(parents=True, exist_ok=True)
            except OSError as e:
                errors.append(f"Cannot create database directory: {e}")
        return errors


@dataclass
class WebConfig:
    """Web server configuration settings."""
    host: str = "0.0.0.0"
    port: int = 5000
    debug: bool = False
    secret_key: Optional[str] = None
    cors_origins: str = "*"
    rate_limit_rpm: int = 60

    def validate(self) -> List[str]:
        """Validate web configuration."""
        errors = []
        if not (1 <= self.port <= 65535):
            errors.append(f"Invalid port number: {self.port}")
        if self.rate_limit_rpm < 1:
            errors.append("Rate limit must be >= 1 rpm")
        # Check secret key in production
        is_production = os.environ.get('FLASK_ENV') == 'production'
        if is_production and not self.secret_key:
            errors.append("FLASK_SECRET_KEY must be set in production")
        return errors


@dataclass
class APIConfig:
    """API configuration settings."""
    key: Optional[str] = None
    key_enabled: bool = False
    version: str = "v1"

    def validate(self) -> List[str]:
        """Validate API configuration."""
        errors = []
        if self.key_enabled and not self.key:
            errors.append("API_KEY must be set when API_KEY_ENABLED is true")
        return errors


@dataclass
class SocialConfig:
    """Social media API configuration."""
    twitter_bearer_token: Optional[str] = None
    reddit_client_id: Optional[str] = None
    reddit_client_secret: Optional[str] = None
    use_mock_data: bool = True

    def validate(self) -> List[str]:
        """Validate social configuration."""
        errors = []
        # Just warnings, not errors (mock data is available)
        return errors

    def get_warnings(self) -> List[str]:
        """Get configuration warnings."""
        warnings = []
        if not self.twitter_bearer_token:
            warnings.append("TWITTER_BEARER_TOKEN not set, using mock data")
        if not self.reddit_client_id or not self.reddit_client_secret:
            warnings.append("Reddit credentials not set, using mock data")
        return warnings


@dataclass
class AlertConfig:
    """Alerting configuration settings."""
    enabled: bool = False
    webhook_url: Optional[str] = None
    email_enabled: bool = False
    email_smtp_host: Optional[str] = None
    email_smtp_port: int = 587
    email_from: Optional[str] = None
    email_to: List[str] = field(default_factory=list)
    min_ev_threshold: float = 0.05  # 5% expected value
    min_confidence: float = 0.7

    def validate(self) -> List[str]:
        """Validate alert configuration."""
        errors = []
        if self.enabled:
            if not self.webhook_url and not self.email_enabled:
                errors.append("Alerts enabled but no notification method configured")
            if self.email_enabled:
                if not self.email_smtp_host:
                    errors.append("Email alerts enabled but SMTP host not set")
                if not self.email_from:
                    errors.append("Email alerts enabled but sender email not set")
                if not self.email_to:
                    errors.append("Email alerts enabled but no recipients set")
        if not (0 <= self.min_ev_threshold <= 1):
            errors.append("min_ev_threshold must be between 0 and 1")
        if not (0 <= self.min_confidence <= 1):
            errors.append("min_confidence must be between 0 and 1")
        return errors


@dataclass
class LoggingConfig:
    """Logging configuration settings."""
    level: str = "INFO"
    file: Optional[str] = None
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    max_bytes: int = 10_000_000  # 10MB
    backup_count: int = 5

    def validate(self) -> List[str]:
        """Validate logging configuration."""
        errors = []
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level.upper() not in valid_levels:
            errors.append(f"Invalid log level: {self.level}. Valid: {valid_levels}")
        if self.file:
            log_dir = Path(self.file).parent
            if not log_dir.exists():
                try:
                    log_dir.mkdir(parents=True, exist_ok=True)
                except OSError as e:
                    errors.append(f"Cannot create log directory: {e}")
        return errors


@dataclass
class PlatformConfig:
    """Main platform configuration."""
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    web: WebConfig = field(default_factory=WebConfig)
    api: APIConfig = field(default_factory=APIConfig)
    social: SocialConfig = field(default_factory=SocialConfig)
    alerts: AlertConfig = field(default_factory=AlertConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)

    def validate(self) -> Dict[str, List[str]]:
        """Validate all configuration sections."""
        results = {
            'database': self.database.validate(),
            'web': self.web.validate(),
            'api': self.api.validate(),
            'social': self.social.validate(),
            'alerts': self.alerts.validate(),
            'logging': self.logging.validate(),
        }
        return {k: v for k, v in results.items() if v}

    def get_warnings(self) -> Dict[str, List[str]]:
        """Get all configuration warnings."""
        return {
            'social': self.social.get_warnings(),
        }

    def is_valid(self) -> bool:
        """Check if configuration is valid."""
        errors = self.validate()
        return len(errors) == 0


def load_config_from_env() -> PlatformConfig:
    """Load configuration from environment variables."""
    config = PlatformConfig(
        database=DatabaseConfig(
            path=os.environ.get('DATABASE_PATH', 'data/prediction_markets.db'),
            pool_size=int(os.environ.get('DATABASE_POOL_SIZE', '5')),
            timeout=int(os.environ.get('DATABASE_TIMEOUT', '30')),
        ),
        web=WebConfig(
            host=os.environ.get('FLASK_HOST', '0.0.0.0'),
            port=int(os.environ.get('FLASK_PORT', '5000')),
            debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true',
            secret_key=os.environ.get('FLASK_SECRET_KEY'),
            cors_origins=os.environ.get('CORS_ORIGINS', '*'),
            rate_limit_rpm=int(os.environ.get('RATE_LIMIT_RPM', '60')),
        ),
        api=APIConfig(
            key=os.environ.get('API_KEY'),
            key_enabled=os.environ.get('API_KEY_ENABLED', 'false').lower() == 'true',
            version=os.environ.get('API_VERSION', 'v1'),
        ),
        social=SocialConfig(
            twitter_bearer_token=os.environ.get('TWITTER_BEARER_TOKEN'),
            reddit_client_id=os.environ.get('REDDIT_CLIENT_ID'),
            reddit_client_secret=os.environ.get('REDDIT_CLIENT_SECRET'),
            use_mock_data=os.environ.get('USE_MOCK_DATA', 'true').lower() == 'true',
        ),
        alerts=AlertConfig(
            enabled=os.environ.get('ALERTS_ENABLED', 'false').lower() == 'true',
            webhook_url=os.environ.get('ALERTS_WEBHOOK_URL'),
            email_enabled=os.environ.get('ALERTS_EMAIL_ENABLED', 'false').lower() == 'true',
            email_smtp_host=os.environ.get('ALERTS_SMTP_HOST'),
            email_smtp_port=int(os.environ.get('ALERTS_SMTP_PORT', '587')),
            email_from=os.environ.get('ALERTS_EMAIL_FROM'),
            email_to=os.environ.get('ALERTS_EMAIL_TO', '').split(',') if os.environ.get('ALERTS_EMAIL_TO') else [],
            min_ev_threshold=float(os.environ.get('ALERTS_MIN_EV', '0.05')),
            min_confidence=float(os.environ.get('ALERTS_MIN_CONFIDENCE', '0.7')),
        ),
        logging=LoggingConfig(
            level=os.environ.get('LOG_LEVEL', 'INFO'),
            file=os.environ.get('LOG_FILE'),
            max_bytes=int(os.environ.get('LOG_MAX_BYTES', '10000000')),
            backup_count=int(os.environ.get('LOG_BACKUP_COUNT', '5')),
        ),
    )
    return config


def validate_startup_config() -> bool:
    """
    Validate configuration on startup.

    Returns True if configuration is valid, False otherwise.
    Prints errors and warnings to console.
    """
    config = load_config_from_env()
    errors = config.validate()
    warnings = config.get_warnings()

    # Print warnings
    for section, warns in warnings.items():
        for warn in warns:
            print(f"[WARNING] {section}: {warn}")

    # Print errors
    if errors:
        print("\n[ERROR] Configuration validation failed:")
        for section, errs in errors.items():
            for err in errs:
                print(f"  - {section}: {err}")
        return False

    print("[OK] Configuration validated successfully")
    return True


# Global config instance
_config: Optional[PlatformConfig] = None


def get_config() -> PlatformConfig:
    """Get the current configuration."""
    global _config
    if _config is None:
        _config = load_config_from_env()
    return _config


def reload_config() -> PlatformConfig:
    """Reload configuration from environment."""
    global _config
    _config = load_config_from_env()
    return _config
