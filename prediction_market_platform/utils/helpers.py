"""
Mathematical and utility helper functions for prediction market analysis.

These functions provide the core quantitative foundations for edge detection,
signal generation, and performance evaluation.
"""

import math
from datetime import datetime, timezone
from typing import List, Optional, Union, Tuple
import numpy as np


# ==============================================================================
# PROBABILITY & ODDS CONVERSIONS
# ==============================================================================

def probability_to_odds(prob: float) -> float:
    """
    Convert probability to decimal odds.

    Decimal odds represent the total payout per unit staked.
    E.g., prob=0.5 -> odds=2.0 (bet $1, get $2 if win)

    Args:
        prob: Probability between 0 and 1

    Returns:
        Decimal odds (>= 1.0)
    """
    if prob <= 0:
        return float('inf')
    if prob >= 1:
        return 1.0
    return 1.0 / prob


def odds_to_probability(odds: float) -> float:
    """
    Convert decimal odds to implied probability.

    Args:
        odds: Decimal odds (>= 1.0)

    Returns:
        Implied probability between 0 and 1
    """
    if odds <= 0:
        return 1.0
    if odds == float('inf'):
        return 0.0
    return 1.0 / odds


def american_to_probability(american_odds: int) -> float:
    """
    Convert American odds to implied probability.

    American odds:
    - Positive (+150): Amount won on $100 bet
    - Negative (-150): Amount needed to win $100

    Args:
        american_odds: American odds format

    Returns:
        Implied probability between 0 and 1
    """
    if american_odds > 0:
        return 100 / (american_odds + 100)
    else:
        return abs(american_odds) / (abs(american_odds) + 100)


# ==============================================================================
# EXPECTED VALUE CALCULATIONS
# ==============================================================================

def calculate_expected_value(
    true_probability: float,
    market_probability: float,
    side: str = "yes"
) -> float:
    """
    Calculate expected value of a bet.

    This is the core edge calculation:
    EV = (true_prob * payout) - (1 - true_prob) * stake

    For a $1 bet:
    EV = true_prob * (1/market_prob) - 1

    Args:
        true_probability: Your estimated true probability (0-1)
        market_probability: Market implied probability (0-1)
        side: "yes" or "no"

    Returns:
        Expected value as a decimal (0.05 = 5% edge)

    Example:
        >>> calculate_expected_value(0.6, 0.5, "yes")
        0.2  # 20% expected edge
    """
    if side == "no":
        true_probability = 1 - true_probability
        market_probability = 1 - market_probability

    if market_probability <= 0:
        return float('inf') if true_probability > 0 else 0
    if market_probability >= 1:
        return -1.0

    # EV = (true_prob / market_prob) - 1
    # Or equivalently: (true_prob * payout) - cost
    payout = 1 / market_probability
    ev = (true_probability * payout) - 1

    return ev


def calculate_edge(
    true_probability: float,
    market_probability: float
) -> Tuple[float, str]:
    """
    Calculate the edge and optimal side to bet.

    Returns the expected value and which side (yes/no) has positive EV.

    Args:
        true_probability: Your estimated true probability
        market_probability: Market implied probability

    Returns:
        Tuple of (edge_magnitude, optimal_side)
    """
    ev_yes = calculate_expected_value(true_probability, market_probability, "yes")
    ev_no = calculate_expected_value(true_probability, market_probability, "no")

    if ev_yes >= ev_no:
        return (ev_yes, "yes")
    else:
        return (ev_no, "no")


# ==============================================================================
# KELLY CRITERION
# ==============================================================================

def calculate_kelly_criterion(
    true_probability: float,
    market_probability: float,
    fraction: float = 1.0
) -> float:
    """
    Calculate Kelly Criterion optimal bet size.

    The Kelly Criterion maximizes long-term growth rate:
    f* = (p * b - q) / b

    where:
    - p = true probability of winning
    - q = 1 - p (probability of losing)
    - b = odds received (payout ratio)
    - f* = fraction of bankroll to bet

    WARNING: Full Kelly is aggressive. Use fraction < 1.0 for reduced volatility.
    Common practice: Quarter Kelly (fraction=0.25)

    Args:
        true_probability: Your estimated true probability
        market_probability: Market implied probability
        fraction: Kelly fraction (0.25 = quarter Kelly)

    Returns:
        Recommended bet size as fraction of bankroll (0-1)
        Returns 0 if no edge exists

    Example:
        >>> calculate_kelly_criterion(0.6, 0.5, fraction=0.25)
        0.05  # Bet 5% of bankroll
    """
    if market_probability <= 0 or market_probability >= 1:
        return 0.0

    # Payout ratio (net winnings per unit bet)
    b = (1 / market_probability) - 1  # If market says 50%, payout is 2:1, b=1

    p = true_probability
    q = 1 - p

    # Kelly formula: f* = (p*b - q) / b
    kelly = (p * b - q) / b if b > 0 else 0

    # Apply fractional Kelly and ensure non-negative
    kelly = max(0, kelly * fraction)

    # Cap at 100% of bankroll
    return min(kelly, 1.0)


