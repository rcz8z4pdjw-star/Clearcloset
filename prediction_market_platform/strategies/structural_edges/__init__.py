"""
Structural Edge Strategies.

These strategies exploit market microstructure inefficiencies:
- Liquidity vacuums
- Wide spreads
- Order book imbalances
- Late-resolution convergence

Structural edges are often the most reliable because they stem from
mechanical market properties rather than behavioral predictions.
"""

from .liquidity_vacuum import LiquidityVacuumStrategy
from .spread_exploitation import SpreadExploitationStrategy
from .order_book_imbalance import OrderBookImbalanceStrategy
from .late_resolution import LateResolutionStrategy

__all__ = [
    'LiquidityVacuumStrategy',
    'SpreadExploitationStrategy',
    'OrderBookImbalanceStrategy',
    'LateResolutionStrategy',
]
