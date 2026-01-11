"""
Feature Engineering Module.

Extracts and transforms raw market data into features for strategy analysis.
"""

from .features import FeatureExtractor, MarketFeatures
from .indicators import TechnicalIndicators

__all__ = [
    'FeatureExtractor',
    'MarketFeatures',
    'TechnicalIndicators',
]
