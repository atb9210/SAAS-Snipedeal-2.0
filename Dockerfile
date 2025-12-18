# Dockerfile - SnipeDeal 2.0 PWA
# Multi-stage build per Next.js con Playwright
# Ottimizzato per Dokploy Production
# Timestamp: 2024-12-09

# ============================================
# BASE STAGE - Dipendenze sistema
# ============================================
FROM node:20-slim AS base

# Installa dipendenze sistema per Playwright e Prisma
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
    libappindicator3-1 \
    libu2f-udev \
    libvulkan1 \
    xdg-utils \
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

# Copia dipendenze
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera Prisma client
# Prisma generate non richiede connessione al DB, solo lo schema
RUN npx prisma generate

# Build Next.js (standalone)
# NOTA: Durante il build Docker, il database non è ancora disponibile
# Il DATABASE_URL dummy serve SOLO per evitare errori durante il build
# A runtime, Dokploy passerà il VERO DATABASE_URL dalle variabili ambiente configurate
ENV NEXT_TELEMETRY_DISABLED=1
# Usa DATABASE_URL dummy durante build (non viene usato, serve solo per evitare errori)
# Questo viene sovrascritto a runtime dalle env vars di Dokploy
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN npm run build

# ============================================
# RUNNER STAGE - Produzione
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crea utente non-root per sicurezza
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia file pubblici
COPY --from=builder /app/public ./public

# Imposta permessi per cartella .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia Prisma schema e client generato
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Copia TUTTA la directory Prisma CLI (incluso WASM e altri file necessari)
# Prisma CLI richiede diversi file binari e dipendenze
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
# Copia anche le dipendenze necessarie per Prisma CLI (engines contiene i file WASM)
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
# Copia bcryptjs per il seed
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/@types/bcryptjs ./node_modules/@types/bcryptjs
# Assicurati che tutti i file binari Prisma siano leggibili
RUN chmod -R +r ./node_modules/prisma 2>/dev/null || true
RUN chmod +x ./node_modules/.bin/prisma 2>/dev/null || true

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Disabilitato entrypoint automatico perché Prisma CLI richiede troppe dipendenze
# Le migrazioni vanno fatte manualmente una volta:
# 1. Vai nel terminale dell'app come root: su root
# 2. cd /app
# 3. npx prisma db push --schema=./prisma/schema.prisma
# 4. npx prisma db seed --schema=./prisma/schema.prisma

# Avvia direttamente Next.js
CMD ["node", "server.js"]
