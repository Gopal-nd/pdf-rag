


    # 1. Bun base
FROM oven/bun:1

# 2. Work inside /app
WORKDIR /app

# 3. Copy only what’s needed to install
COPY package.json bun.lock tsconfig.json ./

# 4. Install deps
RUN bun install

# 5. Copy all server code (controllers/, routes/, index.ts, etc.)
COPY . .

RUN bunx prisma generate


# 6. Expose your backend API port
EXPOSE 5000

# 7. Run your TS entrypoint directly
CMD ["bun", "index.ts"]
