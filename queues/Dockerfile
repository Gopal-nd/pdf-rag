# 1. Bun base
FROM oven/bun:1

# 2. Switch to /app
WORKDIR /app

# 3. Copy manifest + config
COPY package.json bun.lock tsconfig.json ./

# 4. Install dependencies
RUN bun install

# 5. Copy your worker code
COPY . .

# 6. No port exposed—this is a background worker
CMD ["bun", "index.ts"]
