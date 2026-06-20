FROM node:20-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY server.js co2_calculator.js ./

# Cloud Run injects PORT env var automatically
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
