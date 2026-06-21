# syntax=docker/dockerfile:1

# --- Build the Vite SPA ---
FROM node:22-alpine AS build
WORKDIR /app

# Enable pnpm via corepack (frontend uses a pnpm lockfile).
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# VITE_API_URL is baked into the bundle at build time.
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# --- Serve the static build with nginx ---
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
