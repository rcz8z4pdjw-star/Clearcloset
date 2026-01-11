"""
Feature Extraction for Prediction Markets.

Transforms raw market data into features used by strategies.
Features are designed to capture:
- Price dynamics
- Liquidity conditions
- Market microstructure
- Temporal patterns
- Cross-market relationships
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import math

from ..data_ingestion.models import (
    MarketSnapshot, OrderBook, PriceHistory, MarketSource
)
from ...utils.helpers import (
    moving_average, exponential_moving_average, z_score,
    calculate_volatility, percentile_rank
)


@dataclass
class MarketFeatures:
    """
    Extracted features for a market.

    Features are grouped by category:
    - Price features
    - Volume features
    - Liquidity features
    - Temporal features
    - Microstructure features
    """
    market_id: str
    timestamp: datetime

    # Price Features
    price: float = 0.5
    price_ma_5: Optional[float] = None  # 5-period moving average
    price_ma_20: Optional[float] = None  # 20-period moving average
    price_ema_10: Optional[float] = None  # 10-period EMA
    price_momentum: Optional[float] = None  # Price change rate
    price_acceleration: Optional[float] = None  # Change in momentum
    price_zscore: Optional[float] = None  # Z-score vs historical

    # Volatility Features
    volatility_5: Optional[float] = None  # 5-period volatility
    volatility_20: Optional[float] = None  # 20-period volatility
    volatility_ratio: Optional[float] = None  # Short/long vol ratio

    # Volume Features
    volume_24h: float = 0
    volume_ma_5: Optional[float] = None
    volume_zscore: Optional[float] = None
    volume_price_correlation: Optional[float] = None

    # Liquidity Features
    liquidity: float = 0
    spread: Optional[float] = None
    spread_pct: Optional[float] = None
    bid_depth: float = 0
    ask_depth: float = 0
    order_imbalance: float = 0

    # Temporal Features
    hours_to_resolution: Optional[float] = None
    days_since_creation: Optional[float] = None
    time_decay_factor: Optional[float] = None  # Exponential decay
    is_weekend: bool = False
    hour_of_day: int = 0

    # Microstructure Features
    trade_intensity: Optional[float] = None  # Trades per hour
    price_impact: Optional[float] = None  # Volume needed for 1% move
    effective_spread: Optional[float] = None

    # Extreme Features (binary flags)
    is_near_resolution: bool = False  # < 24h
    is_very_near_resolution: bool = False  # < 6h
    is_extreme_price: bool = False  # < 10% or > 90%
    is_thin_market: bool = False  # Low liquidity
    is_wide_spread: bool = False  # Spread > 5%
    is_high_volume: bool = False  # Volume spike

    # Cross-market Features
    cross_platform_divergence: Optional[float] = None
    category_avg_divergence: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

    def to_feature_vector(self) -> List[float]:
        """Convert numeric features to vector for ML models."""
        features = []
        for key, value in self.__dict__.items():
            if key.startswith('_') or key in ['market_id', 'timestamp']:
                continue
            if isinstance(value, bool):
                features.append(1.0 if value else 0.0)
            elif isinstance(value, (int, float)) and value is not None:
                features.append(float(value))
        return features


class FeatureExtractor:
    """
    Extracts features from market data.

    Usage:
        extractor = FeatureExtractor()
        features = extractor.extract(snapshot, order_book, price_history)
    """

    def __init__(
        self,
        ma_short: int = 5,
        ma_long: int = 20,
        ema_period: int = 10,
        volatility_short: int = 5,
        volatility_long: int = 20
    ):
        """
        Initialize feature extractor.

        Args:
            ma_short: Short moving average period
            ma_long: Long moving average period
            ema_period: EMA period
            volatility_short: Short volatility window
            volatility_long: Long volatility window
        """
        self.ma_short = ma_short
        self.ma_long = ma_long
        self.ema_period = ema_period
        self.vol_short = volatility_short
        self.vol_long = volatility_long

    def extract(
        self,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook] = None,
        price_history: Optional[PriceHistory] = None,
        related_markets: Optional[List[MarketSnapshot]] = None
    ) -> MarketFeatures:
        """
        Extract all features from market data.

        Args:
            snapshot: Current market state
            order_book: Order book data
            price_history: Historical prices
            related_markets: Related markets for cross-analysis

        Returns:
            MarketFeatures object with all extracted features
        """
        features = MarketFeatures(
            market_id=snapshot.market_id,
            timestamp=snapshot.timestamp
        )

        # Extract each feature category
        self._extract_price_features(features, snapshot, price_history)
        self._extract_volume_features(features, snapshot, price_history)
        self._extract_liquidity_features(features, snapshot, order_book)
        self._extract_temporal_features(features, snapshot)
        self._extract_microstructure_features(features, snapshot, order_book, price_history)
        self._extract_extreme_features(features, snapshot)
        self._extract_cross_market_features(features, snapshot, related_markets)

        return features

    def _extract_price_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot,
        price_history: Optional[PriceHistory]
    ):
        """Extract price-related features."""
        features.price = snapshot.mid_price

        if price_history is None or len(price_history) < 2:
            return

        prices = price_history.prices

        # Moving averages
        if len(prices) >= self.ma_short:
            ma_short = moving_average(prices, self.ma_short)
            features.price_ma_5 = ma_short[-1]

        if len(prices) >= self.ma_long:
            ma_long = moving_average(prices, self.ma_long)
            features.price_ma_20 = ma_long[-1]

        # EMA
        if len(prices) >= self.ema_period:
            ema = exponential_moving_average(prices, self.ema_period)
            features.price_ema_10 = ema[-1]

        # Momentum (rate of change)
        if len(prices) >= 2:
            features.price_momentum = prices[-1] - prices[-2]

        # Acceleration (change in momentum)
        if len(prices) >= 3:
            momentum_prev = prices[-2] - prices[-3]
            momentum_curr = prices[-1] - prices[-2]
            features.price_acceleration = momentum_curr - momentum_prev

        # Z-score
        if len(prices) >= 10:
            features.price_zscore = z_score(prices[-1], prices[-20:] if len(prices) >= 20 else prices)

        # Volatility
        if len(prices) >= self.vol_short:
            features.volatility_5 = calculate_volatility(prices, self.vol_short)

        if len(prices) >= self.vol_long:
            features.volatility_20 = calculate_volatility(prices, self.vol_long)

        if features.volatility_5 and features.volatility_20 and features.volatility_20 > 0:
            features.volatility_ratio = features.volatility_5 / features.volatility_20

    def _extract_volume_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot,
        price_history: Optional[PriceHistory]
    ):
        """Extract volume-related features."""
        features.volume_24h = snapshot.volume_24h or 0

        if price_history is None or not price_history.volumes:
            return

        volumes = price_history.volumes

        # Volume MA
        if len(volumes) >= self.ma_short:
            vol_ma = moving_average(volumes, self.ma_short)
            features.volume_ma_5 = vol_ma[-1]

        # Volume Z-score
        if len(volumes) >= 10:
            features.volume_zscore = z_score(
                volumes[-1] if volumes else 0,
                volumes[-20:] if len(volumes) >= 20 else volumes
            )

        # Volume-price correlation
        if price_history and len(price_history.prices) >= 5 and len(volumes) >= 5:
            features.volume_price_correlation = self._calculate_correlation(
                price_history.prices[-10:],
                volumes[-10:]
            )

    def _extract_liquidity_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook]
    ):
        """Extract liquidity-related features."""
        features.liquidity = snapshot.liquidity or 0
        features.spread = snapshot.spread

        if snapshot.spread and snapshot.mid_price > 0:
            features.spread_pct = snapshot.spread / snapshot.mid_price

        if order_book:
            features.bid_depth = order_book.bid_liquidity
            features.ask_depth = order_book.ask_liquidity
            features.order_imbalance = order_book.order_imbalance

            # Effective spread (accounting for depth)
            if order_book.best_bid and order_book.best_ask:
                features.effective_spread = order_book.best_ask - order_book.best_bid

    def _extract_temporal_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot
    ):
        """Extract time-related features."""
        features.hours_to_resolution = snapshot.hours_to_resolution

        if snapshot.created_at:
            delta = snapshot.timestamp - snapshot.created_at
            features.days_since_creation = delta.total_seconds() / 86400

        # Time decay factor (exponential decay toward resolution)
        if features.hours_to_resolution and features.hours_to_resolution > 0:
            # Decay accelerates as resolution approaches
            features.time_decay_factor = math.exp(-features.hours_to_resolution / 168)  # 1 week decay

        # Calendar features
        features.is_weekend = snapshot.timestamp.weekday() >= 5
        features.hour_of_day = snapshot.timestamp.hour

    def _extract_microstructure_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot,
        order_book: Optional[OrderBook],
        price_history: Optional[PriceHistory]
    ):
        """Extract market microstructure features."""
        # Trade intensity (rough estimate from volume)
        if features.days_since_creation and features.days_since_creation > 0:
            total_volume = snapshot.total_volume or 0
            features.trade_intensity = total_volume / (features.days_since_creation * 24)

        # Price impact (rough estimate)
        if order_book and order_book.total_liquidity > 0:
            # How much $ needed to move price 1%
            features.price_impact = order_book.total_liquidity * 0.01

    def _extract_extreme_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot
    ):
        """Extract binary extreme condition flags."""
        # Resolution proximity
        if features.hours_to_resolution:
            features.is_near_resolution = features.hours_to_resolution < 24
            features.is_very_near_resolution = features.hours_to_resolution < 6

        # Price extremes
        price = features.price
        features.is_extreme_price = price < 0.10 or price > 0.90

        # Liquidity conditions
        features.is_thin_market = features.liquidity < 1000

        # Spread conditions
        if features.spread_pct:
            features.is_wide_spread = features.spread_pct > 0.05

        # Volume conditions
        if features.volume_zscore:
            features.is_high_volume = features.volume_zscore > 2.0

    def _extract_cross_market_features(
        self,
        features: MarketFeatures,
        snapshot: MarketSnapshot,
        related_markets: Optional[List[MarketSnapshot]]
    ):
        """Extract cross-market comparison features."""
        if not related_markets:
            return

        # Cross-platform divergence
        other_platforms = [m for m in related_markets if m.source != snapshot.source]
        if other_platforms:
            other_prices = [m.mid_price for m in other_platforms]
            avg_other = sum(other_prices) / len(other_prices)
            features.cross_platform_divergence = snapshot.mid_price - avg_other

        # Category average divergence
        same_category = [
            m for m in related_markets
            if m.category == snapshot.category and m.market_id != snapshot.market_id
        ]
        if same_category:
            category_prices = [m.mid_price for m in same_category]
            category_avg = sum(category_prices) / len(category_prices)
            features.category_avg_divergence = snapshot.mid_price - category_avg

    def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        n = min(len(x), len(y))
        if n < 2:
            return 0

        x = x[-n:]
        y = y[-n:]

        mean_x = sum(x) / n
        mean_y = sum(y) / n

        numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))

        var_x = sum((xi - mean_x) ** 2 for xi in x)
        var_y = sum((yi - mean_y) ** 2 for yi in y)

        denominator = math.sqrt(var_x * var_y)

        if denominator == 0:
            return 0

        return numerator / denominator

    def extract_batch(
        self,
        snapshots: List[MarketSnapshot],
        order_books: Optional[Dict[str, OrderBook]] = None,
        price_histories: Optional[Dict[str, PriceHistory]] = None
    ) -> List[MarketFeatures]:
        """
        Extract features for multiple markets.

        Args:
            snapshots: List of market snapshots
            order_books: Order books keyed by market_id
            price_histories: Price histories keyed by market_id

        Returns:
            List of MarketFeatures objects
        """
        order_books = order_books or {}
        price_histories = price_histories or {}

        features_list = []
        for snapshot in snapshots:
            features = self.extract(
                snapshot=snapshot,
                order_book=order_books.get(snapshot.market_id),
                price_history=price_histories.get(snapshot.market_id),
                related_markets=[s for s in snapshots if s.market_id != snapshot.market_id]
            )
            features_list.append(features)

        return features_list


def compute_market_regime(features: MarketFeatures) -> str:
    """
    Classify market into regime based on features.

    Regimes:
    - trending_up: Strong upward momentum
    - trending_down: Strong downward momentum
    - mean_reverting: Price oscillating around mean
    - volatile: High volatility, no clear direction
    - quiet: Low volatility, stable
    - resolution_imminent: Very close to resolution
    """
    if features.is_very_near_resolution:
        return "resolution_imminent"

    if features.volatility_5 and features.volatility_5 > 0.15:
        return "volatile"

    if features.price_momentum:
        if features.price_momentum > 0.02:
            return "trending_up"
        elif features.price_momentum < -0.02:
            return "trending_down"

    if features.volatility_5 and features.volatility_5 < 0.03:
        return "quiet"

    return "mean_reverting"
