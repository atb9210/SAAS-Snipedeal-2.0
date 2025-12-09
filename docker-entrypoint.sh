#!/bin/sh
# docker-entrypoint.sh - Entrypoint per SnipeDeal PWA
# Migrazioni automatiche all'avvio

set -e

echo "🚀 SnipeDeal PWA - Avvio..."

# Attendi che MySQL sia pronto
echo "⏳ Attendo MySQL..."
MAX_TRIES=30
TRIES=0

while [ $TRIES -lt $MAX_TRIES ]; do
    if npx prisma db push --skip-generate 2>/dev/null; then
        echo "✅ Database sincronizzato!"
        break
    fi
    TRIES=$((TRIES + 1))
    echo "   MySQL non pronto, retry $TRIES/$MAX_TRIES..."
    sleep 2
done

if [ $TRIES -eq $MAX_TRIES ]; then
    echo "❌ MySQL non raggiungibile"
    exit 1
fi

# Seed database (ignora errori se già eseguito)
echo "🌱 Eseguo seed..."
npx prisma db seed 2>/dev/null || echo "   Seed già eseguito o skip"

echo "✅ Database pronto!"
echo "🚀 Avvio Next.js..."

# Avvia l'applicazione
exec "$@"
