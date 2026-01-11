"""
Research Module.

Provides tools and examples for prediction market research:
- Strategy analysis and comparison
- Data exploration
- Performance evaluation
- Edge research
"""

from .strategy_analysis import (
    StrategyAnalyzer,
    StrategyComparison,
    SignalQualityMetrics,
    generate_strategy_report
)

__all__ = [
    'StrategyAnalyzer',
    'StrategyComparison',
    'SignalQualityMetrics',
    'generate_strategy_report'
]
