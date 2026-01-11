"""
Behavioral Edge Strategies.

These strategies exploit systematic human biases in prediction markets:
- Favorite-longshot bias
- Overreaction to news
- Herding behavior
- Anchoring bias

Behavioral edges are rooted in cognitive psychology and have been
extensively documented in both academic literature and practice.
"""

from .favorite_longshot_bias import FavoriteLongshotBiasStrategy
from .overreaction import OverreactionStrategy
from .herding import HerdingStrategy
from .anchoring import AnchoringBiasStrategy

__all__ = [
    'FavoriteLongshotBiasStrategy',
    'OverreactionStrategy',
    'HerdingStrategy',
    'AnchoringBiasStrategy',
]
