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

# DEBUG: Mostra info connessione (senza password)
DB_INFO=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "🔍 Database info: $DB_INFO"

# Attendi un po' per dare tempo al database di essere pronto
echo "⏳ Waiting 10 seconds for database to be ready..."
sleep 10

# Esegui migrazioni Prisma (con retry)
echo "📦 Running database migrations..."
RETRY_COUNT=0
MAX_RETRIES=3
MIGRATION_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "   Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES..."
  if ./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1; then
    echo "✅ Database migrations successful"
    MIGRATION_SUCCESS=true
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⚠️  Migration failed, retrying in 5 seconds..."
      sleep 5
    else
      echo "⚠️  Migration failed after $MAX_RETRIES attempts"
      echo "   Continuing anyway - app will start but database might not be ready"
    fi
  fi
done

# Esegui seed solo se le migrazioni sono andate a buon fine
if [ "$MIGRATION_SUCCESS" = "true" ]; then
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
