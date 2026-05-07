#!/bin/sh
# Entrypoint dell'app Next.js: sincronizza schema Prisma poi avvia il server.
# Eseguito ad ogni start del container. `db push` è idempotente: se lo schema
# è già allineato non cambia nulla.
set -e

echo "[entrypoint] Syncing Prisma schema (db push)..."
./node_modules/.bin/prisma db push \
  --schema=./prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss

echo "[entrypoint] Starting Next.js server..."
exec node server.js
