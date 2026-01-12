"""
Signal Generation Engine.

Orchestrates the execution of strategies across markets
and aggregates signals for opportunity ranking.
"""

from typing import List, Optional, Dict, Any, Type
from datetime import datetime
from dataclasses import dataclass
import traceback

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, Signal, MarketSource
)
from engine.data_ingestion.database import Database, get_database
from strategies.base import Strategy, StrategyResult, StrategyConfig, EnsembleStrategy

# Import all strategies
from strategies.structural_edges import (
    LiquidityVacuumStrategy,
    SpreadExploitationStrategy,
    OrderBookImbalanceStrategy,
    LateResolutionStrategy,
)
from strategies.behavioral_edges import (
    FavoriteLongshotBiasStrategy,
    OverreactionStrategy,
    HerdingStrategy,
    AnchoringBiasStrategy,
)
from strategies.mispricing_models import (
    CrossMarketArbitrageStrategy,
    ForecastDivergenceStrategy,
    SlowUpdatingMarketStrategy,
)
from utils.logging_setup import get_logger
from utils.config_loader import get_config, get_strategy_config

logger = get_logger("signal_engine")


# Registry of all available strategies
STRATEGY_REGISTRY: Dict[str, Type[Strategy]] = {
    # Structural
    'liquidity_vacuum': LiquidityVacuumStrategy,
    'spread_exploitation': SpreadExploitationStrategy,
    'order_book_imbalance': OrderBookImbalanceStrategy,
    'late_resolution_inefficiency': LateResolutionStrategy,

    # Behavioral
    'favorite_longshot_bias': FavoriteLongshotBiasStrategy,
    'overreaction': OverreactionStrategy,
    'herding': HerdingStrategy,
    'anchoring_bias': AnchoringBiasStrategy,

    # Informational
    'cross_market_arbitrage': CrossMarketArbitrageStrategy,
    'forecast_divergence': ForecastDivergenceStrategy,
    'slow_updating_market': SlowUpdatingMarketStrategy,
}


@dataclass
class SignalBatch:
    """Collection of signals from a signal generation run."""
    timestamp: datetime
    signals: List[StrategyResult]
    markets_analyzed: int
    strategies_run: int
    errors: List[str]

    @property
    def total_signals(self) -> int:
        return len(self.signals)

    @property
    def signals_by_strategy(self) -> Dict[str, int]:
        counts = {}
        for signal in self.signals:
            counts[signal.strategy_name] = counts.get(signal.strategy_name, 0) + 1
        return counts


