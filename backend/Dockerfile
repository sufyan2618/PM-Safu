# syntax=docker/dockerfile:1

FROM oven/bun:1.2 AS base
WORKDIR /app

# --- Dependencies (cached layer) ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Runtime image ---
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persisted uploads (logos, avatars, generated PDFs).
RUN mkdir -p /app/uploads && chown -R bun:bun /app

USER bun

EXPOSE 8000

# Default command runs the API server. The worker service overrides this
# with `bun src/workers/index.ts` in docker-compose.
CMD ["bun", "src/index.ts"]
