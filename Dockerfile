FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --only=production
COPY backend/ ./
EXPOSE 5000
ENV NODE_ENV=production PORT=5000
CMD ["node", "src/index.js"]
