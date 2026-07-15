# --- Estágio 1: Build do Frontend React ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Estágio 2: Configuração do Backend e Servidor de Produção ---
FROM node:22-alpine AS backend-runner
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --only=production
COPY backend/ ./

# Copiar os arquivos compilados do frontend para a pasta pública do backend
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
