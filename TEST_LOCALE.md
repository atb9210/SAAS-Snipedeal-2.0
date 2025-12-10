# 🧪 Test Locale con Docker Compose

Questa guida ti permette di testare l'intera applicazione in locale con Docker Compose, in un ambiente identico a produzione.

## 📋 Prerequisiti

- Docker Desktop installato e in esecuzione
- Almeno 4GB di RAM liberi
- Porte libere: 3000 (app), 3306 (mysql), 6379 (redis)

## 🚀 Avvio Rapido

### 1. Prepara l'ambiente

```bash
cd snipedeal-pwa

# Copia il file .env di esempio (se non esiste già .env.local)
# cp .env.local .env

# Verifica che .env.local esista
ls -la .env.local
```

### 2. Avvia lo stack completo

```bash
# Build e avvia tutti i servizi
docker-compose --env-file .env.local up --build

# Oppure in background (detached mode)
docker-compose --env-file .env.local up -d --build
```

Vedrai:
- ✅ `mysql` - Database MySQL 8.0
- ✅ `redis` - Redis per job queue
- ✅ `app` - Next.js app su http://localhost:3000
- ✅ `worker` - Worker per scraping in background

### 3. Attendi che i servizi siano pronti

```bash
# Controlla lo stato
docker-compose ps

# Tutti i servizi dovrebbero essere "healthy" o "running"
```

### 4. Esegui le migrazioni database

```bash
# Entra nel container dell'app come root
docker-compose exec -u root app sh

# Una volta dentro:
cd /app
npx prisma db push --schema=./prisma/schema.prisma
npx prisma db seed --schema=./prisma/schema.prisma
exit
```

### 5. Accedi all'applicazione

- 🌐 App: http://localhost:3000
- 📧 Admin di default (dopo seed):
  - Email: `admin@snipedeal.it`
  - Password: `admin123`

## 📊 Comandi Utili

### Logs

```bash
# Tutti i servizi
docker-compose logs -f

# Solo l'app
docker-compose logs -f app

# Solo il worker
docker-compose logs -f worker

# Solo MySQL
docker-compose logs -f mysql
```

### Restart servizi

```bash
# Riavvia solo l'app
docker-compose restart app

# Riavvia solo il worker
docker-compose restart worker

# Riavvia tutto
docker-compose restart
```

### Stop e cleanup

```bash
# Stop tutti i servizi
docker-compose down

# Stop e rimuovi i volumi (ATTENZIONE: cancella il database!)
docker-compose down -v

# Stop, cleanup e rimuovi immagini
docker-compose down --rmi all
```

### Rebuild dopo modifiche al codice

```bash
# Rebuild solo l'app
docker-compose up -d --build app

# Rebuild solo il worker
docker-compose up -d --build worker

# Rebuild tutto
docker-compose up -d --build
```

### Accesso ai container

```bash
# Entra nell'app come root
docker-compose exec -u root app sh

# Entra nel worker
docker-compose exec -u root worker sh

# Entra in MySQL
docker-compose exec mysql mysql -u snipedeal -p
# Password: snipedeal_secret

# Entra in Redis
docker-compose exec redis redis-cli
```

## 🔍 Verifica che tutto funzioni

### 1. Verifica database

```bash
docker-compose exec mysql mysql -u snipedeal -psnipedeal_secret -e "USE snipedeal; SHOW TABLES;"
```

Dovresti vedere le tabelle: User, Plan, Campaign, Result, JobLog, ProxyProvider, ProxyUsageLog

### 2. Verifica Redis

```bash
docker-compose exec redis redis-cli ping
# Dovrebbe rispondere: PONG
```

### 3. Verifica app Next.js

```bash
curl http://localhost:3000
# Dovrebbe rispondere con HTML
```

### 4. Test login

1. Vai su http://localhost:3000/login
2. Login con:
   - Email: `admin@snipedeal.it`
   - Password: `admin123`
3. Dovresti accedere alla dashboard

## 🐛 Troubleshooting

### Problema: Porta già in uso

```bash
# Trova cosa usa la porta 3000
lsof -i :3000

# Uccidi il processo
kill -9 <PID>
```

### Problema: MySQL non si avvia

```bash
# Rimuovi il volume e ricrea
docker-compose down -v
docker-compose up -d mysql
docker-compose logs -f mysql
```

### Problema: App non si connette al database

```bash
# Verifica che MySQL sia healthy
docker-compose ps

# Verifica DATABASE_URL nell'app
docker-compose exec app env | grep DATABASE_URL

# Dovrebbe essere: mysql://snipedeal:snipedeal_secret@mysql:3306/snipedeal
```

### Problema: Worker non processa job

```bash
# Verifica logs del worker
docker-compose logs -f worker

# Verifica connessione Redis
docker-compose exec worker sh -c 'ping -c 1 redis'
```

## 🎯 Test completo del flusso

### 1. Crea una campagna di scraping

1. Login come admin
2. Vai su "Campagne"
3. Crea nuova campagna con URL Amazon
4. Avvia la campagna

### 2. Verifica che il worker processi il job

```bash
# Controlla i logs del worker
docker-compose logs -f worker

# Dovresti vedere:
# - Job ricevuto
# - Scraping in corso
# - Risultati salvati
```

### 3. Verifica risultati nel database

```bash
docker-compose exec mysql mysql -u snipedeal -psnipedeal_secret -e "
USE snipedeal;
SELECT * FROM Campaign;
SELECT * FROM Result;
SELECT * FROM JobLog;
"
```

## 📝 Note

- I dati sono persistenti nei volumi Docker (mysql-data, redis-data)
- Per reset completo: `docker-compose down -v` (cancella tutto!)
- Le modifiche al codice richiedono rebuild: `docker-compose up -d --build app`
- I Dockerfile sono identici a quelli usati in produzione su Dokploy

## 🚀 Deploy su Dokploy

Una volta che tutto funziona in locale:

1. Push su GitHub
2. Dokploy farà autodeploy usando gli stessi Dockerfile
3. Configura le variabili ambiente in Dokploy
4. Le migrazioni vanno fatte una volta manualmente (come in locale)

---

Se hai problemi, controlla i logs: `docker-compose logs -f`

