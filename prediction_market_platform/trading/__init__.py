"""
Trading Execution Module.

IMPORTANT: This module enables automated trading.
Use with extreme caution and proper risk management.

Features:
- Order execution for Polymarket and Kalshi
- Position tracking and management
- Risk management and limits
- Trade logging and auditing
"""

from .executor import (
    TradeExecutor,
    Order,
    OrderSide,
    OrderType,
    OrderStatus,
    Trade,
    ExecutionResult
)
from .risk_manager import (
    RiskManager,
    RiskLimits,
    RiskCheck,
    RiskViolation
)
from .position_tracker import (
    PositionTracker,
    Position,
    PortfolioSummary
)

__all__ = [
    # Execution
    'TradeExecutor',
    'Order',
    'OrderSide',
    'OrderType',
    'OrderStatus',
    'Trade',
    'ExecutionResult',
    # Risk Management
    'RiskManager',
    'RiskLimits',
    'RiskCheck',
    'RiskViolation',
    # Position Tracking
    'PositionTracker',
    'Position',
    'PortfolioSummary',
]
