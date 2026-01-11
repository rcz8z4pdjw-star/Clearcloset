# Prediction Market Research Platform - API Documentation

## Overview

The platform provides a RESTful API for accessing market data, signals, opportunities, and portfolio analytics.

**Base URL:** `http://localhost:5000`

---

## Authentication

API authentication is optional and disabled by default. When enabled, provide your API key via:

- **Header:** `X-API-Key: your-api-key`
- **Header:** `Authorization: Bearer your-api-key`
- **Query Parameter:** `?api_key=your-api-key`

To enable authentication, set these environment variables:
```bash
API_KEY_ENABLED=true
API_KEY=your-secret-api-key
```

---

## Rate Limiting

- Default: 60 requests per minute per IP
- Stats endpoint: 120 requests per minute
- Refresh endpoint: 10 requests per minute (requires auth)

Rate limit headers:
- `X-RateLimit-Remaining`: Requests remaining in current window

---

## Endpoints

### Dashboard

#### GET /api/dashboard
Get dashboard summary data.

**Response:**
```json
{
  "last_refresh": "2024-01-15T10:30:00+00:00",
  "opportunities_count": 42,
  "signals_count": 156,
  "has_social": true,
  "has_news": true
}
```

---

### Opportunities

#### GET /api/opportunities
Get ranked trading opportunities.

**Response:**
```json
[
  {
    "rank": 1,
    "market_id": "0x123...",
    "market_name": "Will X happen by Y date?",
    "score": 0.847,
    "ev": 12.5,
    "confidence": 78,
    "side": "YES",
    "price": 45.0,
    "liquidity": 25000,
    "factors": ["late_resolution", "favorable_spread"]
  }
]
```

---

### Signals

#### GET /api/signals
Get recent trading signals from all strategies.

**Response:**
```json
[
  {
    "strategy": "late_resolution_inefficiency",
    "market_id": "0x123...",
    "direction": "BUY",
    "strength": 0.85,
    "confidence": 0.72,
    "ev": 8.5,
    "timestamp": "2024-01-15T10:25:00+00:00"
  }
]
```

---

### Social Sentiment

#### GET /api/social
Get social media sentiment data.

**Response:**
```json
{
  "summary": {
    "total_posts": 1250,
    "avg_sentiment": 0.15,
    "trending_topics": 5
  },
  "trending": [
    {
      "topic": "polymarket",
      "posts": 342,
      "sentiment": 0.25,
      "trending": true,
      "volume_change": 45.2
    }
  ]
}
```

---

### News

#### GET /api/news
Get news and events data.

**Response:**
```json
{
  "breaking": [
    {
      "title": "Major political event announced",
      "source": "Reuters",
      "timestamp": "2024-01-15T09:00:00+00:00",
      "relevance": 0.95
    }
  ],
  "events": [
    {
      "name": "Federal Reserve Meeting",
      "date": "2024-01-20",
      "impact": "high"
    }
  ],
  "category_counts": {
    "politics": 45,
    "economics": 32,
    "crypto": 18
  }
}
```

---

### Statistics

#### GET /api/stats
Get platform statistics and health.

**Response:**
```json
{
  "total_opportunities": 42,
  "total_signals": 156,
  "markets_tracked": 234,
  "last_refresh": "2024-01-15T10:30:00+00:00",
  "uptime_hours": 48.5,
  "uptime_seconds": 174600
}
```

---

### Performance

#### GET /api/performance
Get performance tracking data.

**Response:**
```json
{
  "overall": {
    "total_return": 0.156,
    "sharpe_ratio": 1.45,
    "max_drawdown": -0.082,
    "win_rate": 0.62
  },
  "strategies": {
    "late_resolution": {
      "return": 0.089,
      "trades": 45,
      "win_rate": 0.67
    }
  }
}
```

#### GET /api/performance/strategy/{strategy_name}
Get performance for a specific strategy.

**Parameters:**
- `strategy_name` (path): Name of the strategy

**Response:**
```json
{
  "name": "late_resolution_inefficiency",
  "total_return": 0.089,
  "trades": 45,
  "win_rate": 0.67,
  "avg_return_per_trade": 0.002,
  "sharpe_ratio": 1.82
}
```

