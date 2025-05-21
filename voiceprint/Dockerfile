# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VOICES_PATH=/app/voices
ENV MODELS_PATH=/app/models

# Create a non-root user with UID 1000
RUN useradd -m -u 1000 appuser

# Set the working directory
WORKDIR /app

# Install library dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install http server dependencies
COPY http_server/requirements.txt /app/http_server/
RUN pip install --no-cache-dir -r /app/http_server/requirements.txt

# Copy the application code
COPY . /app/

# Set permissions for the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["python", "-m", "http_server"]
