#!/bin/sh
# Entrypoint dell'app Next.js: sincronizza schema Prisma poi avvia il server.
# Eseguito ad ogni start del container. `db push` è idempotente: se lo schema
# è già allineato non cambia nulla.
set -e

echo "[entrypoint] Syncing Prisma schema (db push)..."
# Invochiamo l'entry JS reale del pacchetto, non il symlink in .bin/.
# Docker dereferenzia i symlink durante la COPY: usare .bin/prisma rompe i
# percorsi relativi che il CLI usa per caricare i WASM (__dirname sbagliato).
node ./node_modules/prisma/build/index.js db push \
  --schema=./prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss

echo "[entrypoint] Seeding (idempotente: piani + utenti demo)..."
# Il seed e` idempotente (upsert su email, skipDuplicates sui piani):
# rilanciarlo a ogni boot non duplica nulla. Non blocchiamo l'avvio se fallisce.
node ./prisma/seed.js || echo "[entrypoint] Seed skipped (errore non fatale)"

echo "[entrypoint] Starting Next.js server..."
exec node server.js