---

### Portfolio

#### GET /api/portfolio
Get portfolio state and positions.

**Response:**
```json
{
  "total_value": 12500.00,
  "cash": 8000.00,
  "positions_value": 4500.00,
  "positions": [
    {
      "market_id": "0x123...",
      "side": "YES",
      "size": 100,
      "entry_price": 0.45,
      "current_price": 0.52,
      "pnl": 70.00
    }
  ]
}
```

#### POST /api/portfolio/position-size
Calculate optimal position size.

**Request Body:**
```json
{
  "estimated_prob": 0.65,
  "market_price": 0.50,
  "market_id": "optional-market-id",
  "category": "optional-category"
}
```

**Validation:**
- `estimated_prob`: Required, float 0.0-1.0
- `market_price`: Required, float 0.0-1.0
- `market_id`: Optional, string
- `category`: Optional, string

**Response:**
```json
{
  "recommended_size": 250.00,
  "kelly_fraction": 0.15,
  "max_size": 1000.00,
  "risk_adjusted_size": 250.00
}
```

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": ["'estimated_prob' must be >= 0.0"]
}
```

---

### Kelly Calculator

#### POST /api/kelly
Calculate Kelly criterion bet size.

**Request Body:**
```json
{
  "win_prob": 0.60,
  "odds": 2.0,
  "bankroll": 10000,
  "kelly_fraction": 0.25,
  "market_price": 0.50
}
```

**Validation:**
- `win_prob`: Required, float 0.0-1.0
- `odds`: Optional, float >= 1.0, default 2.0
- `bankroll`: Optional, float >= 0, default 10000
- `kelly_fraction`: Optional, float 0.0-1.0, default 0.25
- `market_price`: Optional, float 0.0-1.0

**Response:**
```json
{
  "full_kelly": 0.20,
  "adjusted_kelly": 0.05,
  "bet_amount": 500.00,
  "suggested_side": "YES",
  "edge": 0.20
}
```

---

### Data Refresh

#### POST /api/refresh
Trigger manual data refresh. Requires authentication when API_KEY_ENABLED=true.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:35:00+00:00"
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["'win_prob' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "API key required",
  "message": "Provide API key via X-API-Key header, Authorization: Bearer <key>, or api_key query parameter"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute allowed",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Calculation failed",
  "message": "Detailed error message"
}
```

### 503 Service Unavailable
```json
{
  "error": "Portfolio optimizer not initialized"
}
```

---

## CORS

Cross-Origin Resource Sharing is enabled. Configure allowed origins with:
```bash
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

Use `*` to allow all origins (not recommended for production).

---

## Security Headers

All responses include security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: ...`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Examples

### cURL

```bash
# Get dashboard data
curl http://localhost:5000/api/dashboard

# Get opportunities
curl http://localhost:5000/api/opportunities

# Calculate Kelly bet size
curl -X POST http://localhost:5000/api/kelly \
  -H "Content-Type: application/json" \
  -d '{"win_prob": 0.6, "bankroll": 10000}'

# With API key authentication
curl http://localhost:5000/api/refresh \
  -X POST \
  -H "X-API-Key: your-api-key"
```

### Python

```python
import requests

BASE_URL = "http://localhost:5000"

# Get opportunities
response = requests.get(f"{BASE_URL}/api/opportunities")
opportunities = response.json()

# Calculate position size
response = requests.post(
    f"{BASE_URL}/api/portfolio/position-size",
    json={
        "estimated_prob": 0.65,
        "market_price": 0.50
    }
)
sizing = response.json()
print(f"Recommended size: ${sizing['recommended_size']}")
```

### JavaScript

```javascript
// Get signals
const response = await fetch('http://localhost:5000/api/signals');
const signals = await response.json();

// Calculate Kelly
const kellyResponse = await fetch('http://localhost:5000/api/kelly', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    win_prob: 0.6,
    bankroll: 10000
  })
});
const kelly = await kellyResponse.json();
console.log(`Bet amount: $${kelly.bet_amount}`);
```
