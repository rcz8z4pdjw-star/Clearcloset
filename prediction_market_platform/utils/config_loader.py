"""
Configuration loader for the Prediction Market Research Platform.

Loads and validates YAML configuration files with support for
environment variable overrides and runtime updates.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional
import yaml

# Global config instance
_config: Optional[Dict[str, Any]] = None
_config_path: Optional[Path] = None


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load configuration from YAML file.

    Args:
        config_path: Path to config file. If None, uses default location.

    Returns:
        Configuration dictionary

    Raises:
        FileNotFoundError: If config file doesn't exist
        yaml.YAMLError: If config file is invalid
    """
    global _config, _config_path

    if config_path is None:
        # Default to config/settings.yaml relative to project root
        project_root = Path(__file__).parent.parent
        config_path = project_root / "config" / "settings.yaml"
    else:
        config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with open(config_path, 'r') as f:
        _config = yaml.safe_load(f)

    _config_path = config_path

    # Apply environment variable overrides
    _apply_env_overrides(_config)

    # Validate configuration
    _validate_config(_config)

    return _config


def get_config(key: Optional[str] = None, default: Any = None) -> Any:
    """
    Get configuration value by dot-notation key.

    Args:
        key: Dot-notation key (e.g., "strategies.structural.liquidity_vacuum.enabled")
             If None, returns entire config
        default: Default value if key not found

    Returns:
        Configuration value or default

    Example:
        >>> get_config("scoring.weights.expected_value")
        0.30
        >>> get_config("strategies.structural.liquidity_vacuum")
        {"enabled": True, "weight": 1.2, ...}
    """
    global _config

    if _config is None:
        load_config()

    if key is None:
        return _config

    # Navigate dot-notation path
    value = _config
    for part in key.split('.'):
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return default

    return value


def reload_config() -> Dict[str, Any]:
    """
    Reload configuration from file.

    Useful for picking up runtime changes to config file.

    Returns:
        Updated configuration dictionary
    """
    global _config_path

    if _config_path is None:
        return load_config()

    return load_config(str(_config_path))


def _apply_env_overrides(config: Dict[str, Any]) -> None:
    """
    Apply environment variable overrides to config.

    Environment variables should be prefixed with PM_
    and use double underscores for nesting.

    Example:
        PM_STRATEGIES__STRUCTURAL__LIQUIDITY_VACUUM__ENABLED=false
    """
    prefix = "PM_"

    for key, value in os.environ.items():
        if not key.startswith(prefix):
            continue

        # Convert key to config path
        config_key = key[len(prefix):].lower().replace("__", ".")

        # Parse value
        parsed_value = _parse_env_value(value)

        # Set in config
        _set_nested(config, config_key, parsed_value)


def _parse_env_value(value: str) -> Any:
    """
    Parse environment variable value to appropriate type.
    """
    # Boolean
    if value.lower() in ('true', 'yes', '1'):
        return True
    if value.lower() in ('false', 'no', '0'):
        return False

    # Integer
    try:
        return int(value)
    except ValueError:
        pass

    # Float
    try:
        return float(value)
    except ValueError:
        pass

    # String
    return value


def _set_nested(config: Dict[str, Any], key: str, value: Any) -> None:
    """
    Set a nested configuration value by dot-notation key.
    """
    parts = key.split('.')
    current = config

    for part in parts[:-1]:
        if part not in current:
            current[part] = {}
        current = current[part]

    current[parts[-1]] = value


def _validate_config(config: Dict[str, Any]) -> None:
    """
    Validate configuration structure and values.

    Raises:
        ValueError: If configuration is invalid
    """
    # Ensure research mode
    mode = config.get('platform', {}).get('mode')
    if mode != 'research':
        raise ValueError(
            "Platform must be in 'research' mode. "
            "Automated trading is not supported."
        )

    # Validate scoring weights sum to ~1.0
    weights = config.get('scoring', {}).get('weights', {})
    if weights:
        total = sum(weights.values())
        if not 0.99 <= total <= 1.01:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total}"
            )

    # Validate strategy weights are positive
    strategies = config.get('strategies', {})
    for category in strategies.values():
        if isinstance(category, dict):
            for strategy in category.values():
                if isinstance(strategy, dict):
                    weight = strategy.get('weight', 1.0)
                    if weight < 0:
                        raise ValueError(
                            f"Strategy weights must be non-negative, got {weight}"
                        )


def get_strategy_config(
    category: str,
    strategy_name: str
) -> Dict[str, Any]:
    """
    Get configuration for a specific strategy.

    Args:
        category: Strategy category (structural, behavioral, temporal, informational)
        strategy_name: Name of the strategy

    Returns:
        Strategy configuration dictionary
    """
    return get_config(f"strategies.{category}.{strategy_name}", {})


def is_strategy_enabled(category: str, strategy_name: str) -> bool:
    """
    Check if a strategy is enabled.

    Args:
        category: Strategy category
        strategy_name: Name of the strategy

    Returns:
        True if strategy is enabled
    """
    config = get_strategy_config(category, strategy_name)
    return config.get('enabled', False)


def get_all_enabled_strategies() -> Dict[str, Dict[str, Dict[str, Any]]]:
    """
    Get all enabled strategies organized by category.

    Returns:
        Nested dictionary of enabled strategies
    """
    result = {}
    strategies = get_config('strategies', {})

    for category, category_strategies in strategies.items():
        if not isinstance(category_strategies, dict):
            continue

        enabled_in_category = {}
        for name, config in category_strategies.items():
            if isinstance(config, dict) and config.get('enabled', False):
                enabled_in_category[name] = config

        if enabled_in_category:
            result[category] = enabled_in_category

    return result
