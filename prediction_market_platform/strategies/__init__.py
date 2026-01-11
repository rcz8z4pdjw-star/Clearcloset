"""
Strategy modules for the Prediction Market Research Platform.

This package contains edge detection strategies organized by type:
- structural_edges: Market microstructure-based edges
- behavioral_edges: Human psychology-based edges
- mispricing_models: Statistical mispricing detection
- event_resolution_models: Pre-resolution convergence edges

Each strategy produces signals but does NOT execute trades.
All strategies are for research and analysis only.
"""

from typing import Dict, Any
from .base import Strategy, StrategyConfig, StrategyResult

# Import individual strategies for convenience
from .behavioral_edges.anchoring import AnchoringBiasStrategy
from .behavioral_edges.favorite_longshot_bias import FavoriteLongshotBiasStrategy
from .behavioral_edges.herding import HerdingStrategy
from .behavioral_edges.overreaction import OverreactionStrategy

from .structural_edges.liquidity_vacuum import LiquidityVacuumStrategy
from .structural_edges.spread_exploitation import SpreadExploitationStrategy
from .structural_edges.order_book_imbalance import OrderBookImbalanceStrategy
from .structural_edges.late_resolution import LateResolutionStrategy

from .mispricing_models.forecast_divergence import ForecastDivergenceStrategy
from .mispricing_models.cross_market_arbitrage import CrossMarketArbitrageStrategy
from .mispricing_models.slow_updating import SlowUpdatingMarketStrategy


def get_all_strategies() -> Dict[str, Strategy]:
    """
    Get all available strategies as a dictionary.

    Returns:
        Dict mapping strategy name to strategy instance
    """
    strategies = {}

    # Behavioral strategies
    try:
        strategies['anchoring_bias'] = AnchoringBiasStrategy()
    except Exception:
        pass

    try:
        strategies['favorite_longshot'] = FavoriteLongshotBiasStrategy()
    except Exception:
        pass

    try:
        strategies['herding'] = HerdingStrategy()
    except Exception:
        pass

    try:
        strategies['overreaction'] = OverreactionStrategy()
    except Exception:
        pass

    # Structural strategies
    try:
        strategies['liquidity_vacuum'] = LiquidityVacuumStrategy()
    except Exception:
        pass

    try:
        strategies['spread_exploitation'] = SpreadExploitationStrategy()
    except Exception:
        pass

    try:
        strategies['order_book_imbalance'] = OrderBookImbalanceStrategy()
    except Exception:
        pass

    try:
        strategies['late_resolution'] = LateResolutionStrategy()
    except Exception:
        pass

    # Mispricing strategies
    try:
        strategies['forecast_divergence'] = ForecastDivergenceStrategy()
    except Exception:
        pass

    try:
        strategies['cross_market_arbitrage'] = CrossMarketArbitrageStrategy()
    except Exception:
        pass

    try:
        strategies['slow_updating'] = SlowUpdatingMarketStrategy()
    except Exception:
        pass

    return strategies


__all__ = [
    'Strategy',
    'StrategyConfig',
    'StrategyResult',
    'get_all_strategies',
    # Behavioral
    'AnchoringBiasStrategy',
    'FavoriteLongshotBiasStrategy',
    'HerdingStrategy',
    'OverreactionStrategy',
    # Structural
    'LiquidityVacuumStrategy',
    'SpreadExploitationStrategy',
    'OrderBookImbalanceStrategy',
    'LateResolutionStrategy',
    # Mispricing
    'ForecastDivergenceStrategy',
    'CrossMarketArbitrageStrategy',
    'SlowUpdatingMarketStrategy',
]
