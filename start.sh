#!/bin/sh

echo "🚀 SnipeDeal PWA - Avvio..."

# Aspetta che MySQL sia completamente pronto
echo "⏳ Attendo MySQL (30 secondi)..."
sleep 30

echo "📦 Creazione tabelle..."
TRIES=0
MAX=20
until npx prisma db push --accept-data-loss 2>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -ge $MAX ]; then
        echo "❌ MySQL non raggiungibile dopo $MAX tentativi"
        exit 1
    fi
    echo "   Retry $TRIES/$MAX..."
    sleep 3
done

echo "✅ Tabelle create!"

echo "🌱 Seed..."
npx prisma db seed || echo "⚠️ Seed già eseguito"

echo "✅ Pronto!"
exec node server.js
