FROM python:3.12-slim AS builder

WORKDIR /build

# Build wheels in an isolated stage so the runtime image stays smaller.
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim

# Install runtime PostgreSQL client lib
RUN apt-get update && apt-get install -y libpq5 curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash vulnalyze
WORKDIR /code

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

# Copy application code
COPY app/ ./app/
COPY setup_db.py .
COPY alembic/ ./alembic/
COPY alembic.ini .

# Create data directory for SQLite fallback (local dev only)
RUN mkdir -p data && chown -R vulnalyze:vulnalyze /code

# Switch to non-root user
USER vulnalyze

EXPOSE 8000

# Startup: run DB setup (creates tables + seed data) then launch uvicorn
CMD python setup_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
