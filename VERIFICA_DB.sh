#!/bin/bash
# Script per verificare connessione database

echo "=== VERIFICA DATABASE CONNECTION ==="
echo ""

# 1. Mostra DATABASE_URL (senza password)
echo "1. DATABASE_URL configurato:"
echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/'
echo ""

# 2. Estrai componenti
DB_USER=$(echo "$DATABASE_URL" | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_PASS=$(echo "$DATABASE_URL" | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
DB_HOST=$(echo "$DATABASE_URL" | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo "$DATABASE_URL" | sed 's/.*:\([0-9]*\)\/.*/\1/')
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\/\([^?]*\).*/\1/')

echo "2. Componenti estratti:"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo ""

# 3. Verifica risoluzione DNS
echo "3. Verifica risoluzione DNS per $DB_HOST:"
if getent hosts "$DB_HOST" > /dev/null 2>&1; then
    echo "   ✅ Hostname risolto:"
    getent hosts "$DB_HOST"
else
    echo "   ❌ Hostname NON risolto!"
    echo "   Prova con: nslookup $DB_HOST"
fi
echo ""

# 4. Verifica porta raggiungibile
echo "4. Verifica porta $DB_PORT su $DB_HOST:"
if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; then
    echo "   ✅ Porta $DB_PORT raggiungibile"
else
    echo "   ❌ Porta $DB_PORT NON raggiungibile"
fi
echo ""

# 5. Verifica con mysql client (se disponibile)
echo "5. Verifica connessione MySQL:"
if command -v mysql > /dev/null 2>&1; then
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" 2>&1; then
        echo "   ✅ Connessione MySQL riuscita!"
    else
        echo "   ❌ Connessione MySQL FALLITA"
        echo "   Errore:"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" 2>&1
    fi
else
    echo "   ⚠️  mysql client non installato"
    echo "   Installa con: apt-get update && apt-get install -y default-mysql-client"
fi
echo ""

# 6. Verifica con Prisma
echo "6. Verifica con Prisma:"
if [ -f "./node_modules/.bin/prisma" ]; then
    cd /app 2>/dev/null || cd / 2>/dev/null
    if [ -f "./prisma/schema.prisma" ]; then
        echo "   Tentativo connessione Prisma..."
        ./node_modules/.bin/prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1;" 2>&1 | head -5
    else
        echo "   ⚠️  schema.prisma non trovato"
    fi
else
    echo "   ⚠️  Prisma CLI non trovato"
fi
echo ""

# 7. Verifica rete Docker
echo "7. Verifica rete Docker:"
docker network ls 2>/dev/null | head -5
echo ""

echo "=== FINE VERIFICA ==="

