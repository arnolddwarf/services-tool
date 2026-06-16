FROM node:20-slim

# Install dependencies required to compile native sqlite3 bindings on arm64/alpine/slim images
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.js"]
