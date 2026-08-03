FROM python:3.12-slim

WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY setup_db.py .

# Create data directory for SQLite fallback
RUN mkdir -p backend/data

# Expose the backend port
EXPOSE 8000

# Startup: run DB setup (creates tables + seed data) then launch uvicorn
CMD python setup_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
