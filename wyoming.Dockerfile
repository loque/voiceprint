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

# Copy wyoming_voiceprint requirements and install them
COPY wyoming_voiceprint/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the wyoming_voiceprint application code
COPY wyoming_voiceprint /app/wyoming_voiceprint
COPY utils /app/utils

# Set permissions for the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the default Wyoming protocol port
EXPOSE 13040

# Command to run the Wyoming voiceprint service
CMD ["python", "-m", "wyoming_voiceprint"]
