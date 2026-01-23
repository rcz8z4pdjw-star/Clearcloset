"""
Alert and Notification System.

Provides alerts for:
- High-value opportunities
- Strategy signal triggers
- Data quality issues
- System events

NOTE: Alerts are for RESEARCH notification only.
No automated trading actions are taken.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import json
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.logging_setup import get_logger
from utils.config_loader import get_config
from engine.data_ingestion.models import Opportunity, MarketSnapshot

logger = get_logger("alerts")


class AlertPriority(Enum):
    """Priority levels for alerts."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    """Types of alerts."""
    OPPORTUNITY = "opportunity"
    SIGNAL = "signal"
    DATA_QUALITY = "data_quality"
    SYSTEM = "system"
    THRESHOLD = "threshold"


@dataclass
class Alert:
    """Single alert notification."""
    alert_id: str
    alert_type: AlertType
    priority: AlertPriority
    title: str
    message: str
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Context
    market_id: Optional[str] = None
    market_name: Optional[str] = None
    strategy_name: Optional[str] = None

    # Metrics
    score: Optional[float] = None
    expected_value: Optional[float] = None
    confidence: Optional[float] = None

    # Status
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'alert_id': self.alert_id,
            'alert_type': self.alert_type.value,
            'priority': self.priority.value,
            'title': self.title,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'market_id': self.market_id,
            'market_name': self.market_name,
            'strategy_name': self.strategy_name,
            'score': self.score,
            'expected_value': self.expected_value,
            'confidence': self.confidence,
            'acknowledged': self.acknowledged
        }


@dataclass
class AlertRule:
    """Rule for generating alerts."""
    rule_id: str
    name: str
    description: str
    alert_type: AlertType
    priority: AlertPriority

    # Conditions
    min_score: Optional[float] = None
    min_expected_value: Optional[float] = None
    min_confidence: Optional[float] = None
    max_risk: Optional[float] = None
    strategies: Optional[List[str]] = None

    # Status
    enabled: bool = True
    cooldown_minutes: int = 60  # Minimum time between alerts
    last_triggered: Optional[datetime] = None


class AlertChannel:
    """Base class for alert delivery channels."""

    def send(self, alert: Alert) -> bool:
        """Send alert through channel. Override in subclasses."""
        raise NotImplementedError


class ConsoleAlertChannel(AlertChannel):
    """Console/log alert channel."""

    def send(self, alert: Alert) -> bool:
        """Print alert to console."""
        priority_symbols = {
            AlertPriority.LOW: "ℹ️",
            AlertPriority.MEDIUM: "⚠️",
            AlertPriority.HIGH: "🔔",
            AlertPriority.CRITICAL: "🚨"
        }

        symbol = priority_symbols.get(alert.priority, "📢")

        print(f"\n{symbol} ALERT [{alert.priority.value.upper()}]: {alert.title}")
        print(f"   {alert.message}")
        if alert.market_name:
            print(f"   Market: {alert.market_name}")
        if alert.score:
            print(f"   Score: {alert.score:.3f}")
        if alert.expected_value:
            print(f"   EV: {alert.expected_value:+.2%}")
        print()

        logger.info(f"Alert sent: {alert.title}")
        return True


class FileAlertChannel(AlertChannel):
    """File-based alert channel."""

    def __init__(self, output_path: str = "output/alerts/alerts.jsonl"):
        self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

    def send(self, alert: Alert) -> bool:
        """Write alert to file."""
        try:
            with open(self.output_path, 'a') as f:
                f.write(json.dumps(alert.to_dict()) + '\n')
            return True
        except Exception as e:
            logger.error(f"Failed to write alert to file: {e}")
            return False


class EmailAlertChannel(AlertChannel):
    """Email alert channel."""

    def __init__(
        self,
        smtp_host: str = "localhost",
        smtp_port: int = 587,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_addr: str = "alerts@prediction-market-research.local",
        to_addrs: Optional[List[str]] = None
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_addr = from_addr
        self.to_addrs = to_addrs or []

    def send(self, alert: Alert) -> bool:
        """Send alert via email."""
        if not self.to_addrs:
            logger.warning("No email recipients configured")
            return False

        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_addr
            msg['To'] = ', '.join(self.to_addrs)
            msg['Subject'] = f"[{alert.priority.value.upper()}] {alert.title}"

            body = self._format_email_body(alert)
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.username and self.password:
                    server.starttls()
                    server.login(self.username, self.password)
                server.send_message(msg)

            logger.info(f"Email alert sent: {alert.title}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False

    def _format_email_body(self, alert: Alert) -> str:
        """Format email body."""
        lines = [
            f"PREDICTION MARKET RESEARCH ALERT",
            f"=" * 50,
            f"",
            f"Priority: {alert.priority.value.upper()}",
            f"Type: {alert.alert_type.value}",
            f"Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC",
            f"",
            f"Title: {alert.title}",
            f"",
            f"Message:",
            f"{alert.message}",
            f"",
        ]

        if alert.market_name:
            lines.extend([
                f"Market Details:",
                f"  Name: {alert.market_name}",
                f"  ID: {alert.market_id}",
            ])

        if alert.score is not None:
            lines.append(f"  Score: {alert.score:.3f}")
        if alert.expected_value is not None:
            lines.append(f"  Expected Value: {alert.expected_value:+.2%}")
        if alert.confidence is not None:
            lines.append(f"  Confidence: {alert.confidence:.0%}")

        lines.extend([
            f"",
            f"=" * 50,
            f"NOTE: This is for RESEARCH purposes only.",
            f"No automated trading is performed.",
        ])

        return '\n'.join(lines)


class WebhookAlertChannel(AlertChannel):
    """Webhook alert channel (Slack, Discord, etc.)."""

    def __init__(self, webhook_url: str, format_type: str = "slack"):
        self.webhook_url = webhook_url
        self.format_type = format_type

    def send(self, alert: Alert) -> bool:
        """Send alert via webhook."""
        try:
            import urllib.request

            payload = self._format_payload(alert)

            req = urllib.request.Request(
                self.webhook_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    logger.info(f"Webhook alert sent: {alert.title}")
                    return True
                else:
                    logger.error(f"Webhook returned status {response.status}")
                    return False

        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")
            return False

    def _format_payload(self, alert: Alert) -> Dict[str, Any]:
        """Format webhook payload."""
        if self.format_type == "slack":
            return self._format_slack(alert)
        elif self.format_type == "discord":
            return self._format_discord(alert)
        else:
            return alert.to_dict()

    def _format_slack(self, alert: Alert) -> Dict[str, Any]:
        """Format for Slack webhook."""
        color = {
            AlertPriority.LOW: "#36a64f",
            AlertPriority.MEDIUM: "#ffcc00",
            AlertPriority.HIGH: "#ff9900",
            AlertPriority.CRITICAL: "#ff0000"
        }.get(alert.priority, "#808080")

        fields = []
        if alert.score is not None:
            fields.append({"title": "Score", "value": f"{alert.score:.3f}", "short": True})
        if alert.expected_value is not None:
            fields.append({"title": "EV", "value": f"{alert.expected_value:+.2%}", "short": True})

        return {
            "attachments": [{
                "color": color,
                "title": alert.title,
                "text": alert.message,
                "fields": fields,
                "footer": "Prediction Market Research Platform",
                "ts": int(alert.timestamp.timestamp())
            }]
        }

    def _format_discord(self, alert: Alert) -> Dict[str, Any]:
        """Format for Discord webhook."""
        color = {
            AlertPriority.LOW: 0x36a64f,
            AlertPriority.MEDIUM: 0xffcc00,
            AlertPriority.HIGH: 0xff9900,
            AlertPriority.CRITICAL: 0xff0000
        }.get(alert.priority, 0x808080)

        fields = []
        if alert.score is not None:
            fields.append({"name": "Score", "value": f"{alert.score:.3f}", "inline": True})
        if alert.expected_value is not None:
            fields.append({"name": "EV", "value": f"{alert.expected_value:+.2%}", "inline": True})

        return {
            "embeds": [{
                "title": alert.title,
                "description": alert.message,
                "color": color,
                "fields": fields,
                "footer": {"text": "Prediction Market Research Platform"},
                "timestamp": alert.timestamp.isoformat()
            }]
        }


class AlertManager:
    """
    Manages alert generation and delivery.

    Features:
    - Rule-based alert generation
    - Multiple delivery channels
    - Alert deduplication
    - Cooldown management
    """

    def __init__(self):
        self.channels: List[AlertChannel] = []
        self.rules: Dict[str, AlertRule] = {}
        self.alerts: List[Alert] = []
        self._alert_counter = 0

        # Load config
        self._load_default_rules()

    def _load_default_rules(self):
        """Load default alert rules."""
        self.add_rule(AlertRule(
            rule_id="high_value_opportunity",
            name="High-Value Opportunity",
            description="Alert when opportunity score exceeds threshold",
            alert_type=AlertType.OPPORTUNITY,
            priority=AlertPriority.HIGH,
            min_score=0.75,
            min_expected_value=0.05,
            cooldown_minutes=30
        ))

        self.add_rule(AlertRule(
            rule_id="critical_opportunity",
            name="Critical Opportunity",
            description="Alert for exceptional opportunities",
            alert_type=AlertType.OPPORTUNITY,
            priority=AlertPriority.CRITICAL,
            min_score=0.85,
            min_expected_value=0.08,
            cooldown_minutes=15
        ))

        self.add_rule(AlertRule(
            rule_id="strong_signal",
            name="Strong Strategy Signal",
            description="Alert when strategy generates strong signal",
            alert_type=AlertType.SIGNAL,
            priority=AlertPriority.MEDIUM,
            min_confidence=0.8,
            cooldown_minutes=60
        ))

    def add_channel(self, channel: AlertChannel):
        """Add a delivery channel."""
        self.channels.append(channel)
        logger.info(f"Added alert channel: {type(channel).__name__}")

    def add_rule(self, rule: AlertRule):
        """Add an alert rule."""
        self.rules[rule.rule_id] = rule
        logger.info(f"Added alert rule: {rule.name}")

    def remove_rule(self, rule_id: str):
        """Remove an alert rule."""
        if rule_id in self.rules:
            del self.rules[rule_id]

    def enable_rule(self, rule_id: str):
        """Enable an alert rule."""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = True

    def disable_rule(self, rule_id: str):
        """Disable an alert rule."""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = False

    def check_opportunities(self, opportunities: List[Opportunity]):
        """
        Check opportunities against rules and generate alerts.

        Args:
            opportunities: List of opportunities to check
        """
        for opp in opportunities:
            for rule in self.rules.values():
                if not rule.enabled:
                    continue
                if rule.alert_type != AlertType.OPPORTUNITY:
                    continue
                if self._check_cooldown(rule):
                    continue

                # Check conditions
                if rule.min_score and opp.composite_score < rule.min_score:
                    continue
                if rule.min_expected_value and opp.expected_value < rule.min_expected_value:
                    continue
                if rule.min_confidence and opp.confidence < rule.min_confidence:
                    continue
                if rule.max_risk and opp.risk_score > rule.max_risk:
                    continue

                # Generate alert
                alert = self._create_opportunity_alert(opp, rule)
                self._send_alert(alert, rule)

    def check_signal(
        self,
        strategy_name: str,
        market_id: str,
        market_name: str,
        confidence: float,
        expected_value: float
    ):
        """
        Check if a signal warrants an alert.

        Args:
            strategy_name: Name of strategy
            market_id: Market identifier
            market_name: Market name
            confidence: Signal confidence
            expected_value: Expected value
        """
        for rule in self.rules.values():
            if not rule.enabled:
                continue
            if rule.alert_type != AlertType.SIGNAL:
                continue
            if self._check_cooldown(rule):
                continue

            # Check strategy filter
            if rule.strategies and strategy_name not in rule.strategies:
                continue

            # Check conditions
            if rule.min_confidence and confidence < rule.min_confidence:
                continue
            if rule.min_expected_value and expected_value < rule.min_expected_value:
                continue

            # Generate alert
            alert = self._create_signal_alert(
                strategy_name, market_id, market_name,
                confidence, expected_value, rule
            )
            self._send_alert(alert, rule)

    def send_system_alert(
        self,
        title: str,
        message: str,
        priority: AlertPriority = AlertPriority.MEDIUM
    ):
        """Send a system alert."""
        self._alert_counter += 1
        alert = Alert(
            alert_id=f"sys-{self._alert_counter}",
            alert_type=AlertType.SYSTEM,
            priority=priority,
            title=title,
            message=message
        )
        self._send_alert(alert)

    def send_data_quality_alert(
        self,
        title: str,
        message: str,
        priority: AlertPriority = AlertPriority.MEDIUM
    ):
        """Send a data quality alert."""
        self._alert_counter += 1
        alert = Alert(
            alert_id=f"dq-{self._alert_counter}",
            alert_type=AlertType.DATA_QUALITY,
            priority=priority,
            title=title,
            message=message
        )
        self._send_alert(alert)

    def _create_opportunity_alert(
        self,
        opp: Opportunity,
        rule: AlertRule
    ) -> Alert:
        """Create alert from opportunity."""
        self._alert_counter += 1
        return Alert(
            alert_id=f"opp-{self._alert_counter}",
            alert_type=AlertType.OPPORTUNITY,
            priority=rule.priority,
            title=f"Opportunity: {opp.market_name[:50]}",
            message=(
                f"High-scoring opportunity detected. "
                f"Score: {opp.composite_score:.3f}, "
                f"EV: {opp.expected_value:+.2%}, "
                f"Side: {opp.suggested_side.upper()}"
            ),
            market_id=opp.market_id,
            market_name=opp.market_name,
            score=opp.composite_score,
            expected_value=opp.expected_value,
            confidence=opp.confidence
        )

    def _create_signal_alert(
        self,
        strategy_name: str,
        market_id: str,
        market_name: str,
        confidence: float,
        expected_value: float,
        rule: AlertRule
    ) -> Alert:
        """Create alert from signal."""
        self._alert_counter += 1
        return Alert(
            alert_id=f"sig-{self._alert_counter}",
            alert_type=AlertType.SIGNAL,
            priority=rule.priority,
            title=f"Signal: {strategy_name}",
            message=(
                f"Strategy {strategy_name} generated signal. "
                f"Confidence: {confidence:.0%}, "
                f"EV: {expected_value:+.2%}"
            ),
            market_id=market_id,
            market_name=market_name,
            strategy_name=strategy_name,
            expected_value=expected_value,
            confidence=confidence
        )

    def _check_cooldown(self, rule: AlertRule) -> bool:
        """Check if rule is in cooldown period."""
        if rule.last_triggered is None:
            return False

        cooldown_end = rule.last_triggered + timedelta(minutes=rule.cooldown_minutes)
        return datetime.utcnow() < cooldown_end

    def _send_alert(self, alert: Alert, rule: Optional[AlertRule] = None):
        """Send alert through all channels."""
        self.alerts.append(alert)

        if rule:
            rule.last_triggered = datetime.utcnow()

        for channel in self.channels:
            try:
                channel.send(alert)
            except Exception as e:
                logger.error(f"Channel {type(channel).__name__} failed: {e}")

    def get_recent_alerts(self, count: int = 20) -> List[Alert]:
        """Get recent alerts."""
        return self.alerts[-count:]

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert."""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.acknowledged = True
                alert.acknowledged_at = datetime.utcnow()
                return True
        return False


def create_default_alert_manager() -> AlertManager:
    """Create alert manager with default configuration."""
    manager = AlertManager()

    # Add console channel
    manager.add_channel(ConsoleAlertChannel())

    # Add file channel
    manager.add_channel(FileAlertChannel())

    # Load email config if available
    email_config = get_config('alerts.email', {})
    if email_config.get('enabled') and email_config.get('to_addrs'):
        manager.add_channel(EmailAlertChannel(
            smtp_host=email_config.get('smtp_host', 'localhost'),
            smtp_port=email_config.get('smtp_port', 587),
            username=email_config.get('username'),
            password=email_config.get('password'),
            from_addr=email_config.get('from_addr', 'alerts@local'),
            to_addrs=email_config.get('to_addrs', [])
        ))

    # Load webhook config if available
    webhook_url = get_config('alerts.webhook.url')
    if webhook_url:
        manager.add_channel(WebhookAlertChannel(
            webhook_url=webhook_url,
            format_type=get_config('alerts.webhook.format', 'slack')
        ))

    return manager
