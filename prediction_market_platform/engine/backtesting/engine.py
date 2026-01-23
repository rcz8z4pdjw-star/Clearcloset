"""
Backtesting Engine.

Evaluates strategy performance on historical data.

The backtesting engine:
1. Replays historical market snapshots
2. Generates signals at each timestamp
3. Simulates position entry/exit
4. Computes performance metrics
5. Produces detailed reports
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import math

from ..data_ingestion.models import (
    MarketSnapshot, MarketResolution, PriceHistory,
    BacktestTrade, BacktestResult, MarketSource, OutcomeResult
)
from ..data_ingestion.database import Database, get_database
from ...strategies.base import Strategy, StrategyResult, SignalDirection
from ...utils.helpers import brier_score, calibration_error, calculate_sharpe_ratio, calculate_max_drawdown
from ...utils.config_loader import get_config
from ...utils.logging_setup import get_logger

logger = get_logger("backtest_engine")


@dataclass
class BacktestConfig:
    """Configuration for backtesting."""
    start_date: datetime
    end_date: datetime
    initial_capital: float = 10000.0
    position_size_pct: float = 0.05  # 5% per position
    max_positions: int = 20
    slippage_pct: float = 0.005  # 0.5% slippage
    min_confidence: float = 0.50
    min_expected_value: float = 0.02

    @classmethod
    def from_config(cls, **overrides) -> 'BacktestConfig':
        """Load from configuration with optional overrides."""
        bt_config = get_config('backtesting', {})

        start_str = bt_config.get('default_start_date', '2023-01-01')
        end_str = bt_config.get('default_end_date')

        return cls(
            start_date=datetime.fromisoformat(overrides.get('start_date', start_str)),
            end_date=datetime.fromisoformat(overrides.get('end_date', end_str)) if end_str else datetime.utcnow(),
            initial_capital=overrides.get('initial_capital', bt_config.get('initial_capital', 10000)),
            position_size_pct=overrides.get('position_size_pct', bt_config.get('position_size_pct', 0.05)),
            max_positions=overrides.get('max_positions', bt_config.get('max_positions', 20)),
            slippage_pct=overrides.get('slippage_pct', bt_config.get('slippage', {}).get('value', 0.005)),
            min_confidence=overrides.get('min_confidence', 0.50),
            min_expected_value=overrides.get('min_expected_value', 0.02)
        )


@dataclass
class Position:
    """Active position in backtest."""
    market_id: str
    strategy_name: str
    side: str  # "yes" or "no"
    entry_price: float
    entry_time: datetime
    size: float  # In dollars
    signal_strength: float
    confidence: float
    probability_estimate: float


class BacktestEngine:
    """
    Engine for strategy backtesting.

    Simulates strategy performance on historical data with
    realistic assumptions about execution and costs.
    """

    def __init__(
        self,
        config: Optional[BacktestConfig] = None,
        db: Optional[Database] = None
    ):
        """
        Initialize backtest engine.

        Args:
            config: Backtest configuration
            db: Database with historical data
        """
        self.config = config or BacktestConfig.from_config()
        self.db = db or get_database()

    def run_backtest(
        self,
        strategy: Strategy,
        source: Optional[MarketSource] = None
    ) -> BacktestResult:
        """
        Run backtest for a strategy.

        Args:
            strategy: Strategy to test
            source: Market source filter

        Returns:
            BacktestResult with performance metrics
        """
        logger.info(f"Starting backtest for {strategy.name}")
        logger.info(f"Period: {self.config.start_date.date()} to {self.config.end_date.date()}")

        # Load historical data
        resolutions = self._load_resolutions(source)
        logger.info(f"Loaded {len(resolutions)} resolved markets")

        if not resolutions:
            logger.warning("No resolved markets found for backtesting")
            return self._empty_result(strategy.name)

        # Initialize state
        capital = self.config.initial_capital
        positions: Dict[str, Position] = {}
        trades: List[BacktestTrade] = []
        equity_curve = [capital]
        equity_timestamps = [self.config.start_date]
        predictions: List[float] = []
        outcomes: List[int] = []

        # Process each resolved market
        for resolution in resolutions:
            # Load historical snapshots for this market
            history = self._load_market_history(
                resolution.market_id,
                source,
                resolution.resolution_time
            )

            if not history:
                continue

            # Simulate trading through market's lifetime
            for snapshot in history:
                # Check if we can take a new position
                if len(positions) < self.config.max_positions and resolution.market_id not in positions:
                    signal = strategy.run(snapshot)

                    if signal and self._passes_filters(signal):
                        # Enter position
                        position = self._enter_position(
                            signal=signal,
                            capital=capital,
                            timestamp=snapshot.timestamp
                        )

                        if position:
                            positions[resolution.market_id] = position

                            # Record prediction for calibration
                            predictions.append(signal.probability_estimate)
                            outcomes.append(1 if resolution.outcome == OutcomeResult.YES else 0)

            # Close position at resolution
            if resolution.market_id in positions:
                position = positions.pop(resolution.market_id)
                trade, pnl = self._close_position(position, resolution)
                trades.append(trade)
                capital += pnl

                # Update equity curve
                equity_curve.append(capital)
                equity_timestamps.append(resolution.resolution_time)

        # Calculate metrics
        result = self._calculate_metrics(
            strategy_name=strategy.name,
            trades=trades,
            equity_curve=equity_curve,
            equity_timestamps=equity_timestamps,
            predictions=predictions,
            outcomes=outcomes
        )

        logger.info(f"Backtest complete: {result.total_trades} trades, {result.total_return:.2%} return")
        return result

    def _load_resolutions(
        self,
        source: Optional[MarketSource]
    ) -> List[MarketResolution]:
        """Load resolved markets within backtest period."""
        return self.db.get_resolutions(
            source=source,
            start_time=self.config.start_date,
            end_time=self.config.end_date
        )

    def _load_market_history(
        self,
        market_id: str,
        source: Optional[MarketSource],
        resolution_time: datetime
    ) -> List[MarketSnapshot]:
        """Load historical snapshots for a market before resolution."""
        # Load snapshots ending before resolution
        end_time = resolution_time - timedelta(hours=1)
        start_time = resolution_time - timedelta(days=7)  # Look back 7 days

        return self.db.get_snapshots(
            market_id=market_id,
            source=source,
            start_time=start_time,
            end_time=end_time,
            limit=100
        )

    def _passes_filters(self, signal: StrategyResult) -> bool:
        """Check if signal passes backtest filters."""
        if signal.confidence < self.config.min_confidence:
            return False
        if abs(signal.expected_value) < self.config.min_expected_value:
            return False
        if signal.direction == SignalDirection.HOLD:
            return False
        return True

    def _enter_position(
        self,
        signal: StrategyResult,
        capital: float,
        timestamp: datetime
    ) -> Optional[Position]:
        """Enter a new position."""
        # Calculate position size
        size = capital * self.config.position_size_pct

        # Determine side and entry price
        if signal.direction == SignalDirection.BUY_YES:
            side = "yes"
            entry_price = signal.market_probability * (1 + self.config.slippage_pct)
        else:
            side = "no"
            entry_price = (1 - signal.market_probability) * (1 + self.config.slippage_pct)

        return Position(
            market_id=signal.market_id,
            strategy_name=signal.strategy_name,
            side=side,
            entry_price=entry_price,
            entry_time=timestamp,
            size=size,
            signal_strength=signal.signal_strength,
            confidence=signal.confidence,
            probability_estimate=signal.probability_estimate
        )

    def _close_position(
        self,
        position: Position,
        resolution: MarketResolution
    ) -> Tuple[BacktestTrade, float]:
        """Close position at resolution."""
        # Determine settlement
        if position.side == "yes":
            settlement = resolution.settlement_value
        else:
            settlement = 1 - resolution.settlement_value

        # Calculate P&L
        # Bought at entry_price, worth settlement at resolution
        shares = position.size / position.entry_price
        exit_value = shares * settlement
        pnl = exit_value - position.size
        return_pct = pnl / position.size if position.size > 0 else 0

        outcome = "win" if pnl > 0 else "loss" if pnl < 0 else "push"

        trade = BacktestTrade(
            entry_time=position.entry_time,
            exit_time=resolution.resolution_time,
            market_id=position.market_id,
            strategy_name=position.strategy_name,
            side=position.side,
            entry_price=position.entry_price,
            exit_price=settlement,
            position_size=position.size,
            pnl=pnl,
            return_pct=return_pct,
            outcome=outcome
        )

        return trade, pnl

    def _calculate_metrics(
        self,
        strategy_name: str,
        trades: List[BacktestTrade],
        equity_curve: List[float],
        equity_timestamps: List[datetime],
        predictions: List[float],
        outcomes: List[int]
    ) -> BacktestResult:
        """Calculate all backtest metrics."""
        if not trades:
            return self._empty_result(strategy_name)

        # Basic stats
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.outcome == "win"]
        losing_trades = [t for t in trades if t.outcome == "loss"]

        win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0

        # Returns
        returns = [t.return_pct for t in trades]
        total_return = (equity_curve[-1] / equity_curve[0]) - 1 if equity_curve[0] > 0 else 0

        # Annualized return
        days = (self.config.end_date - self.config.start_date).days
        years = days / 365.0 if days > 0 else 1
        annualized_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0

        # Risk metrics
        sharpe = calculate_sharpe_ratio(returns)
        max_dd = calculate_max_drawdown(equity_curve)

        # Sortino ratio (downside deviation only)
        negative_returns = [r for r in returns if r < 0]
        downside_dev = math.sqrt(sum(r ** 2 for r in negative_returns) / len(negative_returns)) if negative_returns else 0.01
        sortino = (sum(returns) / len(returns)) / downside_dev if downside_dev > 0 else 0

        # Profit factor
        gross_profit = sum(t.pnl for t in winning_trades)
        gross_loss = abs(sum(t.pnl for t in losing_trades))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')

        # Calibration metrics
        bs = brier_score(predictions, outcomes) if predictions else 0
        cal_error = calibration_error(predictions, outcomes) if predictions else 0

        # Trade statistics
        avg_profit = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0

        durations = [(t.exit_time - t.entry_time).total_seconds() / 3600 for t in trades]
        avg_duration = sum(durations) / len(durations) if durations else 0

        # Streaks
        max_wins, max_losses = self._calculate_streaks(trades)

        return BacktestResult(
            strategy_name=strategy_name,
            start_date=self.config.start_date,
            end_date=self.config.end_date,
            trades=trades,
            total_trades=total_trades,
            total_return=total_return,
            annualized_return=annualized_return,
            sharpe_ratio=sharpe,
            sortino_ratio=sortino,
            max_drawdown=max_dd,
            win_rate=win_rate,
            profit_factor=profit_factor,
            brier_score=bs,
            calibration_error=cal_error,
            log_loss=0,  # Would calculate if needed
            equity_curve=equity_curve,
            equity_timestamps=equity_timestamps,
            avg_trade_duration_hours=avg_duration,
            avg_profit_per_trade=avg_profit,
            avg_loss_per_trade=avg_loss,
            best_trade=max(t.pnl for t in trades) if trades else 0,
            worst_trade=min(t.pnl for t in trades) if trades else 0,
            consecutive_wins=max_wins,
            consecutive_losses=max_losses
        )

    def _calculate_streaks(self, trades: List[BacktestTrade]) -> Tuple[int, int]:
        """Calculate max consecutive wins and losses."""
        max_wins = 0
        max_losses = 0
        current_wins = 0
        current_losses = 0

        for trade in trades:
            if trade.outcome == "win":
                current_wins += 1
                current_losses = 0
                max_wins = max(max_wins, current_wins)
            elif trade.outcome == "loss":
                current_losses += 1
                current_wins = 0
                max_losses = max(max_losses, current_losses)
            else:
                current_wins = 0
                current_losses = 0

        return max_wins, max_losses

    def _empty_result(self, strategy_name: str) -> BacktestResult:
        """Create empty result when no trades."""
        return BacktestResult(
            strategy_name=strategy_name,
            start_date=self.config.start_date,
            end_date=self.config.end_date,
            trades=[],
            total_trades=0,
            total_return=0,
            annualized_return=0,
            sharpe_ratio=0,
            sortino_ratio=0,
            max_drawdown=0,
            win_rate=0,
            profit_factor=0,
            brier_score=0,
            calibration_error=0,
            log_loss=0,
            equity_curve=[self.config.initial_capital],
            equity_timestamps=[self.config.start_date],
            avg_trade_duration_hours=0,
            avg_profit_per_trade=0,
            avg_loss_per_trade=0,
            best_trade=0,
            worst_trade=0,
            consecutive_wins=0,
            consecutive_losses=0
        )


def run_backtest(
    strategy: Strategy,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source: Optional[MarketSource] = None,
    db: Optional[Database] = None
) -> BacktestResult:
    """
    Convenience function to run a backtest.

    Args:
        strategy: Strategy to test
        start_date: Start date (ISO format)
        end_date: End date (ISO format)
        source: Market source filter
        db: Database instance

    Returns:
        BacktestResult
    """
    config = BacktestConfig.from_config(
        start_date=start_date,
        end_date=end_date
    )
    engine = BacktestEngine(config=config, db=db)
    return engine.run_backtest(strategy, source=source)
