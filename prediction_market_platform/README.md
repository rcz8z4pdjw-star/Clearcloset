# Prediction Market Research Platform

An institutional-grade research and opportunity discovery platform for prediction markets (Polymarket, Kalshi).

**⚠️ FOR RESEARCH PURPOSES ONLY - NO AUTOMATED TRADING ⚠️**

## Overview

This platform is designed to:
- **Identify** profitable market inefficiencies
- **Generate** datasets, signals, and opportunity reports
- **Backtest** strategies on historical data
- **Rank** opportunities for manual review

It is NOT a trading bot. All trading decisions must be made manually.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Edge Strategies](#edge-strategies)
4. [Usage Guide](#usage-guide)
5. [Adding New Strategies](#adding-new-strategies)
6. [Interpreting Outputs](#interpreting-outputs)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)

---

## Quick Start

### Installation

```bash
# Clone repository
cd prediction_market_platform

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install pyyaml

# Optional: For enhanced features
pip install pyarrow pandas numpy
```

### Basic Usage

```bash
# Collect market data
python main.py collect

# Run analysis and generate signals
python main.py analyze

# Generate opportunity report
python main.py report

# Run full pipeline
python main.py full

# Run backtests
python main.py backtest --start 2024-01-01
```

---

## Architecture

```
prediction_market_platform/
├── config/
│   └── settings.yaml         # Main configuration
├── data/                     # Data storage
│   ├── market_snapshots/
│   ├── order_books/
│   ├── historical_prices/
│   └── external_data/
├── strategies/               # Edge detection strategies
│   ├── structural_edges/     # Market microstructure edges
│   ├── behavioral_edges/     # Psychology-based edges
│   └── mispricing_models/    # Statistical mispricing
├── engine/                   # Core computational engine
│   ├── data_ingestion/       # Data collection & storage
│   ├── signal_generation/    # Strategy execution
│   ├── opportunity_scoring/  # Ranking system
│   └── backtesting/          # Historical evaluation
├── output/                   # Reports and exports
│   ├── reports/
│   ├── csv_exports/
│   └── dashboards/
├── utils/                    # Utility modules
└── main.py                   # Entry point
```

---

## Edge Strategies

The platform implements empirically-validated edges across four categories:

### 1. Structural Edges

Market microstructure inefficiencies:

| Strategy | Description | Empirical Edge |
|----------|-------------|----------------|
| **Liquidity Vacuum** | Thin markets drift from fair value | 3-5% edge on markets <$1000 liquidity |
| **Spread Exploitation** | Wide bid-ask spreads | 3-7% spread capture |
| **Order Book Imbalance** | Directional pressure from asymmetry | 55-60% directional accuracy |
| **Late Resolution** | Convergence inefficiency near resolution | 2-5% edge in final 24h |

### 2. Behavioral Edges

Human psychology biases:

| Strategy | Description | Empirical Edge |
|----------|-------------|----------------|
| **Favorite-Longshot Bias** | Extreme probabilities mispriced | 2-4% on longshots, 1-3% on favorites |
| **Overreaction** | Mean reversion after sharp moves | 30-40% reversion on 10%+ moves |
| **Herding** | Crowd behavior near resolution | 40-50% reversion on herding moves |
| **Anchoring** | Under-adjustment from anchor prices | 30-35% additional adjustment expected |

### 3. Informational Edges

Information processing inefficiencies:

| Strategy | Description | Empirical Edge |
|----------|-------------|----------------|
| **Cross-Market Arbitrage** | Price discrepancies between platforms | 2-5% typical gaps |
| **Forecast Divergence** | Market vs external forecast gaps | 55-60% forecast accuracy when divergent |
| **Slow Updating** | Lagging markets | 50-70% catch-up expected |

---

## Usage Guide

### Data Collection

```python
from engine.data_ingestion import get_database
from engine.data_ingestion.polymarket_collector import PolymarketCollector

db = get_database()
collector = PolymarketCollector(db=db)

# Collect snapshots
snapshots, order_books = collector.collect_all_snapshots(
    max_markets=200,
    include_order_books=True
)
```

### Running Strategies

```python
from engine.signal_generation import SignalEngine

engine = SignalEngine()
batch = engine.generate_signals()

print(f"Generated {batch.total_signals} signals")
for strategy, count in batch.signals_by_strategy.items():
    print(f"  {strategy}: {count}")
```

### Generating Reports

```python
from engine.opportunity_scoring import OpportunityScorer
from output import ReportGenerator

# Score opportunities
scorer = OpportunityScorer()
opportunities = scorer.score_opportunities(
    signals=batch.signals,
    markets=markets,
    top_n=50
)

# Generate report
generator = ReportGenerator()
report_path = generator.generate_daily_opportunity_report(opportunities)
```

### Backtesting

```python
from engine.backtesting import BacktestEngine, BacktestConfig
from strategies.structural_edges import LateResolutionStrategy

config = BacktestConfig.from_config(start_date='2024-01-01')
engine = BacktestEngine(config=config)

strategy = LateResolutionStrategy()
result = engine.run_backtest(strategy)

print(result.summary())
```

---

## Adding New Strategies

### Step 1: Create Strategy Class

```python
# strategies/my_edges/my_strategy.py
from strategies.base import Strategy, StrategyConfig, StrategyResult, SignalDirection

class MyNewStrategy(Strategy):
    """
    MY NEW STRATEGY

    Description of why this edge exists...
    """

    def __init__(self, config=None):
        super().__init__(config)
        # Initialize parameters

    @property
    def name(self) -> str:
        return "my_new_strategy"

    @property
    def category(self) -> str:
        return "structural"  # or "behavioral", "informational"

    @property
    def description(self) -> str:
        return """Detailed description of the edge..."""

    def analyze(
        self,
        snapshot,
        order_book=None,
        price_history=None,
        related_markets=None
    ):
        # Your analysis logic here

        if no_signal:
            return None

        return self._create_result(
            snapshot=snapshot,
            direction=SignalDirection.BUY_YES,
            probability_estimate=0.65,
            signal_strength=0.8,
            confidence=0.7,
            explanation="Why this is a good opportunity...",
            factors=["Factor 1", "Factor 2"],
            risks=["Risk 1", "Risk 2"]
        )
```

### Step 2: Register Strategy

Add to `engine/signal_generation/engine.py`:

```python
from strategies.my_edges import MyNewStrategy

STRATEGY_REGISTRY['my_new_strategy'] = MyNewStrategy
```

### Step 3: Configure

Add to `config/settings.yaml`:

```yaml
strategies:
  structural:
    my_new_strategy:
      enabled: true
      weight: 1.0
      # Custom parameters...
```

---

## Interpreting Outputs

### Opportunity Report Fields

| Field | Description | Good Values |
|-------|-------------|-------------|
| **Composite Score** | Overall opportunity quality (0-1) | > 0.6 |
| **Expected Value** | Estimated edge | > 3% |
| **Confidence** | Signal certainty | > 60% |
| **Risk Score** | Downside risk (0-1) | < 0.5 |
| **Signal Agreement** | Strategy consensus | > 70% |

### Backtest Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Win Rate** | Percentage of winning trades | > 55% |
| **Sharpe Ratio** | Risk-adjusted return | > 1.0 |
| **Max Drawdown** | Worst peak-to-trough | < 20% |
| **Brier Score** | Calibration accuracy | < 0.20 |
| **Profit Factor** | Gross profit / gross loss | > 1.5 |

### Signal Interpretation

```
Signal Strength: -1 to 1
  -1.0: Strong SELL YES (buy NO)
   0.0: Neutral / No signal
  +1.0: Strong BUY YES

Confidence: 0 to 1
  0.0-0.5: Low confidence, small position
  0.5-0.7: Moderate confidence
  0.7-1.0: High confidence
```

---

## Configuration

### Key Settings (`config/settings.yaml`)

```yaml
# Strategy weights and thresholds
strategies:
  structural:
    liquidity_vacuum:
      enabled: true
      weight: 1.2
      min_spread_threshold: 0.05

# Scoring weights (must sum to 1.0)
scoring:
  weights:
    expected_value: 0.30
    confidence: 0.20
    liquidity: 0.15
    time_horizon: 0.10
    historical_edge_strength: 0.15
    risk_profile: 0.10

# Minimum thresholds
scoring:
  thresholds:
    min_expected_value: 0.02
    min_confidence: 0.50
    min_liquidity_usd: 500
```

### Environment Variables

Override config with environment variables:

```bash
export PM_STRATEGIES__STRUCTURAL__LIQUIDITY_VACUUM__ENABLED=true
export PM_SCORING__WEIGHTS__EXPECTED_VALUE=0.35
```

---

## API Reference

### Core Classes

#### `Strategy`
Base class for all strategies.

```python
class Strategy(ABC):
    def run(snapshot, order_book, price_history, related_markets) -> StrategyResult
    @property name: str
    @property description: str
    @property category: str
```

#### `SignalEngine`
Orchestrates strategy execution.

```python
class SignalEngine:
    def generate_signals(markets, source, save_to_db) -> SignalBatch
    def run_single_strategy(strategy_name, markets) -> SignalBatch
    def create_ensemble(strategy_names, voting_method) -> EnsembleStrategy
```

#### `OpportunityScorer`
Ranks opportunities.

```python
class OpportunityScorer:
    def score_opportunities(signals, markets, top_n) -> List[Opportunity]
```

#### `BacktestEngine`
Evaluates historical performance.

```python
class BacktestEngine:
    def run_backtest(strategy, source) -> BacktestResult
```

---

## Risk Disclaimer

**THIS PLATFORM IS FOR RESEARCH AND EDUCATIONAL PURPOSES ONLY.**

- No automated trading functionality is implemented
- All trading decisions must be made manually
- Past performance does not guarantee future results
- Prediction markets involve substantial risk of loss
- Only trade with capital you can afford to lose

The strategies and signals provided are based on historical patterns that may not persist. Market conditions change, and edges can disappear. Always conduct your own research and due diligence.

---

## License

MIT License - See LICENSE file for details.

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

Focus areas:
- New edge detection strategies
- Improved calibration methods
- Additional data sources
- Visualization tools
