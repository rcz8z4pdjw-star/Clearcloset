"""
Performance tracking and analysis module.

Tracks signal accuracy, strategy performance, and provides
detailed analytics on trading decisions.
"""

from .tracker import (
    PerformanceTracker,
    SignalRecord,
    StrategyPerformance,
    create_performance_tracker
)

__all__ = [
    'PerformanceTracker',
    'SignalRecord',
    'StrategyPerformance',
    'create_performance_tracker'
]
