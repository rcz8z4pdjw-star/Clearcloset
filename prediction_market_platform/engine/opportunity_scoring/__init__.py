"""
Opportunity scoring and ranking system.

Combines signals from multiple strategies into ranked opportunities.
"""

from .scorer import OpportunityScorer, rank_opportunities

__all__ = [
    'OpportunityScorer',
    'rank_opportunities',
]
