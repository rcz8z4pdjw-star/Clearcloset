"""
Task Scheduler for Automated Data Collection.

Provides scheduling capabilities for:
- Periodic market data collection
- Scheduled signal generation
- Automated report generation
- Data cleanup and maintenance

NOTE: This is for RESEARCH data collection only.
No automated trading is performed.
"""

import time
import threading
from datetime import datetime, timedelta
from typing import Callable, Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
import json
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config

logger = get_logger("scheduler")


class TaskStatus(Enum):
    """Status of a scheduled task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskFrequency(Enum):
    """Frequency of task execution."""
    ONCE = "once"
    MINUTELY = "minutely"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


@dataclass
class ScheduledTask:
    """Definition of a scheduled task."""
    task_id: str
    name: str
    function: Callable
    frequency: TaskFrequency

    # Scheduling options
    interval_minutes: int = 60  # For minutely/hourly
    hour: int = 0  # For daily/weekly (24h format)
    minute: int = 0  # For daily/weekly
    day_of_week: int = 0  # For weekly (0=Monday)

    # Execution tracking
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    run_count: int = 0
    failure_count: int = 0
    status: TaskStatus = TaskStatus.PENDING

    # Configuration
    enabled: bool = True
    max_retries: int = 3
    timeout_minutes: int = 30
    args: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Calculate next run time."""
        if self.next_run is None:
            self.next_run = self._calculate_next_run()

    def _calculate_next_run(self) -> datetime:
        """Calculate next execution time."""
        now = datetime.utcnow()

        if self.frequency == TaskFrequency.ONCE:
            return now

        elif self.frequency == TaskFrequency.MINUTELY:
            return now + timedelta(minutes=self.interval_minutes)

        elif self.frequency == TaskFrequency.HOURLY:
            next_run = now.replace(minute=self.minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(hours=1)
            return next_run

        elif self.frequency == TaskFrequency.DAILY:
            next_run = now.replace(
                hour=self.hour, minute=self.minute,
                second=0, microsecond=0
            )
            if next_run <= now:
                next_run += timedelta(days=1)
            return next_run

        elif self.frequency == TaskFrequency.WEEKLY:
            days_ahead = self.day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(
                hour=self.hour, minute=self.minute,
                second=0, microsecond=0
            )
            return next_run

        return now


@dataclass
class TaskResult:
    """Result of a task execution."""
    task_id: str
    start_time: datetime
    end_time: datetime
    success: bool
    result: Any = None
    error: Optional[str] = None

    @property
    def duration_seconds(self) -> float:
        return (self.end_time - self.start_time).total_seconds()


class TaskScheduler:
    """
    Task scheduler for automated data collection and processing.

    Manages periodic execution of:
    - Market data collection
    - Signal generation
    - Report creation
    - Data maintenance

    NOTE: Research purposes only. No trading automation.
    """

    def __init__(self, state_file: Optional[str] = None):
        """
        Initialize scheduler.

        Args:
            state_file: Path to persist scheduler state
        """
        self.tasks: Dict[str, ScheduledTask] = {}
        self.results: List[TaskResult] = []
        self.running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        if state_file:
            self.state_file = Path(state_file)
        else:
            self.state_file = Path(get_config(
                'scheduler.state_file',
                'data/scheduler_state.json'
            ))

        self.check_interval = get_config('scheduler.check_interval_seconds', 60)
        self.max_results = get_config('scheduler.max_results_stored', 1000)

    def add_task(
        self,
        task_id: str,
        name: str,
        function: Callable,
        frequency: TaskFrequency = TaskFrequency.HOURLY,
        **kwargs
    ) -> ScheduledTask:
        """
        Add a new scheduled task.

        Args:
            task_id: Unique task identifier
            name: Human-readable task name
            function: Function to execute
            frequency: How often to run
            **kwargs: Additional task configuration

        Returns:
            Created ScheduledTask
        """
        with self._lock:
            task = ScheduledTask(
                task_id=task_id,
                name=name,
                function=function,
                frequency=frequency,
                **kwargs
            )
            self.tasks[task_id] = task
            logger.info(f"Added task: {name} ({task_id}), next run: {task.next_run}")
            return task

    def remove_task(self, task_id: str) -> bool:
        """Remove a scheduled task."""
        with self._lock:
            if task_id in self.tasks:
                del self.tasks[task_id]
                logger.info(f"Removed task: {task_id}")
                return True
            return False

    def enable_task(self, task_id: str) -> bool:
        """Enable a task."""
        with self._lock:
            if task_id in self.tasks:
                self.tasks[task_id].enabled = True
                logger.info(f"Enabled task: {task_id}")
                return True
            return False

    def disable_task(self, task_id: str) -> bool:
        """Disable a task."""
        with self._lock:
            if task_id in self.tasks:
                self.tasks[task_id].enabled = False
                logger.info(f"Disabled task: {task_id}")
                return True
            return False

    def run_task_now(self, task_id: str) -> Optional[TaskResult]:
        """
        Execute a task immediately.

        Args:
            task_id: Task to execute

        Returns:
            TaskResult or None if task not found
        """
        if task_id not in self.tasks:
            logger.error(f"Task not found: {task_id}")
            return None

        return self._execute_task(self.tasks[task_id])

    def _execute_task(self, task: ScheduledTask) -> TaskResult:
        """Execute a single task."""
        task.status = TaskStatus.RUNNING
        start_time = datetime.utcnow()

        logger.info(f"Executing task: {task.name} ({task.task_id})")

        try:
            result = task.function(**task.args)
            end_time = datetime.utcnow()

            task_result = TaskResult(
                task_id=task.task_id,
                start_time=start_time,
                end_time=end_time,
                success=True,
                result=result
            )

            task.status = TaskStatus.COMPLETED
            task.run_count += 1
            task.last_run = end_time

            logger.info(
                f"Task completed: {task.name} in {task_result.duration_seconds:.1f}s"
            )

        except Exception as e:
            end_time = datetime.utcnow()

            task_result = TaskResult(
                task_id=task.task_id,
                start_time=start_time,
                end_time=end_time,
                success=False,
                error=str(e)
            )

            task.status = TaskStatus.FAILED
            task.failure_count += 1
            task.last_run = end_time

            logger.error(f"Task failed: {task.name} - {e}")

        # Update next run time
        if task.frequency != TaskFrequency.ONCE:
            task.next_run = task._calculate_next_run()

        # Store result
        with self._lock:
            self.results.append(task_result)
            # Trim old results
            if len(self.results) > self.max_results:
                self.results = self.results[-self.max_results:]

        return task_result

    def start(self, daemon: bool = True):
        """
        Start the scheduler.

        Args:
            daemon: Run as daemon thread
        """
        if self.running:
            logger.warning("Scheduler already running")
            return

        self.running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=daemon)
        self._thread.start()
        logger.info("Scheduler started")

    def stop(self, wait: bool = True, timeout: float = 30.0):
        """
        Stop the scheduler.

        Args:
            wait: Wait for current task to complete
            timeout: Maximum wait time in seconds
        """
        self.running = False

        if wait and self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)

        logger.info("Scheduler stopped")

    def _run_loop(self):
        """Main scheduler loop."""
        while self.running:
            now = datetime.utcnow()

            with self._lock:
                tasks_to_run = [
                    task for task in self.tasks.values()
                    if task.enabled
                    and task.status != TaskStatus.RUNNING
                    and task.next_run
                    and task.next_run <= now
                ]

            for task in tasks_to_run:
                if not self.running:
                    break
                self._execute_task(task)

            # Sleep before next check
            time.sleep(self.check_interval)

    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status."""
        with self._lock:
            return {
                'running': self.running,
                'task_count': len(self.tasks),
                'tasks': [
                    {
                        'task_id': t.task_id,
                        'name': t.name,
                        'enabled': t.enabled,
                        'status': t.status.value,
                        'frequency': t.frequency.value,
                        'last_run': t.last_run.isoformat() if t.last_run else None,
                        'next_run': t.next_run.isoformat() if t.next_run else None,
                        'run_count': t.run_count,
                        'failure_count': t.failure_count
                    }
                    for t in self.tasks.values()
                ],
                'recent_results': [
                    {
                        'task_id': r.task_id,
                        'start_time': r.start_time.isoformat(),
                        'duration_seconds': r.duration_seconds,
                        'success': r.success,
                        'error': r.error
                    }
                    for r in self.results[-10:]
                ]
            }

    def save_state(self):
        """Save scheduler state to file."""
        state = {
            'saved_at': datetime.utcnow().isoformat(),
            'tasks': {
                task_id: {
                    'last_run': task.last_run.isoformat() if task.last_run else None,
                    'run_count': task.run_count,
                    'failure_count': task.failure_count,
                    'enabled': task.enabled
                }
                for task_id, task in self.tasks.items()
            }
        }

        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)

        logger.info(f"Saved scheduler state to {self.state_file}")

    def load_state(self):
        """Load scheduler state from file."""
        if not self.state_file.exists():
            return

        try:
            with open(self.state_file) as f:
                state = json.load(f)

            for task_id, task_state in state.get('tasks', {}).items():
                if task_id in self.tasks:
                    task = self.tasks[task_id]
                    if task_state.get('last_run'):
                        task.last_run = datetime.fromisoformat(task_state['last_run'])
                    task.run_count = task_state.get('run_count', 0)
                    task.failure_count = task_state.get('failure_count', 0)
                    task.enabled = task_state.get('enabled', True)

            logger.info(f"Loaded scheduler state from {self.state_file}")

        except Exception as e:
            logger.error(f"Failed to load scheduler state: {e}")


def create_default_scheduler() -> TaskScheduler:
    """
    Create scheduler with default research tasks.

    Returns:
        Configured TaskScheduler
    """
    from engine.data_ingestion import get_database
    from engine.data_ingestion.polymarket_collector import PolymarketCollector
    from engine.data_ingestion.kalshi_collector import KalshiCollector
    from engine.signal_generation import SignalEngine

    scheduler = TaskScheduler()
    db = get_database()

    # Data collection tasks
    def collect_polymarket():
        collector = PolymarketCollector(db=db)
        snapshots, order_books = collector.collect_all_snapshots(
            max_markets=200,
            include_order_books=True
        )
        return {'snapshots': len(snapshots), 'order_books': len(order_books)}

    def collect_kalshi():
        collector = KalshiCollector(db=db)
        snapshots, order_books = collector.collect_all_snapshots(
            max_markets=200,
            include_order_books=True
        )
        return {'snapshots': len(snapshots), 'order_books': len(order_books)}

    def generate_signals():
        engine = SignalEngine(db=db)
        batch = engine.generate_signals(save_to_db=True)
        return {'signals': batch.total_signals}

    # Add default tasks
    scheduler.add_task(
        task_id='collect_polymarket',
        name='Collect Polymarket Data',
        function=collect_polymarket,
        frequency=TaskFrequency.HOURLY,
        minute=0
    )

    scheduler.add_task(
        task_id='collect_kalshi',
        name='Collect Kalshi Data',
        function=collect_kalshi,
        frequency=TaskFrequency.HOURLY,
        minute=15
    )

    scheduler.add_task(
        task_id='generate_signals',
        name='Generate Trading Signals',
        function=generate_signals,
        frequency=TaskFrequency.HOURLY,
        minute=30
    )

    return scheduler
