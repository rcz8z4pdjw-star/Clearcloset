"""
Output and reporting module.

Generates reports, exports data, and creates visualizations.
"""

from .report_generator import ReportGenerator, generate_daily_report, generate_strategy_report

__all__ = [
    'ReportGenerator',
    'generate_daily_report',
    'generate_strategy_report',
]
