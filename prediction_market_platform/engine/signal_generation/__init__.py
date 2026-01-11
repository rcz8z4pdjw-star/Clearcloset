"""
Signal generation engine for the Prediction Market Research Platform.

This module orchestrates strategy execution and signal aggregation.
"""

from .engine import SignalEngine, run_all_strategies

__all__ = [
    'SignalEngine',
    'run_all_strategies',
]
