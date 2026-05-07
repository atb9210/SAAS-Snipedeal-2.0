# Dockerfile - SnipeDeal 2.0 Next.js app
# Production image for Dokploy.
# Playwright NON è qui: gli scraper dell'app usano HTTP, il browser vive solo
# nel worker (vedi Dockerfile.worker).

# ============================================
# BASE - dipendenze sistema minime
# ============================================
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ============================================
# DEPS - install di tutti i node_modules (incl. dev per il build)
# ============================================
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# BUILDER - genera Prisma client + build Next.js standalone
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL dummy SOLO per la fase di build: Next.js può importare
# moduli che riferiscono Prisma a build-time. La URL reale arriva da Dokploy
# a runtime e sovrascrive questa.
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

RUN npx prisma generate
RUN npm run build

# ============================================
# RUNNER - immagine finale di produzione
# ============================================
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utente non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Asset statici + build standalone Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema, client generato, e CLI per `prisma db push` a runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Entrypoint
COPY --chown=nextjs:nodejs docker/app-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh"]
