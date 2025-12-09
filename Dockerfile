# Dockerfile - SnipeDeal 2.0 PWA
# Multi-stage build per Next.js con Playwright
# Timestamp: 2024-12-09

FROM node:20-slim AS base

# Installa dipendenze sistema per Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage per dipendenze
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Stage per development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Installa browser Playwright
RUN npx playwright install chromium

# Genera Prisma client
RUN npx prisma generate

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "dev"]

# Stage per build produzione
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Stage per produzione
FROM base AS production
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Installa Playwright per produzione
RUN npx playwright install chromium

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]


