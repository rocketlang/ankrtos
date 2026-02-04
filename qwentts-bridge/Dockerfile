FROM python:3.10-slim

LABEL maintainer="ANKR Labs <capt.anil.sharma@powerpbox.org>"
LABEL description="QwenTTS Bridge Service for Bani and SunoSunao"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY integrations ./integrations

# Create directories
RUN mkdir -p /data/voices /data/models /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "main.py"]
