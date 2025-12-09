# Dockerfile - SnipeDeal 2.0 PWA
# Multi-stage build per Next.js con Playwright
# MIGRAZIONI AUTOMATICHE all'avvio!
# Timestamp: 2024-12-09

# ============================================
# BASE STAGE - Dipendenze sistema
# ============================================
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
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
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================
# DEPS STAGE - Installazione dipendenze
# ============================================
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# BUILDER STAGE - Build produzione
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

# Disabilita telemetria e imposta DATABASE_URL dummy per build
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
ENV SKIP_ENV_VALIDATION=1

RUN npm run build

# ============================================
# RUNNER STAGE - Produzione
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia file pubblici
COPY --from=builder /app/public ./public

# Crea cartella .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia Prisma per migrazioni automatiche
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copia entrypoint per migrazioni automatiche
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Installa Playwright
RUN npx playwright install chromium --with-deps

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Entrypoint esegue migrazioni poi avvia l'app
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
