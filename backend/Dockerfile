FROM python:3.13-slim

WORKDIR /app

# Copy requirement files first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
# Default port for Google Cloud Run is 8080
ENV PORT=8080

# Command to run the application using uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
