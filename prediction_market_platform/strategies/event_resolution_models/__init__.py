"""
Event Resolution Models.

Strategies focused on pre-resolution convergence and settlement patterns.
"""

# Re-export late resolution from structural edges
from ..structural_edges.late_resolution import LateResolutionStrategy

__all__ = ['LateResolutionStrategy']