# ==============================================================================
# SCORING METRICS
# ==============================================================================

def brier_score(predictions: List[float], outcomes: List[int]) -> float:
    """
    Calculate Brier Score for probability predictions.

    Brier Score measures calibration and accuracy:
    BS = (1/N) * sum((prediction - outcome)^2)

    Lower is better:
    - 0.0 = perfect predictions
    - 0.25 = random guessing (for binary outcomes)
    - 0.5+ = worse than random

    Args:
        predictions: List of predicted probabilities (0-1)
        outcomes: List of actual outcomes (0 or 1)

    Returns:
        Brier score (0-1, lower is better)

    Example:
        >>> brier_score([0.9, 0.3, 0.7], [1, 0, 1])
        0.043  # Very good calibration
    """
    if len(predictions) != len(outcomes):
        raise ValueError("Predictions and outcomes must have same length")

    if len(predictions) == 0:
        return 0.0

    squared_errors = [(p - o) ** 2 for p, o in zip(predictions, outcomes)]
    return sum(squared_errors) / len(squared_errors)


def calibration_error(
    predictions: List[float],
    outcomes: List[int],
    n_bins: int = 10
) -> float:
    """
    Calculate Expected Calibration Error (ECE).

    Groups predictions into bins and measures average deviation
    between predicted probabilities and actual frequencies.

    Lower is better:
    - 0.0 = perfectly calibrated
    - 0.1 = 10% average miscalibration

    Args:
        predictions: List of predicted probabilities
        outcomes: List of actual outcomes (0 or 1)
        n_bins: Number of bins for grouping predictions

    Returns:
        Expected calibration error (0-1)
    """
    if len(predictions) != len(outcomes) or len(predictions) == 0:
        return 0.0

    # Create bins
    bins = [[] for _ in range(n_bins)]
    bin_outcomes = [[] for _ in range(n_bins)]

    for pred, outcome in zip(predictions, outcomes):
        bin_idx = min(int(pred * n_bins), n_bins - 1)
        bins[bin_idx].append(pred)
        bin_outcomes[bin_idx].append(outcome)

    # Calculate calibration error
    total_error = 0.0
    total_count = len(predictions)

    for i in range(n_bins):
        if len(bins[i]) > 0:
            avg_pred = sum(bins[i]) / len(bins[i])
            avg_outcome = sum(bin_outcomes[i]) / len(bin_outcomes[i])
            weight = len(bins[i]) / total_count
            total_error += weight * abs(avg_pred - avg_outcome)

    return total_error


def log_loss(predictions: List[float], outcomes: List[int]) -> float:
    """
    Calculate logarithmic loss (cross-entropy).

    Heavily penalizes confident wrong predictions.
    Lower is better.

    Args:
        predictions: List of predicted probabilities
        outcomes: List of actual outcomes (0 or 1)

    Returns:
        Log loss (>= 0)
    """
    if len(predictions) != len(outcomes) or len(predictions) == 0:
        return 0.0

    epsilon = 1e-15  # Prevent log(0)
    total_loss = 0.0

    for pred, outcome in zip(predictions, outcomes):
        pred = max(min(pred, 1 - epsilon), epsilon)
        if outcome == 1:
            total_loss -= math.log(pred)
        else:
            total_loss -= math.log(1 - pred)

    return total_loss / len(predictions)


# ==============================================================================
# TIME UTILITIES
# ==============================================================================

def timestamp_to_datetime(timestamp: Union[int, float]) -> datetime:
    """
    Convert Unix timestamp to datetime object.

    Args:
        timestamp: Unix timestamp (seconds or milliseconds)

    Returns:
        UTC datetime object
    """
    # Handle milliseconds
    if timestamp > 1e12:
        timestamp = timestamp / 1000

    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def datetime_to_timestamp(dt: datetime) -> int:
    """
    Convert datetime to Unix timestamp (milliseconds).

    Args:
        dt: Datetime object

    Returns:
        Unix timestamp in milliseconds
    """
    return int(dt.timestamp() * 1000)


def hours_until(target_time: datetime) -> float:
    """
    Calculate hours until a target time.

    Args:
        target_time: Future datetime

    Returns:
        Hours until target (negative if past)
    """
    now = datetime.now(timezone.utc)
    if target_time.tzinfo is None:
        target_time = target_time.replace(tzinfo=timezone.utc)

    delta = target_time - now
    return delta.total_seconds() / 3600


# ==============================================================================
# STATISTICAL HELPERS
# ==============================================================================

