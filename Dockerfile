# Étape 1 : build du frontend Next.js
FROM node:20 AS frontend-builder
WORKDIR /app
COPY app ./app
WORKDIR /app/app
RUN npm install && npm run build && npm run export

# Étape 2 : build final avec FastAPI et frontend exporté
FROM python:3.11-slim
WORKDIR /app

# Install FastAPI dependencies
COPY backend/ ./backend
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copie du frontend static exporté
COPY --from=frontend-builder /app/app/out ./frontend

# Expose the required port for HF Spaces (default: 7860)
ENV PORT=7860
EXPOSE $PORT

# Lancer FastAPI via uvicorn (avec static hosting intégré)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]