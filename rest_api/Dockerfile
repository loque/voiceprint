FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 1000
RUN useradd -m -u 1000 appuser

# Set the working directory
WORKDIR /app

# Copy voiceprint requirements and install them
COPY voiceprint/pyproject.toml  /app/voiceprint/pyproject.toml
COPY voiceprint/pip.conf        /app/voiceprint/pip.conf
COPY voiceprint/__init__.py     /app/voiceprint/__init__.py

# Install the voiceprint package with CPU dependencies
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu --no-cache-dir -e ./voiceprint[cpu]

# Copy the voiceprint package code
COPY voiceprint /app/voiceprint

# Copy rest_api requirements and install them
COPY rest_api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest_api application code
COPY rest_api /app/rest_api
COPY utils /app/utils

# Set permissions for the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

EXPOSE 9797

CMD ["uvicorn", "rest_api.api:api", "--host", "0.0.0.0", "--port", "9797"]