"""
Market Correlation and Clustering Analysis.

Advanced analysis tools for:
- Cross-market correlation detection
- Market clustering by characteristics
- Arbitrage opportunity detection
- Related market identification
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from collections import defaultdict

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from engine.data_ingestion.models import MarketSnapshot, PriceHistory, MarketSource
from utils.logging_setup import get_logger

logger = get_logger("market_analysis")


@dataclass
class MarketCorrelation:
    """Correlation between two markets."""
    market_a_id: str
    market_b_id: str
    correlation: float  # -1 to 1
    sample_size: int
    confidence: float
    relationship_type: str  # "positive", "negative", "complement"
    potential_arbitrage: bool
    arbitrage_size: float


@dataclass
class MarketCluster:
    """Cluster of related markets."""
    cluster_id: str
    name: str
    markets: List[str]
    centroid_price: float
    avg_liquidity: float
    total_volume: float
    coherence_score: float  # How tight the cluster is
    dominant_theme: str


@dataclass
class ArbitrageOpportunity:
    """Detected arbitrage opportunity."""
    market_a_id: str
    market_b_id: str
    source_a: MarketSource
    source_b: MarketSource
    price_a: float
    price_b: float
    spread: float  # Price difference
    implied_probability: float  # True probability estimate
    edge_size: float
    confidence: float
    opportunity_type: str  # "cross_platform", "related_market", "inverse"


class MarketCorrelationAnalyzer:
    """
    Analyzes correlations between prediction markets.

    Key use cases:
    1. Find related markets for context
    2. Detect arbitrage between correlated markets
    3. Avoid concentrated positions in correlated markets
    4. Identify hedging opportunities
    """

    def __init__(self, min_sample_size: int = 10):
        """
        Initialize analyzer.

        Args:
            min_sample_size: Minimum data points for correlation
        """
        self.min_sample_size = min_sample_size
        self._price_cache: Dict[str, List[float]] = defaultdict(list)

    def calculate_correlation(
        self,
        history_a: PriceHistory,
        history_b: PriceHistory
    ) -> Optional[MarketCorrelation]:
        """
        Calculate correlation between two markets.

        Args:
            history_a: Price history for market A
            history_b: Price history for market B

        Returns:
            MarketCorrelation or None if insufficient data
        """
        # Align time series
        prices_a, prices_b = self._align_time_series(history_a, history_b)

        if len(prices_a) < self.min_sample_size:
            return None

        # Calculate Pearson correlation
        correlation = self._pearson_correlation(prices_a, prices_b)

        # Calculate confidence based on sample size
        confidence = min(1.0, len(prices_a) / 50)

        # Determine relationship type
        if correlation > 0.5:
            relationship_type = "positive"
        elif correlation < -0.5:
            relationship_type = "negative"
        elif abs(correlation) < 0.2:
            relationship_type = "independent"
        else:
            relationship_type = "weak"

        # Check for arbitrage (strong negative correlation with prices near 1.0)
        avg_sum = (sum(prices_a) / len(prices_a)) + (sum(prices_b) / len(prices_b))
        potential_arb = (
            correlation < -0.7 and
            0.9 < avg_sum < 1.1  # Prices should sum to ~1 for complements
        )

        arb_size = abs(1.0 - avg_sum) if potential_arb else 0.0

        return MarketCorrelation(
            market_a_id=history_a.market_id,
            market_b_id=history_b.market_id,
            correlation=correlation,
            sample_size=len(prices_a),
            confidence=confidence,
            relationship_type=relationship_type,
            potential_arbitrage=potential_arb,
            arbitrage_size=arb_size
        )

    def _align_time_series(
        self,
        history_a: PriceHistory,
        history_b: PriceHistory
    ) -> Tuple[List[float], List[float]]:
        """Align two time series by timestamp."""
        # Create timestamp -> price mapping
        a_prices = dict(zip(history_a.timestamps, history_a.prices))
        b_prices = dict(zip(history_b.timestamps, history_b.prices))

        # Find common timestamps (within 1 hour tolerance)
        aligned_a = []
        aligned_b = []

        for ts_a, price_a in a_prices.items():
            # Find closest timestamp in B
            closest_ts = None
            closest_diff = timedelta(hours=1)

            for ts_b in b_prices:
                diff = abs(ts_a - ts_b)
                if diff < closest_diff:
                    closest_diff = diff
                    closest_ts = ts_b

            if closest_ts is not None:
                aligned_a.append(price_a)
                aligned_b.append(b_prices[closest_ts])

        return aligned_a, aligned_b

    def _pearson_correlation(
        self,
        x: List[float],
        y: List[float]
    ) -> float:
        """Calculate Pearson correlation coefficient."""
        n = len(x)
        if n == 0:
            return 0.0

        mean_x = sum(x) / n
        mean_y = sum(y) / n

        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        denominator_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
        denominator_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))

        if denominator_x * denominator_y == 0:
            return 0.0

        return numerator / (denominator_x * denominator_y)

    def find_correlated_markets(
        self,
        target_history: PriceHistory,
        all_histories: Dict[str, PriceHistory],
        min_correlation: float = 0.5
    ) -> List[MarketCorrelation]:
        """
        Find markets correlated with target market.

        Args:
            target_history: Target market history
            all_histories: All available histories
            min_correlation: Minimum absolute correlation

        Returns:
            List of correlations sorted by strength
        """
        correlations = []

        for market_id, history in all_histories.items():
            if market_id == target_history.market_id:
                continue

            corr = self.calculate_correlation(target_history, history)
            if corr and abs(corr.correlation) >= min_correlation:
                correlations.append(corr)

        # Sort by absolute correlation
        correlations.sort(key=lambda c: abs(c.correlation), reverse=True)

        return correlations


class MarketClusterer:
    """
    Clusters markets by similarity for portfolio management.

    Markets can be similar by:
    - Topic/category
    - Price behavior
    - Timing (same resolution date)
    - Liquidity characteristics
    """

    def __init__(self):
        """Initialize clusterer."""
        self._cluster_counter = 0

    def cluster_by_category(
        self,
        snapshots: List[MarketSnapshot]
    ) -> List[MarketCluster]:
        """
        Cluster markets by category/topic.

        Args:
            snapshots: List of market snapshots

        Returns:
            List of market clusters
        """
        # Group by category
        by_category: Dict[str, List[MarketSnapshot]] = defaultdict(list)

        for snapshot in snapshots:
            category = snapshot.category or "uncategorized"
            by_category[category].append(snapshot)

        # Create clusters
        clusters = []
        for category, markets in by_category.items():
            if len(markets) < 2:
                continue

            self._cluster_counter += 1

            prices = [m.yes_price for m in markets]
            liquidities = [m.liquidity or 0 for m in markets]
            volumes = [m.volume_24h or 0 for m in markets]

            cluster = MarketCluster(
                cluster_id=f"cat_{self._cluster_counter}",
                name=category,
                markets=[m.market_id for m in markets],
                centroid_price=sum(prices) / len(prices),
                avg_liquidity=sum(liquidities) / len(liquidities),
                total_volume=sum(volumes),
                coherence_score=self._calculate_coherence(prices),
                dominant_theme=category
            )

            clusters.append(cluster)

        return clusters

    def cluster_by_timing(
        self,
        snapshots: List[MarketSnapshot],
        time_window_hours: int = 24
    ) -> List[MarketCluster]:
        """
        Cluster markets by resolution timing.

        Args:
            snapshots: List of market snapshots
            time_window_hours: Window for grouping (hours)

        Returns:
            List of timing-based clusters
        """
        # Filter to markets with resolution times
        with_resolution = [
            s for s in snapshots
            if s.resolution_time is not None
        ]

        if not with_resolution:
            return []

        # Sort by resolution time
        with_resolution.sort(key=lambda s: s.resolution_time)

        # Group into time windows
        clusters = []
        current_group = [with_resolution[0]]

        for snapshot in with_resolution[1:]:
            time_diff = (
                snapshot.resolution_time - current_group[0].resolution_time
            ).total_seconds() / 3600

            if time_diff <= time_window_hours:
                current_group.append(snapshot)
            else:
                # Create cluster from current group
                if len(current_group) >= 2:
                    clusters.append(self._create_timing_cluster(current_group))
                current_group = [snapshot]

        # Don't forget last group
        if len(current_group) >= 2:
            clusters.append(self._create_timing_cluster(current_group))

        return clusters

    def _create_timing_cluster(
        self,
        markets: List[MarketSnapshot]
    ) -> MarketCluster:
        """Create cluster from time-grouped markets."""
        self._cluster_counter += 1

        prices = [m.yes_price for m in markets]
        liquidities = [m.liquidity or 0 for m in markets]
        volumes = [m.volume_24h or 0 for m in markets]

        resolution_time = markets[0].resolution_time
        name = f"Resolving {resolution_time.strftime('%Y-%m-%d')}"

        return MarketCluster(
            cluster_id=f"time_{self._cluster_counter}",
            name=name,
            markets=[m.market_id for m in markets],
            centroid_price=sum(prices) / len(prices),
            avg_liquidity=sum(liquidities) / len(liquidities),
            total_volume=sum(volumes),
            coherence_score=self._calculate_coherence(prices),
            dominant_theme=f"Resolution window: {resolution_time}"
        )

    def _calculate_coherence(self, prices: List[float]) -> float:
        """
        Calculate cluster coherence (how similar prices are).

        Returns 0-1, higher = more coherent.
        """
        if len(prices) < 2:
            return 1.0

        mean = sum(prices) / len(prices)
        variance = sum((p - mean) ** 2 for p in prices) / len(prices)
        std_dev = math.sqrt(variance)

        # Lower std_dev = higher coherence
        # Scale so std_dev of 0.1 = coherence of 0.5
        coherence = 1 / (1 + std_dev * 5)

        return coherence


class ArbitrageDetector:
    """
    Detects arbitrage opportunities across markets.

    Types of arbitrage:
    1. Cross-platform: Same market on Polymarket vs Kalshi
    2. Related markets: Markets that should sum to 1
    3. Inverse markets: YES on A = NO on B
    """

    def __init__(self, min_spread: float = 0.02):
        """
        Initialize detector.

        Args:
            min_spread: Minimum spread to consider (2% default)
        """
        self.min_spread = min_spread

    def detect_cross_platform_arb(
        self,
        polymarket_snapshots: Dict[str, MarketSnapshot],
        kalshi_snapshots: Dict[str, MarketSnapshot],
        similarity_threshold: float = 0.8
    ) -> List[ArbitrageOpportunity]:
        """
        Detect arbitrage between Polymarket and Kalshi.

        Args:
            polymarket_snapshots: Polymarket markets
            kalshi_snapshots: Kalshi markets
            similarity_threshold: Text similarity threshold

        Returns:
            List of arbitrage opportunities
        """
        opportunities = []

        for poly_id, poly_snap in polymarket_snapshots.items():
            for kalshi_id, kalshi_snap in kalshi_snapshots.items():
                # Check if markets are similar (simple keyword matching)
                similarity = self._calculate_similarity(
                    poly_snap.question,
                    kalshi_snap.question
                )

                if similarity < similarity_threshold:
                    continue

                # Check for price discrepancy
                spread = abs(poly_snap.yes_price - kalshi_snap.yes_price)

                if spread >= self.min_spread:
                    # Calculate implied probability (average)
                    implied_prob = (poly_snap.yes_price + kalshi_snap.yes_price) / 2

                    # Edge is half the spread (buy low, sell high)
                    edge = spread / 2

                    opp = ArbitrageOpportunity(
                        market_a_id=poly_id,
                        market_b_id=kalshi_id,
                        source_a=MarketSource.POLYMARKET,
                        source_b=MarketSource.KALSHI,
                        price_a=poly_snap.yes_price,
                        price_b=kalshi_snap.yes_price,
                        spread=spread,
                        implied_probability=implied_prob,
                        edge_size=edge,
                        confidence=similarity,
                        opportunity_type="cross_platform"
                    )

                    opportunities.append(opp)

        # Sort by edge size
        opportunities.sort(key=lambda o: o.edge_size, reverse=True)

        return opportunities

    def detect_related_market_arb(
        self,
        snapshots: List[MarketSnapshot],
        must_sum_pairs: Optional[List[Tuple[str, str]]] = None
    ) -> List[ArbitrageOpportunity]:
        """
        Detect arbitrage in related markets that should sum to 1.

        For example:
        - "Will X win?" + "Will X lose?" should sum to 1
        - "Team A wins" + "Team B wins" in 2-team match = 1

        Args:
            snapshots: All market snapshots
            must_sum_pairs: Known pairs that should sum to 1

        Returns:
            List of arbitrage opportunities
        """
        opportunities = []

        # Build lookup
        snapshot_map = {s.market_id: s for s in snapshots}

        # Check known pairs if provided
        if must_sum_pairs:
            for market_a, market_b in must_sum_pairs:
                if market_a in snapshot_map and market_b in snapshot_map:
                    snap_a = snapshot_map[market_a]
                    snap_b = snapshot_map[market_b]

                    total = snap_a.yes_price + snap_b.yes_price
                    deviation = abs(total - 1.0)

                    if deviation >= self.min_spread:
                        opp = ArbitrageOpportunity(
                            market_a_id=market_a,
                            market_b_id=market_b,
                            source_a=snap_a.source,
                            source_b=snap_b.source,
                            price_a=snap_a.yes_price,
                            price_b=snap_b.yes_price,
                            spread=deviation,
                            implied_probability=0.5,  # Unclear in this case
                            edge_size=deviation / 2,
                            confidence=0.9,  # Known pairs
                            opportunity_type="related_market"
                        )
                        opportunities.append(opp)

        # Auto-detect by question similarity
        for i, snap_a in enumerate(snapshots):
            for snap_b in snapshots[i + 1:]:
                # Check if questions are inverses
                if self._are_inverse_questions(snap_a.question, snap_b.question):
                    total = snap_a.yes_price + snap_b.yes_price
                    deviation = abs(total - 1.0)

                    if deviation >= self.min_spread:
                        opp = ArbitrageOpportunity(
                            market_a_id=snap_a.market_id,
                            market_b_id=snap_b.market_id,
                            source_a=snap_a.source,
                            source_b=snap_b.source,
                            price_a=snap_a.yes_price,
                            price_b=snap_b.yes_price,
                            spread=deviation,
                            implied_probability=0.5,
                            edge_size=deviation / 2,
                            confidence=0.7,  # Auto-detected
                            opportunity_type="inverse"
                        )
                        opportunities.append(opp)

        return opportunities

    def _calculate_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate simple text similarity using Jaccard index."""
        if not text_a or not text_b:
            return 0.0

        # Tokenize (simple word-based)
        words_a = set(text_a.lower().split())
        words_b = set(text_b.lower().split())

        # Remove common words
        stop_words = {'the', 'a', 'an', 'is', 'are', 'will', 'be', 'to', 'of', 'in', '?'}
        words_a -= stop_words
        words_b -= stop_words

        if not words_a or not words_b:
            return 0.0

        intersection = len(words_a & words_b)
        union = len(words_a | words_b)

        return intersection / union if union > 0 else 0.0

    def _are_inverse_questions(self, q_a: str, q_b: str) -> bool:
        """Check if two questions are logical inverses."""
        if not q_a or not q_b:
            return False

        q_a_lower = q_a.lower()
        q_b_lower = q_b.lower()

        # Simple heuristics for inverse detection
        inverse_pairs = [
            ('win', 'lose'),
            ('yes', 'no'),
            ('above', 'below'),
            ('over', 'under'),
            ('more than', 'less than'),
            ('higher', 'lower'),
        ]

        for word_a, word_b in inverse_pairs:
            if word_a in q_a_lower and word_b in q_b_lower:
                # Check if rest of question is similar
                rest_a = q_a_lower.replace(word_a, '').strip()
                rest_b = q_b_lower.replace(word_b, '').strip()

                if self._calculate_similarity(rest_a, rest_b) > 0.7:
                    return True

            if word_b in q_a_lower and word_a in q_b_lower:
                rest_a = q_a_lower.replace(word_b, '').strip()
                rest_b = q_b_lower.replace(word_a, '').strip()

                if self._calculate_similarity(rest_a, rest_b) > 0.7:
                    return True

        return False


