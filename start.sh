#!/bin/sh
set -e

echo "🚀 SnipeDeal PWA - Avvio..."
echo "⏳ Attendo database..."
sleep 10

echo "📦 Creazione tabelle..."
npx prisma db push --accept-data-loss

echo "🌱 Seed utenti..."
npx prisma db seed || echo "⚠️ Seed fallito o già eseguito"

echo "✅ Database pronto!"
echo "🚀 Avvio Next.js..."
exec node server.js
