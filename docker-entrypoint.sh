#!/bin/sh
set -e

echo "🚀 Starting SnipeDeal 2.0 PWA..."

# Verifica che DATABASE_URL sia configurato
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Attendi che il database sia pronto (max 60 secondi)
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
until ./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss > /dev/null 2>&1 || [ $counter -eq $timeout ]; do
  if [ $((counter % 5)) -eq 0 ]; then
    echo "   Attempting to connect to database... ($counter/$timeout)"
  fi
  sleep 1
  counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
  echo "⚠️  Warning: Could not connect to database after $timeout seconds"
  echo "   Continuing anyway - migrations will be retried on next startup"
else
  echo "✅ Database connection successful"
fi

# Esegui migrazioni Prisma
echo "📦 Running database migrations..."
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss || {
  echo "⚠️  Migration failed, but continuing..."
}

# Esegui seed (idempotente - può essere eseguito più volte)
echo "🌱 Seeding database..."
./node_modules/.bin/prisma db seed --schema=./prisma/schema.prisma || {
  echo "⚠️  Seed failed or already executed, continuing..."
}

# Avvia l'applicazione Next.js
echo "🎉 Starting Next.js application..."
exec node server.js
