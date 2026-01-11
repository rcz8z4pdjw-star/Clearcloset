"""
Dashboard Generator.

Creates interactive HTML dashboards for visualizing:
- Top opportunities
- Strategy performance
- Market analytics
- Historical data

Generates standalone HTML files that can be viewed in any browser.
No external dependencies required.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import json

from ..engine.data_ingestion.models import (
    Opportunity, BacktestResult, MarketSnapshot, MarketSource
)
from ..utils.config_loader import get_config


class DashboardGenerator:
    """
    Generates interactive HTML dashboards.

    Dashboards are standalone HTML files with embedded CSS and JavaScript.
    No external dependencies - viewable in any modern browser.
    """

    def __init__(self, output_dir: Optional[str] = None):
        """
        Initialize dashboard generator.

        Args:
            output_dir: Output directory for dashboards
        """
        self.output_dir = Path(output_dir or "output/dashboards")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_opportunities_dashboard(
        self,
        opportunities: List[Opportunity],
        title: str = "Prediction Market Opportunities"
    ) -> str:
        """
        Generate opportunities dashboard.

        Args:
            opportunities: List of opportunities to display
            title: Dashboard title

        Returns:
            Path to generated HTML file
        """
        # Prepare data for JavaScript
        opp_data = []
        for opp in opportunities:
            opp_data.append({
                'rank': opp.rank,
                'market_id': opp.market_id,
                'market_name': opp.market_name[:60] + '...' if len(opp.market_name) > 60 else opp.market_name,
                'source': opp.source.value,
                'score': round(opp.composite_score, 3),
                'expected_value': round(opp.expected_value * 100, 2),
                'confidence': round(opp.confidence * 100, 1),
                'risk_score': round(opp.risk_score, 2),
                'current_price': round(opp.current_price * 100, 1),
                'liquidity': round(opp.liquidity, 0),
                'hours_to_resolution': round(opp.hours_to_resolution, 1) if opp.hours_to_resolution else None,
                'suggested_side': opp.suggested_side.upper(),
                'explanation': opp.explanation
            })

        html = self._generate_opportunities_html(title, opp_data)

        # Save
        filename = f"opportunities_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.html"
        filepath = self.output_dir / filename

        with open(filepath, 'w') as f:
            f.write(html)

        return str(filepath)

    def _generate_opportunities_html(
        self,
        title: str,
        opportunities: List[Dict]
    ) -> str:
        """Generate HTML content for opportunities dashboard."""
        opportunities_json = json.dumps(opportunities)

        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #e0e0e0;
            padding: 20px;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }}
        .header h1 {{
            color: #00d4ff;
            margin-bottom: 10px;
        }}
        .header .timestamp {{
            color: #888;
            font-size: 14px;
        }}
        .disclaimer {{
            background: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 0 8px 8px 0;
        }}
        .stats-row {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }}
        .stat-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #00d4ff;
        }}
        .stat-card .label {{
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            margin-top: 5px;
        }}
        .filters {{
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }}
        .filters input, .filters select {{
            padding: 8px 12px;
            border: 1px solid #333;
            border-radius: 5px;
            background: #1a1a2e;
            color: #e0e0e0;
        }}
        .opportunity-card {{
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-bottom: 15px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .opportunity-card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }}
        .card-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: rgba(0, 212, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .rank {{
            font-size: 1.5em;
            font-weight: bold;
            color: #00d4ff;
        }}
        .score {{
            font-size: 1.2em;
            padding: 5px 15px;
            border-radius: 20px;
            background: rgba(0, 212, 255, 0.2);
        }}
        .card-body {{
            padding: 20px;
        }}
        .market-name {{
            font-size: 1.1em;
            margin-bottom: 15px;
            color: #fff;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }}
        .metric {{
            text-align: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }}
        .metric .value {{
            font-size: 1.2em;
            font-weight: bold;
        }}
        .metric .label {{
            font-size: 11px;
            color: #888;
            text-transform: uppercase;
        }}
        .metric.positive .value {{ color: #4caf50; }}
        .metric.negative .value {{ color: #f44336; }}
        .metric.neutral .value {{ color: #ffc107; }}
        .suggested-action {{
            display: inline-block;
            padding: 8px 20px;
            border-radius: 5px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .suggested-action.buy_yes {{ background: #4caf50; color: #fff; }}
        .suggested-action.buy_no {{ background: #f44336; color: #fff; }}
        .explanation {{
            margin-top: 15px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
            font-size: 13px;
            color: #aaa;
        }}
        .source-badge {{
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 3px;
            text-transform: uppercase;
        }}
        .source-badge.polymarket {{ background: #6366f1; }}
        .source-badge.kalshi {{ background: #ec4899; }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
            <div class="timestamp">Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</div>
        </div>

        <div class="disclaimer">
            <strong>RESEARCH ONLY:</strong> This dashboard is for informational purposes only.
            No automated trading is performed. All decisions must be made manually.
        </div>

        <div class="stats-row" id="stats">
            <!-- Populated by JavaScript -->
        </div>

        <div class="filters">
            <input type="text" id="search" placeholder="Search markets..." oninput="filterOpportunities()">
            <select id="sourceFilter" onchange="filterOpportunities()">
                <option value="">All Sources</option>
                <option value="polymarket">Polymarket</option>
                <option value="kalshi">Kalshi</option>
            </select>
            <select id="sortBy" onchange="sortOpportunities()">
                <option value="score">Sort by Score</option>
                <option value="expected_value">Sort by EV</option>
                <option value="confidence">Sort by Confidence</option>
                <option value="risk_score">Sort by Risk</option>
            </select>
        </div>

        <div id="opportunities">
            <!-- Populated by JavaScript -->
        </div>

        <div class="footer">
            Prediction Market Research Platform v1.0 | For Research Purposes Only
        </div>
    </div>

    <script>
        const opportunities = {opportunities_json};
        let filteredOpportunities = [...opportunities];

        function renderStats() {{
            const stats = document.getElementById('stats');
            const avgEV = opportunities.reduce((a, b) => a + b.expected_value, 0) / opportunities.length;
            const avgConf = opportunities.reduce((a, b) => a + b.confidence, 0) / opportunities.length;
            const topScore = Math.max(...opportunities.map(o => o.score));

            stats.innerHTML = `
                <div class="stat-card">
                    <div class="value">${{opportunities.length}}</div>
                    <div class="label">Opportunities</div>
                </div>
                <div class="stat-card">
                    <div class="value">${{topScore.toFixed(3)}}</div>
                    <div class="label">Top Score</div>
                </div>
                <div class="stat-card">
                    <div class="value">${{avgEV.toFixed(1)}}%</div>
                    <div class="label">Avg Expected Value</div>
                </div>
                <div class="stat-card">
                    <div class="value">${{avgConf.toFixed(0)}}%</div>
                    <div class="label">Avg Confidence</div>
                </div>
            `;
        }}

        function renderOpportunities() {{
            const container = document.getElementById('opportunities');
            container.innerHTML = filteredOpportunities.map(opp => `
                <div class="opportunity-card">
                    <div class="card-header">
                        <div>
                            <span class="rank">#${{opp.rank}}</span>
                            <span class="source-badge ${{opp.source}}">${{opp.source}}</span>
                        </div>
                        <div class="score">Score: ${{opp.score}}</div>
                    </div>
                    <div class="card-body">
                        <div class="market-name">${{opp.market_name}}</div>
                        <div class="metrics-grid">
                            <div class="metric ${{opp.expected_value > 0 ? 'positive' : 'negative'}}">
                                <div class="value">${{opp.expected_value > 0 ? '+' : ''}}${{opp.expected_value}}%</div>
                                <div class="label">Expected Value</div>
                            </div>
                            <div class="metric">
                                <div class="value">${{opp.confidence}}%</div>
                                <div class="label">Confidence</div>
                            </div>
                            <div class="metric">
                                <div class="value">${{opp.current_price}}%</div>
                                <div class="label">Current Price</div>
                            </div>
                            <div class="metric">
                                <div class="value">$${{opp.liquidity.toLocaleString()}}</div>
                                <div class="label">Liquidity</div>
                            </div>
                            <div class="metric ${{opp.risk_score < 0.4 ? 'positive' : opp.risk_score > 0.6 ? 'negative' : 'neutral'}}">
                                <div class="value">${{opp.risk_score}}</div>
                                <div class="label">Risk Score</div>
                            </div>
                            <div class="metric">
                                <div class="value">${{opp.hours_to_resolution ? opp.hours_to_resolution + 'h' : 'N/A'}}</div>
                                <div class="label">Time Left</div>
                            </div>
                        </div>
                        <span class="suggested-action ${{opp.suggested_side.toLowerCase()}}">${{opp.suggested_side}}</span>
                        <div class="explanation">${{opp.explanation}}</div>
                    </div>
                </div>
            `).join('');
        }}

        function filterOpportunities() {{
            const search = document.getElementById('search').value.toLowerCase();
            const source = document.getElementById('sourceFilter').value;

            filteredOpportunities = opportunities.filter(opp => {{
                const matchesSearch = opp.market_name.toLowerCase().includes(search);
                const matchesSource = !source || opp.source === source;
                return matchesSearch && matchesSource;
            }});

            renderOpportunities();
        }}

        function sortOpportunities() {{
            const sortBy = document.getElementById('sortBy').value;

            filteredOpportunities.sort((a, b) => {{
                if (sortBy === 'score') return b.score - a.score;
                if (sortBy === 'expected_value') return b.expected_value - a.expected_value;
                if (sortBy === 'confidence') return b.confidence - a.confidence;
                if (sortBy === 'risk_score') return a.risk_score - b.risk_score;
                return 0;
            }});

            renderOpportunities();
        }}

        // Initial render
        renderStats();
        renderOpportunities();
    </script>
</body>
</html>'''

    def generate_backtest_dashboard(
        self,
        results: List[BacktestResult],
        title: str = "Strategy Backtest Results"
    ) -> str:
        """
        Generate backtest results dashboard.

        Args:
            results: List of backtest results
            title: Dashboard title

        Returns:
            Path to generated HTML file
        """
        # Prepare data
        results_data = []
        for r in results:
            results_data.append({
                'strategy': r.strategy_name,
                'total_trades': r.total_trades,
                'win_rate': round(r.win_rate * 100, 1),
                'total_return': round(r.total_return * 100, 2),
                'annualized_return': round(r.annualized_return * 100, 2),
                'sharpe_ratio': round(r.sharpe_ratio, 2),
                'max_drawdown': round(r.max_drawdown * 100, 2),
                'profit_factor': round(r.profit_factor, 2),
                'brier_score': round(r.brier_score, 4),
                'calibration_error': round(r.calibration_error, 4),
                'equity_curve': [round(e, 2) for e in r.equity_curve[::max(1, len(r.equity_curve)//50)]]  # Downsample
            })

        html = self._generate_backtest_html(title, results_data)

        filename = f"backtest_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.html"
        filepath = self.output_dir / filename

        with open(filepath, 'w') as f:
            f.write(html)

        return str(filepath)

    def _generate_backtest_html(
        self,
        title: str,
        results: List[Dict]
    ) -> str:
        """Generate HTML for backtest dashboard."""
        results_json = json.dumps(results)

        return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #e0e0e0;
            padding: 20px;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }}
        .header h1 {{ color: #00d4ff; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
        }}
        th, td {{
            padding: 15px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }}
        th {{
            background: rgba(0, 212, 255, 0.2);
            color: #00d4ff;
            text-transform: uppercase;
            font-size: 12px;
        }}
        tr:hover {{ background: rgba(255, 255, 255, 0.05); }}
        .positive {{ color: #4caf50; }}
        .negative {{ color: #f44336; }}
        .chart-container {{
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }}
        canvas {{ max-width: 100%; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
            <p>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Strategy</th>
                    <th>Trades</th>
                    <th>Win Rate</th>
                    <th>Total Return</th>
                    <th>Sharpe</th>
                    <th>Max DD</th>
                    <th>Profit Factor</th>
                    <th>Brier Score</th>
                </tr>
            </thead>
            <tbody id="results-table">
            </tbody>
        </table>

        <div class="chart-container">
            <h3>Equity Curves</h3>
            <canvas id="equityChart" height="300"></canvas>
        </div>
    </div>

    <script>
        const results = {results_json};

        // Render table
        const tbody = document.getElementById('results-table');
        tbody.innerHTML = results.map(r => `
            <tr>
                <td><strong>${{r.strategy}}</strong></td>
                <td>${{r.total_trades}}</td>
                <td class="${{r.win_rate >= 50 ? 'positive' : 'negative'}}">${{r.win_rate}}%</td>
                <td class="${{r.total_return >= 0 ? 'positive' : 'negative'}}">${{r.total_return >= 0 ? '+' : ''}}${{r.total_return}}%</td>
                <td class="${{r.sharpe_ratio >= 1 ? 'positive' : r.sharpe_ratio < 0 ? 'negative' : ''}}">${{r.sharpe_ratio}}</td>
                <td class="negative">-${{r.max_drawdown}}%</td>
                <td class="${{r.profit_factor >= 1.5 ? 'positive' : 'negative'}}">${{r.profit_factor}}</td>
                <td>${{r.brier_score}}</td>
            </tr>
        `).join('');

        // Simple equity curve visualization
        const canvas = document.getElementById('equityChart');
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.clientWidth - 40;
        const height = 300;

        const colors = ['#00d4ff', '#4caf50', '#ffc107', '#f44336', '#9c27b0'];

        results.forEach((r, idx) => {{
            const curve = r.equity_curve;
            const maxVal = Math.max(...results.flatMap(r => r.equity_curve));
            const minVal = Math.min(...results.flatMap(r => r.equity_curve));
            const range = maxVal - minVal || 1;

            ctx.strokeStyle = colors[idx % colors.length];
            ctx.lineWidth = 2;
            ctx.beginPath();

            curve.forEach((val, i) => {{
                const x = (i / (curve.length - 1)) * width;
                const y = height - ((val - minVal) / range) * (height - 40) - 20;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }});

            ctx.stroke();
        }});

        // Legend
        ctx.font = '12px sans-serif';
        results.forEach((r, idx) => {{
            ctx.fillStyle = colors[idx % colors.length];
            ctx.fillRect(10 + idx * 150, 10, 20, 10);
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText(r.strategy, 35 + idx * 150, 18);
        }});
    </script>
</body>
</html>'''


def generate_dashboard(
    opportunities: List[Opportunity],
    output_dir: Optional[str] = None
) -> str:
    """
    Convenience function to generate opportunities dashboard.

    Args:
        opportunities: List of opportunities
        output_dir: Output directory

    Returns:
        Path to generated dashboard
    """
    generator = DashboardGenerator(output_dir)
    return generator.generate_opportunities_dashboard(opportunities)
