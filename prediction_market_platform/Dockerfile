# ==============================================================================
# Prediction Market Research Platform - Docker Configuration
# ==============================================================================
# Multi-stage build for optimized production image
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------------------------
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 2: Production
# ------------------------------------------------------------------------------
FROM python:3.11-slim as production

# Create non-root user for security
RUN groupadd -r pmresearch && useradd -r -g pmresearch pmresearch

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install dependencies from wheels
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/output && \
    chown -R pmresearch:pmresearch /app

# Switch to non-root user
USER pmresearch

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_HOST=0.0.0.0 \
    FLASK_PORT=5000 \
    LOG_LEVEL=INFO \
    DATABASE_PATH=/app/data/prediction_markets.db

# Expose port
EXPOSE 5000

# Health check using dedicated health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Default command: Run web dashboard
CMD ["python", "cli.py", "dashboard", "--host", "0.0.0.0", "--port", "5000"]

# ------------------------------------------------------------------------------
# Stage 3: Development
# ------------------------------------------------------------------------------
FROM production as development

USER root

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-asyncio \
    black \
    flake8 \
    mypy

USER pmresearch

# Override command for development
CMD ["python", "cli.py", "dashboard", "--host", "0.0.0.0", "--port", "5000", "--debug"]

# ------------------------------------------------------------------------------
# Stage 4: Testing
# ------------------------------------------------------------------------------
FROM development as testing

USER pmresearch

# Run tests by default
CMD ["python", "-m", "pytest", "tests/", "-v", "--cov=.", "--cov-report=term-missing"]
