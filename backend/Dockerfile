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

# Default command (backend service only — worker overrides CMD in docker-compose):
#  1. Seed super admin   — idempotent (skips if already exists), non-fatal
#  2. Seed demo data     — idempotent (skips if demo company already exists), non-fatal
#  3. Start API server
CMD ["sh", "-c", "bun src/scripts/seedSuperAdmin.ts || true; bun src/scripts/seedDemo.ts || true; exec bun src/index.ts"]
