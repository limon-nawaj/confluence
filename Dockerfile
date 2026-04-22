# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

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

# Heroku dynamically assigns PORT; default to 8501 for non-Heroku (ShinyProxy)
ENV PORT=8080

EXPOSE $PORT

# Run migrations then start the server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 0
