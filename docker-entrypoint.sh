#!/bin/sh
set -e

echo "🚀 Starting SnipeDeal 2.0 PWA..."

# Verifica che DATABASE_URL sia configurato e NON sia il dummy
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "   Please configure DATABASE_URL in Dokploy environment variables"
  exit 1
fi

# Verifica che non sia il DATABASE_URL dummy
if echo "$DATABASE_URL" | grep -q "dummy\|localhost:3306/dummy"; then
  echo "❌ ERROR: DATABASE_URL appears to be dummy value"
  echo "   Current value: ${DATABASE_URL%%@*}@***"
  echo "   Please configure REAL DATABASE_URL in Dokploy environment variables"
  echo "   Format: mysql://user:pass@mysql-service-name:3306/dbname"
  exit 1
fi

echo "✅ DATABASE_URL configured: ${DATABASE_URL%%@*}@***"

# Attendi un po' per dare tempo al database di essere pronto
echo "⏳ Waiting 15 seconds for database to be ready..."
sleep 15

# Esegui migrazioni Prisma (con retry)
echo "📦 Running database migrations..."
RETRY_COUNT=0
MAX_RETRIES=5
MIGRATION_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if ./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1; then
    echo "✅ Database migrations successful"
    MIGRATION_SUCCESS=true
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⚠️  Migration failed, retrying in 5 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
      sleep 5
    else
      echo "⚠️  Migration failed after $MAX_RETRIES attempts"
      echo "   This might be normal if database is already migrated"
    fi
  fi
done

# Esegui seed solo se le migrazioni sono andate a buon fine
if [ "$MIGRATION_SUCCESS" = "true" ] || [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
  echo "🌱 Seeding database..."
  ./node_modules/.bin/prisma db seed --schema=./prisma/schema.prisma || {
    echo "⚠️  Seed failed or already executed, continuing..."
  }
else
  echo "⏭️  Skipping seed (migrations not successful)"
fi

# Avvia l'applicazione Next.js
echo "🎉 Starting Next.js application..."
exec node server.js