def safe_division(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Safely divide two numbers, returning default if denominator is zero.
    """
    if denominator == 0:
        return default
    return numerator / denominator


def moving_average(values: List[float], window: int) -> List[float]:
    """
    Calculate simple moving average.

    Args:
        values: List of values
        window: Window size

    Returns:
        List of moving averages (first window-1 values are partial)
    """
    if not values or window <= 0:
        return []

    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        window_values = values[start:i + 1]
        result.append(sum(window_values) / len(window_values))

    return result


def exponential_moving_average(
    values: List[float],
    span: int
) -> List[float]:
    """
    Calculate exponential moving average.

    Args:
        values: List of values
        span: EMA span (similar to window)

    Returns:
        List of EMA values
    """
    if not values or span <= 0:
        return []

    alpha = 2 / (span + 1)
    result = [values[0]]

    for i in range(1, len(values)):
        ema = alpha * values[i] + (1 - alpha) * result[-1]
        result.append(ema)

    return result


def z_score(value: float, values: List[float]) -> float:
    """
    Calculate z-score of a value relative to a distribution.

    Args:
        value: Value to score
        values: Reference distribution

    Returns:
        Z-score (standard deviations from mean)
    """
    if not values:
        return 0.0

    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std = math.sqrt(variance) if variance > 0 else 1.0

    return (value - mean) / std


def percentile_rank(value: float, values: List[float]) -> float:
    """
    Calculate percentile rank of a value.

    Args:
        value: Value to rank
        values: Reference distribution

    Returns:
        Percentile (0-100)
    """
    if not values:
        return 50.0

    count_below = sum(1 for v in values if v < value)
    count_equal = sum(1 for v in values if v == value)

    percentile = (count_below + 0.5 * count_equal) / len(values) * 100
    return percentile


def calculate_volatility(
    prices: List[float],
    window: Optional[int] = None
) -> float:
    """
    Calculate price volatility (standard deviation of returns).

    Args:
        prices: List of prices
        window: Optional lookback window (None = all)

    Returns:
        Volatility as decimal (0.1 = 10%)
    """
    if len(prices) < 2:
        return 0.0

    if window:
        prices = prices[-window:]

    # Calculate returns
    returns = []
    for i in range(1, len(prices)):
        if prices[i - 1] > 0:
            ret = (prices[i] - prices[i - 1]) / prices[i - 1]
            returns.append(ret)

    if not returns:
        return 0.0

    # Standard deviation of returns
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)

    return math.sqrt(variance)


def calculate_sharpe_ratio(
    returns: List[float],
    risk_free_rate: float = 0.0
) -> float:
    """
    Calculate Sharpe ratio.

    Args:
        returns: List of period returns
        risk_free_rate: Risk-free rate per period

    Returns:
        Sharpe ratio
    """
    if not returns:
        return 0.0

    excess_returns = [r - risk_free_rate for r in returns]
    mean_excess = sum(excess_returns) / len(excess_returns)

    if len(returns) < 2:
        return 0.0

    variance = sum((r - mean_excess) ** 2 for r in excess_returns) / (len(excess_returns) - 1)
    std = math.sqrt(variance) if variance > 0 else 1.0

    return mean_excess / std if std > 0 else 0.0


def calculate_max_drawdown(equity_curve: List[float]) -> float:
    """
    Calculate maximum drawdown.

    Args:
        equity_curve: List of portfolio values over time

    Returns:
        Maximum drawdown as decimal (0.2 = 20% drawdown)
    """
    if not equity_curve:
        return 0.0

    peak = equity_curve[0]
    max_dd = 0.0

    for value in equity_curve:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak if peak > 0 else 0
        max_dd = max(max_dd, drawdown)

    return max_dd


# ==============================================================================
# MARKET-SPECIFIC HELPERS
# ==============================================================================

def calculate_implied_vig(yes_price: float, no_price: float) -> float:
    """
    Calculate implied vigorish (overround) from yes/no prices.

    Vig = (yes_prob + no_prob) - 1

    In efficient markets, vig should be small (1-3%).
    High vig indicates potential opportunity or low liquidity.

    Args:
        yes_price: Price for YES outcome (0-1)
        no_price: Price for NO outcome (0-1)

    Returns:
        Vigorish as decimal
    """
    return (yes_price + no_price) - 1


def mid_market_probability(bid: float, ask: float) -> float:
    """
    Calculate mid-market probability from bid/ask.

    Args:
        bid: Best bid price
        ask: Best ask price

    Returns:
        Mid-market probability
    """
    return (bid + ask) / 2


def spread_percentage(bid: float, ask: float) -> float:
    """
    Calculate bid-ask spread as percentage.

    Args:
        bid: Best bid price
        ask: Best ask price

    Returns:
        Spread as decimal (0.05 = 5%)
    """
    mid = mid_market_probability(bid, ask)
    if mid <= 0:
        return 0.0
    return (ask - bid) / mid


def effective_probability_after_slippage(
    market_prob: float,
    slippage: float,
    side: str
) -> float:
    """
    Calculate effective probability after slippage.

    Args:
        market_prob: Mid-market probability
        slippage: Expected slippage as decimal
        side: "yes" or "no"

    Returns:
        Effective probability (worse than mid-market)
    """
    if side == "yes":
        return min(market_prob * (1 + slippage), 0.99)
    else:
        return max(market_prob * (1 - slippage), 0.01)
