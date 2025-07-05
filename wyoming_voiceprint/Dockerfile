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

# Copy the voiceprint package first
COPY ../voiceprint /app/voiceprint

# Install the voiceprint package with CPU dependencies
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu --no-cache-dir -e ./voiceprint[cpu]

# Copy wyoming_voiceprint requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the wyoming_voiceprint application code
COPY . .

# Set permissions for the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the default Wyoming protocol port
EXPOSE 10700

# Command to run the Wyoming voiceprint service
CMD ["python", "-m", "wyoming_voiceprint"]
