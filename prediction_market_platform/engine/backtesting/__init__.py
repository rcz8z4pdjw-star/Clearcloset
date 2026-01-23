"""
Backtesting engine for strategy evaluation.

Replays historical markets to evaluate strategy performance.
"""

from .engine import BacktestEngine, run_backtest

__all__ = [
    'BacktestEngine',
    'run_backtest',
]
