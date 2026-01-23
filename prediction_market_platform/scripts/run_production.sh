#!/bin/bash
# =============================================================================
# Production Startup Script for Prediction Market Research Platform
# =============================================================================
#
# Usage:
#   ./scripts/run_production.sh              # Start with defaults
#   ./scripts/run_production.sh --port 8080  # Custom port
#   ./scripts/run_production.sh --workers 4  # Custom worker count
#
# Environment Variables:
#   FLASK_SECRET_KEY   - Required in production (auto-generated if missing)
#   FLASK_ENV          - Set to 'production' for production mode
#   PM_API_KEY         - API key for authenticated endpoints
#   PM_HOST            - Host to bind to (default: 0.0.0.0)
#   PM_PORT            - Port to listen on (default: 5000)
#   PM_WORKERS         - Number of gunicorn workers (default: 4)
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
HOST="${PM_HOST:-0.0.0.0}"
PORT="${PM_PORT:-5000}"
WORKERS="${PM_WORKERS:-4}"
MODE="${FLASK_ENV:-production}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            HOST="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --workers)
            WORKERS="$2"
            shift 2
            ;;
        --dev)
            MODE="development"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --host HOST       Host to bind to (default: 0.0.0.0)"
            echo "  --port PORT       Port to listen on (default: 5000)"
            echo "  --workers N       Number of gunicorn workers (default: 4)"
            echo "  --dev             Run in development mode"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║           PREDICTION MARKET RESEARCH PLATFORM - STARTUP                      ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Change to project directory
cd "$PROJECT_DIR"
echo -e "${GREEN}[*] Working directory: $PROJECT_DIR${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[!] Python 3 is required but not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}[*] Python version: $(python3 --version)${NC}"

# Check/create virtual environment
VENV_DIR="$PROJECT_DIR/venv"
if [ -d "$VENV_DIR" ]; then
    echo -e "${GREEN}[*] Using existing virtual environment${NC}"
    source "$VENV_DIR/bin/activate"
else
    echo -e "${YELLOW}[*] Creating virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    echo -e "${GREEN}[*] Virtual environment created${NC}"
fi

# Install/update dependencies
echo -e "${YELLOW}[*] Installing dependencies...${NC}"
pip install -q -r requirements.txt

# Check for gunicorn in production mode
if [ "$MODE" = "production" ]; then
    if ! pip show gunicorn &> /dev/null; then
        echo -e "${YELLOW}[*] Installing gunicorn for production...${NC}"
        pip install -q gunicorn
    fi
fi

# Generate secret key if not set
if [ -z "$FLASK_SECRET_KEY" ]; then
    if [ "$MODE" = "production" ]; then
        echo -e "${YELLOW}[!] FLASK_SECRET_KEY not set, generating one...${NC}"
        export FLASK_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
        echo -e "${YELLOW}[!] Consider setting FLASK_SECRET_KEY in your environment for persistence${NC}"
    else
        echo -e "${YELLOW}[*] Development mode: Using temporary secret key${NC}"
    fi
fi

# Set Flask environment
export FLASK_ENV="$MODE"

# Pre-flight checks
echo -e "${YELLOW}[*] Running pre-flight checks...${NC}"

# Check database
python3 -c "
from engine.data_ingestion import get_database
db = get_database()
print('[*] Database connection: OK')
" 2>/dev/null || echo -e "${YELLOW}[!] Database check skipped (will initialize on first run)${NC}"

# Create necessary directories
mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}[*] Data directories ready${NC}"

# Run tests in development mode
if [ "$MODE" = "development" ]; then
    echo -e "${YELLOW}[*] Running quick test suite...${NC}"
    python3 -m pytest tests/ -q --tb=no -x 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}[*] Starting server in ${MODE} mode...${NC}"
echo -e "${GREEN}[*] Host: ${HOST}${NC}"
echo -e "${GREEN}[*] Port: ${PORT}${NC}"

if [ "$MODE" = "production" ]; then
    echo -e "${GREEN}[*] Workers: ${WORKERS}${NC}"
    echo ""

    # Run with gunicorn in production
    exec gunicorn \
        --bind "${HOST}:${PORT}" \
        --workers "$WORKERS" \
        --threads 2 \
        --timeout 120 \
        --keep-alive 5 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --access-logfile "$PROJECT_DIR/logs/access.log" \
        --error-logfile "$PROJECT_DIR/logs/error.log" \
        --capture-output \
        --enable-stdio-inheritance \
        --graceful-timeout 30 \
        "web.app:app"
else
    # Run Flask development server
    exec python3 -m web.app --host "$HOST" --port "$PORT" --debug
fi
