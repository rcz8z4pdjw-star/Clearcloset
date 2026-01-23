"""
Alert and Notification System.

Provides alerts for research opportunities and system events.
"""

from .alert_system import (
    AlertManager,
    Alert,
    AlertRule,
    AlertPriority,
    AlertType,
    AlertChannel,
    ConsoleAlertChannel,
    FileAlertChannel,
    EmailAlertChannel,
    WebhookAlertChannel,
    create_default_alert_manager
)

__all__ = [
    'AlertManager',
    'Alert',
    'AlertRule',
    'AlertPriority',
    'AlertType',
    'AlertChannel',
    'ConsoleAlertChannel',
    'FileAlertChannel',
    'EmailAlertChannel',
    'WebhookAlertChannel',
    'create_default_alert_manager'
]
