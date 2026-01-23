"""
News and Events Collection Module.

Monitors news sources and event calendars for market-moving information.
"""

from .news_collector import (
    NewsItem,
    ScheduledEvent,
    NewsCategory,
    NewsAnalyzer,
    RSSCollector,
    EventCalendar,
    NewsAggregator,
    create_news_aggregator
)

__all__ = [
    'NewsItem',
    'ScheduledEvent',
    'NewsCategory',
    'NewsAnalyzer',
    'RSSCollector',
    'EventCalendar',
    'NewsAggregator',
    'create_news_aggregator'
]
