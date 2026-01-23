# Prediction Market Research Platform - Deployment Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Security Checklist](#security-checklist)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone and setup
cd prediction_market_platform
cp .env.example .env

# Edit .env with your configuration
nano .env

# Option 1: Run directly
pip install -r requirements.txt
python cli.py dashboard

# Option 2: Run with Docker
docker-compose up
```

---

## Prerequisites

### System Requirements
- Python 3.9+ (3.11 recommended)
- 2GB RAM minimum (4GB recommended)
- 10GB disk space for data storage
- Network access to Polymarket and Kalshi APIs

### Python Dependencies
```bash
pip install -r requirements.txt
```

### Optional: API Keys
- Twitter API v2 Bearer Token (for social sentiment)
- Reddit API credentials (for social sentiment)
- Kalshi API credentials (for authenticated access)

---

## Local Development

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with minimum required settings:
```bash
FLASK_SECRET_KEY=your-random-secret-key-here
DATABASE_PATH=data/prediction_markets.db
LOG_LEVEL=DEBUG
```

### 3. Run Development Server

```bash
# Web dashboard with debug mode
python cli.py dashboard --debug

# Or run live data collection
python cli.py live --once

# Check status
python cli.py status
```

### 4. Run Tests

```bash
# All tests
python -m pytest tests/ -v

# With coverage
python -m pytest tests/ -v --cov=. --cov-report=html
```

---

## Docker Deployment

### Development Mode

```bash
# Build and run development container
docker-compose --profile dev up

# This mounts your code for live reloading
```

### Production Mode

```bash
# Build production image
docker-compose build web

# Run production stack
docker-compose up -d

# View logs
docker-compose logs -f web

# Include data collector
docker-compose --profile full up -d
```

### Run Tests in Docker

```bash
docker-compose --profile test run --rm test
```

---

## Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not using native Python)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone <repository-url> prediction_market_platform
sudo chown -R $USER:$USER prediction_market_platform
cd prediction_market_platform
```

### 3. Configure Production Environment

```bash
cp .env.example .env.production

# Edit with secure values
nano .env.production
```

**Critical settings for production:**
```bash
# Generate secure secret key
FLASK_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Enable API authentication
API_KEY_ENABLED=true
API_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Restrict CORS
CORS_ORIGINS=https://yourdomain.com

# Production logging
LOG_LEVEL=INFO
FLASK_DEBUG=false
```

### 4. Deploy with Docker

```bash
# Use production environment
export COMPOSE_FILE=docker-compose.yml

# Build and start
docker-compose --env-file .env.production up -d

# Verify
docker-compose ps
curl http://localhost:5000/api/stats
```

### 5. Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/pm-research
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 7. Setup Systemd Service (Non-Docker)

```ini
# /etc/systemd/system/pm-research.service
[Unit]
Description=Prediction Market Research Platform
After=network.target

[Service]
Type=simple
User=pmresearch
WorkingDirectory=/opt/prediction_market_platform
Environment=PYTHONPATH=/opt/prediction_market_platform
EnvironmentFile=/opt/prediction_market_platform/.env.production
ExecStart=/opt/prediction_market_platform/venv/bin/python cli.py dashboard --host 127.0.0.1 --port 5000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pm-research
sudo systemctl start pm-research
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_SECRET_KEY` | Session encryption key | Auto-generated |
| `FLASK_HOST` | Bind address | `0.0.0.0` |
| `FLASK_PORT` | Port number | `5000` |
| `FLASK_DEBUG` | Debug mode | `false` |
| `API_KEY` | API authentication key | - |
| `API_KEY_ENABLED` | Enable API auth | `false` |
| `CORS_ORIGINS` | Allowed origins | `*` |
| `DATABASE_PATH` | SQLite database path | `data/prediction_markets.db` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `LOG_FILE` | Log file path | `logs/platform.log` |

### Data Persistence

Data is stored in:
- `data/` - SQLite database
- `logs/` - Application logs
- `output/` - Reports and exports

