#!/bin/sh
# docker-entrypoint.sh - Entrypoint automatico per SnipeDeal PWA
# Esegue migrazioni e seed automaticamente all'avvio

set -e

echo "🚀 SnipeDeal PWA - Avvio..."

# Attendi che MySQL sia pronto (max 60 secondi)
echo "⏳ Attendo MySQL..."
MAX_TRIES=30
TRIES=0
until npx prisma db push --skip-generate 2>/dev/null || [ $TRIES -eq $MAX_TRIES ]; do
    TRIES=$((TRIES + 1))
    echo "   MySQL non pronto, retry $TRIES/$MAX_TRIES..."
    sleep 2
done

if [ $TRIES -eq $MAX_TRIES ]; then
    echo "❌ MySQL non raggiungibile dopo $MAX_TRIES tentativi"
    exit 1
fi

echo "✅ Database sincronizzato!"

# Esegui seed solo se non ci sono utenti
echo "🌱 Controllo seed..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM User;" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "   Eseguo seed iniziale..."
    npx prisma db seed || echo "   Seed già eseguito o errore (continuiamo...)"
else
    echo "   Database già popolato ($USER_COUNT utenti), skip seed"
fi

echo "✅ Database pronto!"
echo "🚀 Avvio applicazione..."

# Esegui il comando passato (node server.js)
exec "$@"

