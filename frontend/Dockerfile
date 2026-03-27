# Stage 1: Install dependencies
FROM oven/bun:1.3-slim AS deps

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1.3-slim AS builder

WORKDIR /app

# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_HOST

# Set as environment variables for the build
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_HOST=$NEXT_PUBLIC_WS_HOST

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js standalone
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
