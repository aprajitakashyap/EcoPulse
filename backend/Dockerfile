FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js co2_calculator.js ./

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
