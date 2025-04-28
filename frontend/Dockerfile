# 1. Base image: Bun (super light, TS-native)
FROM oven/bun:1

# 2. Set working directory
WORKDIR /app

# 3. Copy only the manifest and core config so layer caching works
COPY package.json bun.lock tsconfig.json next.config.ts  ./

# 4. Install dependencies
RUN bun install

# 5. Copy your entire frontend source
COPY . .

# 6. Build your Next.js app
RUN bun run build

# 7. Expose the port your app will run on
EXPOSE 3000

# 8. Launch your production server
CMD ["bun", "run", "start"]