class SignalEngine:
    """
    Orchestrates strategy execution across markets.

    The SignalEngine:
    1. Loads strategies from configuration
    2. Runs strategies against market data
    3. Aggregates and filters signals
    4. Stores signals to database
    """

    def __init__(
        self,
        db: Optional[Database] = None,
        strategies: Optional[List[Strategy]] = None
    ):
        """
        Initialize signal engine.

        Args:
            db: Database for market data and signal storage
            strategies: List of strategies to run (default: load from config)
        """
        self.db = db or get_database()
        self.strategies = strategies or self._load_strategies_from_config()

        logger.info(f"SignalEngine initialized with {len(self.strategies)} strategies")

    def _load_strategies_from_config(self) -> List[Strategy]:
        """Load and initialize strategies from configuration."""
        strategies = []

        # Load structural strategies
        structural_config = get_config('strategies.structural', {})
        for name, config in structural_config.items():
            if config.get('enabled', False) and name in STRATEGY_REGISTRY:
                strategy_class = STRATEGY_REGISTRY[name]
                strategy_config = StrategyConfig(
                    enabled=True,
                    weight=config.get('weight', 1.0),
                    params=config
                )
                strategies.append(strategy_class(strategy_config))
                logger.debug(f"Loaded strategy: {name}")

        # Load behavioral strategies
        behavioral_config = get_config('strategies.behavioral', {})
        for name, config in behavioral_config.items():
            if config.get('enabled', False) and name in STRATEGY_REGISTRY:
                strategy_class = STRATEGY_REGISTRY[name]
                strategy_config = StrategyConfig(
                    enabled=True,
                    weight=config.get('weight', 1.0),
                    params=config
                )
                strategies.append(strategy_class(strategy_config))
                logger.debug(f"Loaded strategy: {name}")

        # Load temporal/informational strategies
        informational_config = get_config('strategies.informational', {})
        for name, config in informational_config.items():
            if config.get('enabled', False) and name in STRATEGY_REGISTRY:
                strategy_class = STRATEGY_REGISTRY[name]
                strategy_config = StrategyConfig(
                    enabled=True,
                    weight=config.get('weight', 1.0),
                    params=config
                )
                strategies.append(strategy_class(strategy_config))
                logger.debug(f"Loaded strategy: {name}")

        return strategies

    def generate_signals(
        self,
        markets: Optional[List[MarketSnapshot]] = None,
        source: Optional[MarketSource] = None,
        save_to_db: bool = True
    ) -> SignalBatch:
        """
        Generate signals for markets using all enabled strategies.

        This is the main entry point for signal generation.

        Args:
            markets: List of markets to analyze (default: load from DB)
            source: Filter markets by source
            save_to_db: Whether to save signals to database

        Returns:
            SignalBatch containing all generated signals
        """
        logger.info("Starting signal generation...")

        # Load markets if not provided
        if markets is None:
            markets = self.db.get_active_markets(source=source)

        logger.info(f"Analyzing {len(markets)} markets with {len(self.strategies)} strategies")

        all_signals: List[StrategyResult] = []
        errors: List[str] = []
        strategies_run = 0

        # Load order books and price history for all markets
        market_data = self._load_market_data(markets)

        # Run each strategy across all markets
        for strategy in self.strategies:
            if not strategy.config.enabled:
                continue

            strategies_run += 1
            strategy_signals = 0

            for snapshot in markets:
                try:
                    # Get supplementary data
                    order_book = market_data.get(snapshot.market_id, {}).get('order_book')
                    price_history = market_data.get(snapshot.market_id, {}).get('price_history')
                    related = market_data.get(snapshot.market_id, {}).get('related')

                    # Run strategy
                    result = strategy.run(
                        snapshot=snapshot,
                        order_book=order_book,
                        price_history=price_history,
                        related_markets=related
                    )

                    if result is not None:
                        all_signals.append(result)
                        strategy_signals += 1

                except Exception as e:
                    error_msg = f"Error in {strategy.name} for {snapshot.market_id}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            logger.info(f"Strategy {strategy.name}: {strategy_signals} signals")

        # Create batch
        batch = SignalBatch(
            timestamp=datetime.utcnow(),
            signals=all_signals,
            markets_analyzed=len(markets),
            strategies_run=strategies_run,
            errors=errors
        )

        # Save to database
        if save_to_db and all_signals:
            self._save_signals(all_signals)

        logger.info(f"Signal generation complete: {batch.total_signals} signals from {batch.markets_analyzed} markets")
        return batch

    def _load_market_data(
        self,
        markets: List[MarketSnapshot]
    ) -> Dict[str, Dict[str, Any]]:
        """Load supplementary data for all markets."""
        market_data = {}

        for snapshot in markets:
            market_id = snapshot.market_id

            # Load order book
            order_book = self.db.get_order_book(market_id)

            # Load price history
            price_history = self.db.get_price_history(market_id)

            # Find related markets (same category)
            related = [
                m for m in markets
                if m.market_id != market_id and m.category == snapshot.category
            ][:5]  # Limit to 5 related markets

            market_data[market_id] = {
                'order_book': order_book,
                'price_history': price_history if len(price_history) > 0 else None,
                'related': related if related else None
            }

        return market_data

    def _save_signals(self, signals: List[StrategyResult]):
        """Save signals to database."""
        for result in signals:
            signal = result.to_signal()
            self.db.save_signal(signal)

    def run_single_strategy(
        self,
        strategy_name: str,
        markets: Optional[List[MarketSnapshot]] = None
    ) -> List[StrategyResult]:
        """
        Run a single strategy across markets.

        Useful for testing and strategy-specific analysis.

        Args:
            strategy_name: Name of strategy to run
            markets: Markets to analyze

        Returns:
            List of StrategyResult signals from the strategy
        """
        # Handle aliases
        actual_name = strategy_name
        if strategy_name == 'late_resolution':
            actual_name = 'late_resolution_inefficiency'

        if actual_name not in STRATEGY_REGISTRY:
            raise ValueError(f"Unknown strategy: {strategy_name}")

        # Create strategy instance
        strategy_class = STRATEGY_REGISTRY[actual_name]
        config = get_strategy_config(
            'structural' if actual_name in ['liquidity_vacuum', 'spread_exploitation', 'order_book_imbalance', 'late_resolution_inefficiency']
            else 'behavioral' if actual_name in ['favorite_longshot_bias', 'overreaction', 'herding', 'anchoring_bias']
            else 'informational',
            actual_name
        )
        strategy = strategy_class(StrategyConfig(enabled=True, params=config))

        # Temporarily set as only strategy
        original_strategies = self.strategies
        self.strategies = [strategy]

        try:
            batch = self.generate_signals(markets=markets, save_to_db=False)
            return batch.signals
        finally:
            self.strategies = original_strategies

    def get_available_strategies(self) -> List[str]:
        """
        Get list of available strategy names.

        Returns:
            List of strategy names that can be used
        """
        # Include aliases for common strategy names
        available = list(STRATEGY_REGISTRY.keys())
        # Add aliases
        aliases = {
            'late_resolution': 'late_resolution_inefficiency',
        }
        for alias in aliases.keys():
            if alias not in available:
                available.append(alias)
        return available

    def analyze_market(
        self,
        market: MarketSnapshot,
        save_to_db: bool = False
    ) -> List[StrategyResult]:
        """
        Analyze a single market using all enabled strategies.

        This is a convenience method for analyzing individual markets.

        Args:
            market: Market snapshot to analyze
            save_to_db: Whether to save signals to database

        Returns:
            List of StrategyResult objects (signals) for the market
        """
        batch = self.generate_signals(markets=[market], save_to_db=save_to_db)
        return batch.signals

    def create_ensemble(
        self,
        strategy_names: Optional[List[str]] = None,
        voting_method: str = "weighted_average"
    ) -> EnsembleStrategy:
        """
        Create an ensemble of strategies.

        Args:
            strategy_names: Names of strategies to include (default: all enabled)
            voting_method: How to combine signals

        Returns:
            EnsembleStrategy instance
        """
        if strategy_names is None:
            strategies = self.strategies
        else:
            strategies = []
            for name in strategy_names:
                if name in STRATEGY_REGISTRY:
                    strategy_class = STRATEGY_REGISTRY[name]
                    strategies.append(strategy_class())

        return EnsembleStrategy(
            strategies=strategies,
            voting_method=voting_method
        )


def run_all_strategies(
    db: Optional[Database] = None,
    source: Optional[MarketSource] = None
) -> SignalBatch:
    """
    Convenience function to run all strategies.

    Args:
        db: Database instance
        source: Market source filter

    Returns:
        SignalBatch with all signals
    """
    engine = SignalEngine(db=db)
    return engine.generate_signals(source=source)


def get_strategy_descriptions() -> Dict[str, str]:
    """Get descriptions of all available strategies."""
    descriptions = {}
    for name, strategy_class in STRATEGY_REGISTRY.items():
        instance = strategy_class()
        descriptions[name] = {
            'name': instance.name,
            'category': instance.category,
            'description': instance.description
        }
    return descriptions


def get_available_strategy_names() -> List[str]:
    """Get list of available strategy names."""
    return list(STRATEGY_REGISTRY.keys())
