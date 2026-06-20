FROM oven/bun:1.2

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3001

CMD ["bun", "src/index.ts"]