class LiveDataValidator:
    """
    Validates live data for accuracy and freshness.

    Checks:
    - Price reasonableness
    - Data staleness
    - Consistency across snapshots
    - Anomaly detection
    """

    def __init__(
        self,
        max_staleness_minutes: int = 30,
        max_price_change_per_hour: float = 0.30
    ):
        """
        Initialize validator.

        Args:
            max_staleness_minutes: Max age for "fresh" data
            max_price_change_per_hour: Max reasonable price change
        """
        self.max_staleness_minutes = max_staleness_minutes
        self.max_price_change_per_hour = max_price_change_per_hour
        self._last_prices: Dict[str, Tuple[float, datetime]] = {}

    def validate_snapshot(
        self,
        snapshot: MarketSnapshot
    ) -> Tuple[bool, List[str]]:
        """
        Validate a market snapshot.

        Args:
            snapshot: Snapshot to validate

        Returns:
            Tuple of (is_valid, list of issues)
        """
        issues = []

        # Check price range
        if snapshot.yes_price < 0 or snapshot.yes_price > 1:
            issues.append(f"Invalid price: {snapshot.yes_price}")

        if snapshot.no_price < 0 or snapshot.no_price > 1:
            issues.append(f"Invalid NO price: {snapshot.no_price}")

        # Check bid/ask consistency
        if snapshot.best_bid and snapshot.best_ask:
            if snapshot.best_bid > snapshot.best_ask:
                issues.append("Crossed book: bid > ask")

        # Check staleness
        age_minutes = (
            datetime.now(timezone.utc) - snapshot.timestamp
        ).total_seconds() / 60

        if age_minutes > self.max_staleness_minutes:
            issues.append(f"Stale data: {age_minutes:.0f} minutes old")

        # Check for suspicious price jumps
        market_id = snapshot.market_id
        if market_id in self._last_prices:
            last_price, last_time = self._last_prices[market_id]
            hours_elapsed = (
                snapshot.timestamp - last_time
            ).total_seconds() / 3600

            if hours_elapsed > 0:
                price_change = abs(snapshot.yes_price - last_price)
                change_rate = price_change / hours_elapsed

                if change_rate > self.max_price_change_per_hour:
                    issues.append(
                        f"Suspicious price jump: {price_change:.1%} in {hours_elapsed:.1f}h"
                    )

        # Update cache
        self._last_prices[market_id] = (
            snapshot.yes_price,
            snapshot.timestamp
        )

        return len(issues) == 0, issues

    def validate_batch(
        self,
        snapshots: List[MarketSnapshot]
    ) -> Dict[str, Any]:
        """
        Validate a batch of snapshots.

        Args:
            snapshots: List of snapshots to validate

        Returns:
            Validation summary
        """
        valid_count = 0
        invalid_count = 0
        all_issues: Dict[str, List[str]] = {}

        for snapshot in snapshots:
            is_valid, issues = self.validate_snapshot(snapshot)

            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1
                all_issues[snapshot.market_id] = issues

        return {
            'total': len(snapshots),
            'valid': valid_count,
            'invalid': invalid_count,
            'validity_rate': valid_count / len(snapshots) if snapshots else 0,
            'issues': all_issues
        }

    def get_data_quality_score(
        self,
        snapshots: List[MarketSnapshot]
    ) -> float:
        """
        Calculate overall data quality score.

        Returns:
            Score 0-1, higher = better quality
        """
        if not snapshots:
            return 0.0

        scores = []

        for snapshot in snapshots:
            score = 1.0

            # Penalize for staleness
            age_minutes = (
                datetime.now(timezone.utc) - snapshot.timestamp
            ).total_seconds() / 60

            staleness_penalty = min(0.5, age_minutes / 60 * 0.1)
            score -= staleness_penalty

            # Penalize for missing data
            if snapshot.best_bid is None:
                score -= 0.1
            if snapshot.best_ask is None:
                score -= 0.1
            if snapshot.liquidity is None or snapshot.liquidity == 0:
                score -= 0.1
            if snapshot.volume_24h is None or snapshot.volume_24h == 0:
                score -= 0.1

            # Penalize for wide spreads (possible stale quotes)
            if snapshot.spread and snapshot.spread > 0.10:
                score -= 0.1

            scores.append(max(0, score))

        return sum(scores) / len(scores)
