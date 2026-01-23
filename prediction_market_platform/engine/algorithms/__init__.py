"""
Advanced Algorithms Module.

Provides sophisticated models for edge detection and opportunity scoring:
- Bayesian probability estimation
- Ensemble signal aggregation
- Edge decay modeling
- Market efficiency analysis
- Real-time accuracy tracking
- Cross-market correlation analysis
- Market clustering
- Arbitrage detection
- Data validation
"""

from .advanced_edge_detection import (
    BayesianEstimate,
    EdgeSignal,
    MarketEfficiency,
    BayesianEdgeEstimator,
    EnsembleEdgeAggregator,
    EdgeDecayModel,
    MarketEfficiencyAnalyzer,
    RealTimeAccuracyTracker
)

from .market_analysis import (
    MarketCorrelation,
    MarketCluster,
    ArbitrageOpportunity,
    MarketCorrelationAnalyzer,
    MarketClusterer,
    ArbitrageDetector,
    LiveDataValidator
)

__all__ = [
    # Edge Detection
    'BayesianEstimate',
    'EdgeSignal',
    'MarketEfficiency',
    'BayesianEdgeEstimator',
    'EnsembleEdgeAggregator',
    'EdgeDecayModel',
    'MarketEfficiencyAnalyzer',
    'RealTimeAccuracyTracker',
    # Market Analysis
    'MarketCorrelation',
    'MarketCluster',
    'ArbitrageOpportunity',
    'MarketCorrelationAnalyzer',
    'MarketClusterer',
    'ArbitrageDetector',
    'LiveDataValidator'
]
