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

from .base import Strategy, StrategyConfig, StrategyResult

__all__ = [
    'Strategy',
    'StrategyConfig',
    'StrategyResult',
]
