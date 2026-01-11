"""
Data ingestion module for the Prediction Market Research Platform.

This module handles all data collection, validation, and storage operations.
"""

from .models import (
    MarketSource,
    MarketStatus,
    OutcomeResult,
    OrderBookLevel,
    OrderBook,
    MarketSnapshot,
    PriceHistory,
    MarketResolution,
    Signal,
    Opportunity,
    BacktestTrade,
    BacktestResult,
)
from .database import Database, get_database
from .polymarket_collector import PolymarketCollector
from .kalshi_collector import KalshiCollector
from .validation import DataValidator

__all__ = [
    # Enums
    'MarketSource',
    'MarketStatus',
    'OutcomeResult',
    # Models
    'OrderBookLevel',
    'OrderBook',
    'MarketSnapshot',
    'PriceHistory',
    'MarketResolution',
    'Signal',
    'Opportunity',
    'BacktestTrade',
    'BacktestResult',
    # Database
    'Database',
    'get_database',
    # Collectors
    'PolymarketCollector',
    'KalshiCollector',
    # Validation
    'DataValidator',
]