For Docker, these are mounted as volumes:
- `pm-data` → `/app/data`
- `pm-logs` → `/app/logs`
- `pm-output` → `/app/output`

---

## Security Checklist

### Before Going Live

- [ ] Generate secure `FLASK_SECRET_KEY` (min 32 bytes)
- [ ] Enable `API_KEY_ENABLED=true` with strong key
- [ ] Set specific `CORS_ORIGINS` (no wildcards)
- [ ] Disable `FLASK_DEBUG`
- [ ] Setup HTTPS with valid certificate
- [ ] Configure firewall rules
- [ ] Review and restrict API access
- [ ] Setup log rotation
- [ ] Configure backup for database

### Network Security

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### File Permissions

```bash
chmod 600 .env.production
chmod 700 data/
chmod 755 logs/
```

---

## Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:5000/api/stats

# Docker health status
docker inspect --format='{{.State.Health.Status}}' pm-research-web
```

### Log Monitoring

```bash
# Docker logs
docker-compose logs -f web

# Native logs
tail -f logs/platform.log

# Filter errors
grep ERROR logs/platform.log
```

### Metrics to Monitor

1. **API Response Times** - Track /api/stats response time
2. **Error Rate** - Monitor 4xx/5xx responses
3. **Data Freshness** - Check `last_refresh` in /api/stats
4. **Uptime** - Monitor `uptime_seconds`
5. **Memory Usage** - Docker stats or system monitoring

### Alerting

Setup alerts for:
- Service downtime (health check fails)
- High error rate (>5% 5xx responses)
- Stale data (last_refresh > 30 minutes)
- Disk space < 20%

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000
# or
netstat -tulpn | grep 5000

# Kill process
kill -9 <PID>
```

#### Database Locked
```bash
# Check for stuck processes
fuser data/prediction_markets.db

# Remove stale locks (careful!)
rm data/prediction_markets.db-wal
rm data/prediction_markets.db-shm
```

#### Docker Issues
```bash
# Reset Docker state
docker-compose down -v
docker system prune -f
docker-compose up --build
```

#### Permission Denied
```bash
# Fix ownership
sudo chown -R $USER:$USER .
chmod -R 755 .
```

#### Import Errors
```bash
# Verify PYTHONPATH
export PYTHONPATH=$PWD
python -c "from engine.data_ingestion import get_database; print('OK')"
```

### Logs Location

| Component | Log File |
|-----------|----------|
| Web Dashboard | `logs/platform.log` |
| Data Collector | `logs/collector.log` |
| Docker | `docker-compose logs` |
| Nginx | `/var/log/nginx/access.log` |

### Getting Help

1. Check logs for error messages
2. Run `python cli.py status` for diagnostics
3. Run tests: `pytest tests/ -v`
4. Review GitHub issues

---

## Backup & Recovery

### Database Backup

```bash
# Manual backup
cp data/prediction_markets.db backups/pm_$(date +%Y%m%d).db

# Automated backup (crontab)
0 0 * * * cp /opt/prediction_market_platform/data/prediction_markets.db /backups/pm_$(date +\%Y\%m\%d).db
```

### Full Backup

```bash
# Stop services
docker-compose down

# Backup everything
tar -czvf pm_backup_$(date +%Y%m%d).tar.gz \
  data/ logs/ output/ .env.production

# Restart
docker-compose up -d
```

### Recovery

```bash
# Stop services
docker-compose down

# Restore backup
tar -xzvf pm_backup_YYYYMMDD.tar.gz

# Restart
docker-compose up -d
```

---

## Updates

### Updating the Platform

```bash
# Pull latest changes
git pull origin main

# Rebuild Docker images
docker-compose build --no-cache

# Restart with new images
docker-compose down
docker-compose up -d

# Verify
curl http://localhost:5000/api/stats
```

### Database Migrations

The platform includes a migration system. After updates:
```bash
python -c "from engine.migrations import run_migrations; run_migrations()"
```
