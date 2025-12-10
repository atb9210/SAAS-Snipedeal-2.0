# 🔍 Debug Connessione Database - Comandi da Eseguire

## Nel Terminale dell'App su Dokploy

### 1. Verifica DATABASE_URL
```bash
echo $DATABASE_URL
```

**Deve essere:**
```
mysql://snipedeal:[PASSWORD]@snipedeal-mysql-pwa:3306/snipedeal_pwa
```

**NON deve essere:**
```
mysql://dummy:dummy@localhost:3306/dummy
```

### 2. Verifica che il servizio MySQL esista e sia raggiungibile
```bash
# Estrai il nome del servizio MySQL dal DATABASE_URL
echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/'

# Prova a fare ping al servizio MySQL
ping -c 3 $(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
```

### 3. Verifica connessione MySQL con mysql client (se disponibile)
```bash
# Installa mysql client temporaneamente
apt-get update && apt-get install -y default-mysql-client

# Estrai credenziali dal DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')

# Prova connessione
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1;" $DB_NAME
```

### 4. Verifica con Prisma (se funziona)
```bash
cd /app
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss
```

### 5. Verifica DNS resolution
```bash
# Il nome del servizio MySQL dovrebbe risolversi
nslookup snipedeal-mysql-pwa
# oppure
getent hosts snipedeal-mysql-pwa
```

### 6. Verifica rete Docker
```bash
# Lista tutti i servizi nella stessa rete
docker network ls
docker network inspect <network-name>
```

## Problemi Comuni

### Problema: DATABASE_URL è dummy
**Soluzione:** Vai in Dokploy → App → Environment Variables → Configura DATABASE_URL reale

### Problema: Nome servizio MySQL sbagliato
**Soluzione:** Il nome deve essere esattamente quello del servizio MySQL in Dokploy (es. `snipedeal-mysql-pwa`)

### Problema: Database non nella stessa rete Docker
**Soluzione:** Assicurati che app e MySQL siano nello stesso Environment in Dokploy

### Problema: MySQL non è ancora ready
**Soluzione:** Aspetta che MySQL sia completamente avviato (verde in Dokploy)

