"""
Technical Indicators for Prediction Markets.

Adapts traditional technical analysis indicators for probability-based markets.
Note: Prediction markets differ from traditional markets:
- Prices are bounded [0, 1]
- Settlement is binary (usually)
- No dividends or splits
- Time horizon is finite

These indicators are adapted accordingly.
"""

from typing import List, Optional, Tuple
import math


class TechnicalIndicators:
    """
    Technical analysis indicators adapted for prediction markets.

    All methods are static for easy use without instantiation.
    """

    @staticmethod
    def sma(prices: List[float], period: int = 20) -> List[float]:
        """
        Simple Moving Average.

        Args:
            prices: List of prices
            period: SMA period

        Returns:
            List of SMA values (length = len(prices) - period + 1)
        """
        if len(prices) < period:
            return []

        result = []
        for i in range(period - 1, len(prices)):
            window = prices[i - period + 1:i + 1]
            result.append(sum(window) / period)

        return result

    @staticmethod
    def ema(prices: List[float], period: int = 20) -> List[float]:
        """
        Exponential Moving Average.

        Args:
            prices: List of prices
            period: EMA period

        Returns:
            List of EMA values (same length as prices)
        """
        if len(prices) < period:
            return []

        alpha = 2 / (period + 1)
        ema_values = [prices[0]]

        for i in range(1, len(prices)):
            ema_values.append(alpha * prices[i] + (1 - alpha) * ema_values[-1])

        return ema_values

    @staticmethod
    def rsi(prices: List[float], period: int = 14) -> List[float]:
        """
        Relative Strength Index adapted for probability markets.

        RSI measures momentum and overbought/oversold conditions.
        For prediction markets:
        - RSI > 70: Probability may be overextended upward
        - RSI < 30: Probability may be overextended downward

        Args:
            prices: List of prices
            period: RSI period (default 14)

        Returns:
            List of RSI values (0-100)
        """
        if len(prices) < period + 1:
            return []

        rsi_values = []

        for end_idx in range(period, len(prices)):
            window_prices = prices[end_idx - period:end_idx + 1]

            gains = []
            losses = []

            for i in range(1, len(window_prices)):
                change = window_prices[i] - window_prices[i - 1]
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(abs(change))

            avg_gain = sum(gains) / period if gains else 0
            avg_loss = sum(losses) / period if losses else 0

            if avg_loss == 0:
                rsi_values.append(100.0)
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                rsi_values.append(rsi)

        return rsi_values

    @staticmethod
    def bollinger_bands(
        prices: List[float],
        period: int = 20,
        std_dev: float = 2.0
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        Bollinger Bands for prediction markets.

        Measures volatility and potential reversal points.
        Adapted for bounded [0, 1] prices.

        Args:
            prices: List of prices
            period: Moving average period
            std_dev: Standard deviation multiplier

        Returns:
            Tuple of (upper_bands, middle_bands, lower_bands) as lists
        """
        if len(prices) < period:
            return ([], [], [])

        upper_bands = []
        middle_bands = []
        lower_bands = []

        for i in range(period - 1, len(prices)):
            window = prices[i - period + 1:i + 1]

            # Middle band (SMA)
            middle = sum(window) / period

            # Standard deviation
            variance = sum((p - middle) ** 2 for p in window) / period
            std = math.sqrt(variance)

            # Bands
            upper = min(middle + (std_dev * std), 0.99)  # Cap at 99%
            lower = max(middle - (std_dev * std), 0.01)  # Floor at 1%

            upper_bands.append(upper)
            middle_bands.append(middle)
            lower_bands.append(lower)

        return (upper_bands, middle_bands, lower_bands)

    @staticmethod
    def macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Optional[Tuple[float, float, float]]:
        """
        MACD (Moving Average Convergence Divergence).

        Identifies trend direction and momentum.

        Args:
            prices: List of prices
            fast_period: Fast EMA period
            slow_period: Slow EMA period
            signal_period: Signal line period

        Returns:
            Tuple of (macd_line, signal_line, histogram) or None
        """
        if len(prices) < slow_period + signal_period:
            return None

        # Calculate EMAs
        fast_ema = TechnicalIndicators._ema(prices, fast_period)
        slow_ema = TechnicalIndicators._ema(prices, slow_period)

        if fast_ema is None or slow_ema is None:
            return None

        # MACD line
        macd_line = fast_ema[-1] - slow_ema[-1]

        # Calculate MACD history for signal line
        macd_history = []
        for i in range(slow_period - 1, len(prices)):
            fast = TechnicalIndicators._ema(prices[:i + 1], fast_period)
            slow = TechnicalIndicators._ema(prices[:i + 1], slow_period)
            if fast and slow:
                macd_history.append(fast[-1] - slow[-1])

        if len(macd_history) < signal_period:
            return None

        # Signal line (EMA of MACD)
        signal_ema = TechnicalIndicators._ema(macd_history, signal_period)
        if signal_ema is None:
            return None

        signal_line = signal_ema[-1]
        histogram = macd_line - signal_line

        return (macd_line, signal_line, histogram)

    @staticmethod
    def stochastic(
        prices: List[float],
        period: int = 14,
        smooth_k: int = 3,
        smooth_d: int = 3
    ) -> Optional[Tuple[float, float]]:
        """
        Stochastic Oscillator.

        Measures position of price relative to recent range.

        Args:
            prices: List of prices
            period: Lookback period
            smooth_k: %K smoothing period
            smooth_d: %D smoothing period

        Returns:
            Tuple of (%K, %D) or None
        """
        if len(prices) < period + smooth_k + smooth_d:
            return None

        # Calculate raw %K values
        k_values = []
        for i in range(period - 1, len(prices)):
            window = prices[i - period + 1:i + 1]
            high = max(window)
            low = min(window)

            if high == low:
                k_values.append(50)  # Neutral
            else:
                k = 100 * (prices[i] - low) / (high - low)
                k_values.append(k)

        # Smooth %K
        if len(k_values) < smooth_k:
            return None

        smooth_k_values = []
        for i in range(smooth_k - 1, len(k_values)):
            avg = sum(k_values[i - smooth_k + 1:i + 1]) / smooth_k
            smooth_k_values.append(avg)

        # Calculate %D (SMA of %K)
        if len(smooth_k_values) < smooth_d:
            return None

        d = sum(smooth_k_values[-smooth_d:]) / smooth_d
        k = smooth_k_values[-1]

        return (k, d)

    @staticmethod
    def atr(
        prices: List[float],
        period: int = 14
    ) -> Optional[float]:
        """
        Average True Range adapted for prediction markets.

        Since we don't have high/low/close, we use price changes as proxy.

        Args:
            prices: List of prices
            period: ATR period

        Returns:
            ATR value or None
        """
        if len(prices) < period + 1:
            return None

        # Calculate "true range" as absolute price change
        true_ranges = []
        for i in range(1, len(prices)):
            tr = abs(prices[i] - prices[i - 1])
            true_ranges.append(tr)

        # Average of recent true ranges
        recent_tr = true_ranges[-period:]
        atr = sum(recent_tr) / period

        return atr

    @staticmethod
    def support_resistance(
        prices: List[float],
        lookback: int = 50,
        tolerance: float = 0.02
    ) -> Tuple[List[float], List[float]]:
        """
        Identify support and resistance levels.

        For prediction markets, these often occur at round numbers
        and psychologically significant levels.

        Args:
            prices: List of prices
            lookback: Period to analyze
            tolerance: Price proximity tolerance

        Returns:
            Tuple of (support_levels, resistance_levels)
        """
        if len(prices) < lookback:
            recent = prices
        else:
            recent = prices[-lookback:]

        # Find local minima (support) and maxima (resistance)
        supports = []
        resistances = []

        for i in range(2, len(recent) - 2):
            # Local minimum
            if (recent[i] < recent[i - 1] and recent[i] < recent[i - 2] and
                    recent[i] < recent[i + 1] and recent[i] < recent[i + 2]):
                supports.append(recent[i])

            # Local maximum
            if (recent[i] > recent[i - 1] and recent[i] > recent[i - 2] and
                    recent[i] > recent[i + 1] and recent[i] > recent[i + 2]):
                resistances.append(recent[i])

        # Add psychological levels
        psychological = [0.10, 0.25, 0.33, 0.50, 0.67, 0.75, 0.90]
        current_price = prices[-1]

        for level in psychological:
            if level < current_price - tolerance:
                supports.append(level)
            elif level > current_price + tolerance:
                resistances.append(level)

        # Remove duplicates within tolerance
        supports = TechnicalIndicators._cluster_levels(supports, tolerance)
        resistances = TechnicalIndicators._cluster_levels(resistances, tolerance)

        return (sorted(supports), sorted(resistances))

    @staticmethod
    def mean_reversion_signal(
        prices: List[float],
        period: int = 20,
        threshold: float = 2.0
    ) -> Optional[float]:
        """
        Mean reversion signal strength.

        Returns a signal based on distance from moving average.
        Positive = price below MA (potential buy)
        Negative = price above MA (potential sell)

        Args:
            prices: List of prices
            period: Moving average period
            threshold: Z-score threshold for signal

        Returns:
            Signal strength (-1 to 1) or None
        """
        if len(prices) < period:
            return None

        recent = prices[-period:]
        ma = sum(recent) / period

        # Standard deviation
        variance = sum((p - ma) ** 2 for p in recent) / period
        std = math.sqrt(variance) if variance > 0 else 0.01

        # Z-score
        z = (prices[-1] - ma) / std

        # Signal (negative z = buy signal)
        if abs(z) < threshold:
            return 0

        # Scale to -1 to 1
        signal = -z / (threshold * 2)
        return max(-1, min(1, signal))

    @staticmethod
    def momentum_score(
        prices: List[float],
        short_period: int = 5,
        long_period: int = 20
    ) -> Optional[float]:
        """
        Momentum score based on multiple timeframes.

        Positive = upward momentum
        Negative = downward momentum

        Args:
            prices: List of prices
            short_period: Short-term period
            long_period: Long-term period

        Returns:
            Momentum score (-1 to 1) or None
        """
        if len(prices) < long_period:
            return None

        current = prices[-1]

        # Short-term momentum
        short_ma = sum(prices[-short_period:]) / short_period
        short_momentum = (current - short_ma) / short_ma if short_ma > 0 else 0

        # Long-term momentum
        long_ma = sum(prices[-long_period:]) / long_period
        long_momentum = (current - long_ma) / long_ma if long_ma > 0 else 0

        # Combined score
        score = (short_momentum * 0.6 + long_momentum * 0.4) * 10  # Scale
        return max(-1, min(1, score))

    @staticmethod
    def _ema(values: List[float], period: int) -> Optional[List[float]]:
        """Calculate EMA series."""
        if len(values) < period:
            return None

        alpha = 2 / (period + 1)
        ema = [values[0]]

        for i in range(1, len(values)):
            ema.append(alpha * values[i] + (1 - alpha) * ema[-1])

        return ema

    @staticmethod
    def _cluster_levels(levels: List[float], tolerance: float) -> List[float]:
        """Cluster nearby levels into single levels."""
        if not levels:
            return []

        levels = sorted(levels)
        clustered = [levels[0]]

        for level in levels[1:]:
            if level - clustered[-1] > tolerance:
                clustered.append(level)
            else:
                # Average with existing cluster
                clustered[-1] = (clustered[-1] + level) / 2

        return clustered


def calculate_all_indicators(prices: List[float]) -> dict:
    """
    Calculate all technical indicators for a price series.

    Args:
        prices: List of prices

    Returns:
        Dictionary of indicator values
    """
    indicators = {}

    # RSI
    indicators['rsi'] = TechnicalIndicators.rsi(prices)

    # Bollinger Bands
    bb = TechnicalIndicators.bollinger_bands(prices)
    if bb:
        indicators['bb_lower'], indicators['bb_middle'], indicators['bb_upper'] = bb
        indicators['bb_width'] = bb[2] - bb[0]
        # Price position within bands (0 = at lower, 1 = at upper)
        if bb[2] - bb[0] > 0:
            indicators['bb_position'] = (prices[-1] - bb[0]) / (bb[2] - bb[0])

    # MACD
    macd = TechnicalIndicators.macd(prices)
    if macd:
        indicators['macd_line'], indicators['macd_signal'], indicators['macd_histogram'] = macd

    # Stochastic
    stoch = TechnicalIndicators.stochastic(prices)
    if stoch:
        indicators['stoch_k'], indicators['stoch_d'] = stoch

    # ATR
    indicators['atr'] = TechnicalIndicators.atr(prices)

    # Support/Resistance
    support, resistance = TechnicalIndicators.support_resistance(prices)
    indicators['support_levels'] = support
    indicators['resistance_levels'] = resistance
    if support:
        indicators['nearest_support'] = max(s for s in support if s < prices[-1]) if any(s < prices[-1] for s in support) else None
    if resistance:
        indicators['nearest_resistance'] = min(r for r in resistance if r > prices[-1]) if any(r > prices[-1] for r in resistance) else None

    # Mean reversion
    indicators['mean_reversion_signal'] = TechnicalIndicators.mean_reversion_signal(prices)

    # Momentum
    indicators['momentum_score'] = TechnicalIndicators.momentum_score(prices)

    return indicators
