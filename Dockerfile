# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build
# Output: /app/frontend/dist

# ── Stage 2: Python backend + built frontend ──────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy built React app into backend/app/static so FastAPI can serve it
COPY --from=frontend-build /app/frontend/dist ./app/static

# Persistent storage for the SQLite database and uploads should be
# provided via a Docker volume mounted at /app/app/data in production.
# The database path and upload dir can be overridden with env vars.

EXPOSE 8501

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8501", "--timeout-keep-alive", "0"]
