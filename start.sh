#!/bin/sh
echo "🚀 Inizializzando database..."
npx prisma db push --accept-data-loss 2>/dev/null || true
npx prisma db seed 2>/dev/null || true
echo "✅ Avvio app..."
exec node server.js

