"""
Sample Data Generator.

Generates realistic synthetic prediction market data for testing
and demonstration purposes.

The generated data simulates:
- Market price evolution
- Order book dynamics
- Volume patterns
- Resolution outcomes

This is useful for:
- Testing strategies without API access
- Backtesting development
- UI/dashboard development
- Demo purposes
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
import json
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.data_ingestion.models import (
    MarketSnapshot, OrderBook, OrderBookLevel, MarketResolution,
    PriceHistory, MarketSource, MarketStatus, OutcomeResult
)
from engine.data_ingestion.database import Database


class SampleDataGenerator:
    """
    Generates realistic synthetic prediction market data.

    Simulates various market behaviors:
    - Random walk with drift
    - Mean reversion near resolution
    - Volatility clustering
    - Volume spikes
    - Liquidity variations
    """

    # Sample market categories
    CATEGORIES = [
        'politics', 'elections', 'economics', 'crypto',
        'sports', 'entertainment', 'science', 'weather'
    ]

    # Sample market questions
    QUESTIONS = {
        'politics': [
            "Will {candidate} win the {year} {election}?",
            "Will {bill} pass by {date}?",
            "Will {country} {action} by {date}?",
        ],
        'economics': [
            "Will Fed raise rates in {month}?",
            "Will {indicator} exceed {value} in {quarter}?",
            "Will unemployment fall below {rate}% by {date}?",
        ],
        'crypto': [
            "Will Bitcoin exceed ${price} by {date}?",
            "Will {token} launch mainnet by {date}?",
            "Will {exchange} list {token} by {date}?",
        ],
        'sports': [
            "Will {team} win the {championship}?",
            "Will {player} score {stat} in {game}?",
            "Will {team} make playoffs in {year}?",
        ]
    }

    def __init__(self, seed: Optional[int] = None):
        """
        Initialize generator.

        Args:
            seed: Random seed for reproducibility
        """
        if seed is not None:
            random.seed(seed)

        self.market_counter = 0

    def generate_market_id(self) -> str:
        """Generate unique market ID."""
        self.market_counter += 1
        return f"market_{self.market_counter:05d}"

    def generate_question(self, category: str) -> str:
        """Generate a plausible market question."""
        templates = self.QUESTIONS.get(category, self.QUESTIONS['politics'])
        template = random.choice(templates)

        # Fill in placeholders
        replacements = {
            'candidate': random.choice(['Biden', 'Trump', 'Harris', 'DeSantis']),
            'year': random.choice(['2024', '2025', '2026']),
            'election': random.choice(['election', 'primary', 'nomination']),
            'bill': random.choice(['HR 1234', 'S 567', 'Infrastructure Bill']),
            'country': random.choice(['US', 'China', 'EU', 'Russia']),
            'action': random.choice(['approve treaty', 'impose sanctions', 'reach agreement']),
            'date': (datetime.now() + timedelta(days=random.randint(7, 365))).strftime('%Y-%m-%d'),
            'month': random.choice(['January', 'March', 'June', 'September', 'December']),
            'indicator': random.choice(['GDP', 'CPI', 'Jobs report']),
            'value': str(random.randint(1, 10)),
            'quarter': random.choice(['Q1', 'Q2', 'Q3', 'Q4']),
            'rate': str(round(random.uniform(3, 6), 1)),
            'price': str(random.choice([50000, 75000, 100000, 150000])),
            'token': random.choice(['ETH', 'SOL', 'AVAX', 'ARB']),
            'exchange': random.choice(['Coinbase', 'Binance', 'Kraken']),
            'team': random.choice(['Lakers', 'Yankees', 'Patriots', 'Real Madrid']),
            'championship': random.choice(['NBA Finals', 'World Series', 'Super Bowl']),
            'player': random.choice(['LeBron', 'Messi', 'Mahomes', 'Ohtani']),
            'stat': random.choice(['30+ points', 'hat trick', '3+ TDs', 'home run']),
            'game': 'next game',
        }

        for key, value in replacements.items():
            template = template.replace('{' + key + '}', value)

        return template

    def generate_price_path(
        self,
        initial_price: float = 0.5,
        num_periods: int = 100,
        volatility: float = 0.02,
        drift: float = 0.0,
        final_price: Optional[float] = None,
        mean_reversion_strength: float = 0.1
    ) -> List[float]:
        """
        Generate realistic price path.

        Args:
            initial_price: Starting price
            num_periods: Number of periods to generate
            volatility: Price volatility per period
            drift: Drift per period
            final_price: If set, path converges to this
            mean_reversion_strength: Strength of mean reversion

        Returns:
            List of prices
        """
        prices = [initial_price]
        current = initial_price

        for i in range(1, num_periods):
            # Random component
            noise = random.gauss(0, volatility)

            # Drift component
            drift_component = drift

            # Mean reversion (if final_price set)
            if final_price is not None:
                # Increase mean reversion as we approach end
                progress = i / num_periods
                reversion_strength = mean_reversion_strength * (1 + progress * 2)
                target = initial_price + (final_price - initial_price) * progress
                drift_component += reversion_strength * (target - current)

            # Apply change
            change = drift_component + noise
            current = current + change

            # Bound to [0.01, 0.99]
            current = max(0.01, min(0.99, current))
            prices.append(current)

        return prices

    def generate_volume_path(
        self,
        num_periods: int = 100,
        base_volume: float = 1000,
        volatility: float = 0.3,
        spike_probability: float = 0.05
    ) -> List[float]:
        """
        Generate realistic volume path with occasional spikes.

        Args:
            num_periods: Number of periods
            base_volume: Average volume
            volatility: Volume volatility
            spike_probability: Probability of volume spike

        Returns:
            List of volumes
        """
        volumes = []

        for _ in range(num_periods):
            # Base volume with noise
            vol = base_volume * (1 + random.gauss(0, volatility))

            # Occasional spike
            if random.random() < spike_probability:
                vol *= random.uniform(2, 5)

            volumes.append(max(0, vol))

        return volumes

    def generate_order_book(
        self,
        mid_price: float,
        spread_pct: float = 0.03,
        depth_levels: int = 10,
        base_size: float = 500
    ) -> OrderBook:
        """
        Generate synthetic order book.

        Args:
            mid_price: Mid-market price
            spread_pct: Bid-ask spread percentage
            depth_levels: Number of price levels each side
            base_size: Base order size

        Returns:
            OrderBook object
        """
        spread = mid_price * spread_pct
        bid_price = mid_price - spread / 2
        ask_price = mid_price + spread / 2

        bids = []
        asks = []

        for i in range(depth_levels):
            # Bids (descending price)
            level_price = bid_price - (i * spread_pct * 0.5)
            level_price = max(0.01, level_price)
            level_size = base_size * (1 + random.uniform(-0.5, 0.5))
            bids.append(OrderBookLevel(price=level_price, size=level_size))

            # Asks (ascending price)
            level_price = ask_price + (i * spread_pct * 0.5)
            level_price = min(0.99, level_price)
            level_size = base_size * (1 + random.uniform(-0.5, 0.5))
            asks.append(OrderBookLevel(price=level_price, size=level_size))

        return OrderBook(
            market_id="",  # Will be set later
            timestamp=datetime.utcnow(),
            bids=bids,
            asks=asks
        )

    def generate_market(
        self,
        source: MarketSource = MarketSource.POLYMARKET,
        category: Optional[str] = None,
        days_to_resolution: Optional[int] = None,
        initial_price: Optional[float] = None,
        resolved: bool = False,
        outcome: Optional[OutcomeResult] = None
    ) -> Tuple[MarketSnapshot, OrderBook, PriceHistory, Optional[MarketResolution]]:
        """
        Generate complete market data.

        Args:
            source: Market source
            category: Market category
            days_to_resolution: Days until resolution
            initial_price: Starting price
            resolved: Whether market is resolved
            outcome: Resolution outcome if resolved

        Returns:
            Tuple of (snapshot, order_book, price_history, resolution)
        """
        market_id = self.generate_market_id()
        category = category or random.choice(self.CATEGORIES)

        # Set timing
        if days_to_resolution is None:
            days_to_resolution = random.randint(1, 90)

        created_at = datetime.utcnow() - timedelta(days=random.randint(7, 60))
        close_time = datetime.utcnow() + timedelta(days=days_to_resolution)

        # Set prices
        if initial_price is None:
            initial_price = random.uniform(0.20, 0.80)

        # Determine final price if resolved
        if resolved:
            if outcome is None:
                outcome = OutcomeResult.YES if random.random() > 0.5 else OutcomeResult.NO
            final_price = 0.99 if outcome == OutcomeResult.YES else 0.01
        else:
            final_price = None
            outcome = OutcomeResult.PENDING

        # Generate price history
        num_periods = min(days_to_resolution * 4, 200)  # ~4 snapshots per day
        prices = self.generate_price_path(
            initial_price=initial_price,
            num_periods=num_periods,
            volatility=random.uniform(0.01, 0.04),
            final_price=final_price if resolved else None
        )
        volumes = self.generate_volume_path(num_periods=num_periods)

        current_price = prices[-1]

        # Generate order book
        order_book = self.generate_order_book(
            mid_price=current_price,
            spread_pct=random.uniform(0.02, 0.10)
        )
        order_book.market_id = market_id

        # Create snapshot
        snapshot = MarketSnapshot(
            market_id=market_id,
            source=source,
            timestamp=datetime.utcnow(),
            question=self.generate_question(category),
            description=f"Sample market in {category} category",
            category=category,
            tags=[category],
            created_at=created_at,
            close_time=close_time,
            resolution_time=close_time if not resolved else datetime.utcnow(),
            status=MarketStatus.RESOLVED if resolved else MarketStatus.ACTIVE,
            outcome=outcome,
            yes_price=current_price,
            no_price=1 - current_price,
            last_trade_price=current_price,
            volume_24h=sum(volumes[-4:]),
            total_volume=sum(volumes),
            open_interest=random.uniform(1000, 50000),
            liquidity=order_book.total_liquidity,
            best_bid=order_book.best_bid,
            best_ask=order_book.best_ask,
            spread=order_book.spread,
            num_traders=random.randint(50, 5000),
            comments_count=random.randint(0, 500)
        )

        # Create price history
        timestamps = [
            created_at + timedelta(hours=i * 6)
            for i in range(num_periods)
        ]
        price_history = PriceHistory(
            market_id=market_id,
            source=source,
            timestamps=timestamps,
            prices=prices,
            volumes=volumes
        )

        # Create resolution if resolved
        resolution = None
        if resolved:
            resolution = MarketResolution(
                market_id=market_id,
                source=source,
                question=snapshot.question,
                resolution_time=datetime.utcnow(),
                outcome=outcome,
                final_price=current_price,
                settlement_value=1.0 if outcome == OutcomeResult.YES else 0.0,
                price_1h_before=prices[-2] if len(prices) > 1 else current_price,
                price_6h_before=prices[-4] if len(prices) > 3 else current_price,
                price_24h_before=prices[-16] if len(prices) > 15 else current_price,
                volume_24h_before=sum(volumes[-16:]) if len(volumes) > 15 else sum(volumes)
            )

        return snapshot, order_book, price_history, resolution

    def generate_dataset(
        self,
        num_active_markets: int = 50,
        num_resolved_markets: int = 100,
        source: MarketSource = MarketSource.POLYMARKET
    ) -> dict:
        """
        Generate complete dataset for testing.

        Args:
            num_active_markets: Number of active markets
            num_resolved_markets: Number of resolved markets
            source: Market source

        Returns:
            Dictionary with all generated data
        """
        snapshots = []
        order_books = []
        price_histories = []
        resolutions = []

        # Generate active markets
        for _ in range(num_active_markets):
            snapshot, ob, ph, _ = self.generate_market(
                source=source,
                resolved=False
            )
            snapshots.append(snapshot)
            order_books.append(ob)
            price_histories.append(ph)

        # Generate resolved markets
        for _ in range(num_resolved_markets):
            snapshot, ob, ph, res = self.generate_market(
                source=source,
                resolved=True
            )
            snapshots.append(snapshot)
            order_books.append(ob)
            price_histories.append(ph)
            if res:
                resolutions.append(res)

        return {
            'snapshots': snapshots,
            'order_books': order_books,
            'price_histories': price_histories,
            'resolutions': resolutions
        }

    def populate_database(
        self,
        db: Database,
        num_active: int = 50,
        num_resolved: int = 100
    ):
        """
        Populate database with sample data.

        Args:
            db: Database instance
            num_active: Number of active markets
            num_resolved: Number of resolved markets
        """
        print(f"Generating sample data: {num_active} active, {num_resolved} resolved markets...")

        # Generate for both sources
        for source in [MarketSource.POLYMARKET, MarketSource.KALSHI]:
            dataset = self.generate_dataset(
                num_active_markets=num_active // 2,
                num_resolved_markets=num_resolved // 2,
                source=source
            )

            # Save snapshots
            db.save_snapshots(dataset['snapshots'])
            print(f"  Saved {len(dataset['snapshots'])} {source.value} snapshots")

            # Save order books
            for ob in dataset['order_books']:
                db.save_order_book(ob)
            print(f"  Saved {len(dataset['order_books'])} order books")

            # Save resolutions
            for res in dataset['resolutions']:
                db.save_resolution(res)
            print(f"  Saved {len(dataset['resolutions'])} resolutions")

        print("Sample data generation complete!")


def generate_sample_data(
    db_path: str = "data/prediction_markets.db",
    num_active: int = 100,
    num_resolved: int = 200,
    seed: int = 42
):
    """
    Convenience function to generate and save sample data.

    Args:
        db_path: Database path
        num_active: Number of active markets
        num_resolved: Number of resolved markets
        seed: Random seed
    """
    from engine.data_ingestion.database import Database

    db = Database(db_path=db_path)
    generator = SampleDataGenerator(seed=seed)
    generator.populate_database(db, num_active, num_resolved)


if __name__ == "__main__":
    generate_sample_data()
