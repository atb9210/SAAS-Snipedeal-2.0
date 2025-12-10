# Context Chat #005
**Data:** 2024-12-10  
**Task:** Deployment SnipeDeal 2.0 PWA su Dokploy

---

## 🎯 Obiettivo
Deployare l'applicazione SnipeDeal 2.0 PWA su Dokploy utilizzando Docker Compose, garantendo migrazioni automatiche, seeding del database, e funzionamento completo di app, worker, MySQL e Redis.

---

## 📋 Requisiti Definiti

### Architettura Deployment
- **Dokploy** come piattaforma di deployment
- **Docker Compose** per orchestrazione servizi
- **MySQL 8.0** per database persistente
- **Redis 7** per job queue BullMQ
- **Next.js App** (standalone build)
- **Worker** separato per scraping background

### Funzionalità Richieste
- Migrazioni automatiche Prisma all'avvio
- Seeding automatico database (piani + utenti default)
- Proxy Manager funzionante nel worker
- Health checks per tutti i servizi
- Networking interno (dokploy-network)
- Traefik routing per app

---

## 🛠 Stack Tecnologico

### Docker
- **Multi-stage builds** per ottimizzazione immagini
- **Standalone output** Next.js per produzione
- **Playwright** con dipendenze sistema
- **Prisma CLI** incluso per migrazioni

### Dokploy
- **Compose deployment** (non standalone services)
- **Environment variables** gestite da Dokploy
- **Traefik** per routing automatico
- **Volumes persistenti** per MySQL e Redis

---

## 📁 File Creati/Modificati

### Docker Configuration
- `Dockerfile` - Build multi-stage Next.js app
- `Dockerfile.worker` - Build worker scraping
- `docker-compose.dokploy.yml` - Compose per Dokploy
- `docker-compose.dokploy.local.yml` - Compose per test locale
- `docker-entrypoint.sh` - Script inizializzazione (deprecato)

### Database
- `docker/mysql/init.sql` - Script inizializzazione MySQL (opzionale)

### Documentazione
- `DEPLOYMENT_DOKPLOY.md` - Guida deployment completa
- `TEST_LOCALE.md` - Guida test locale

---

## 🐳 Docker Compose Setup

### docker-compose.dokploy.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-snipedeal_pwa}
      MYSQL_USER: ${MYSQL_USER:-snipedeal}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck: [mysqladmin ping]
    networks:
      - dokploy-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    healthcheck: [redis-cli ping]
    networks:
      - dokploy-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    user: root  # Per installazione globale Prisma CLI
    expose:
      - "3000"
    command: >
      sh -c "
      echo '🚀 Starting SnipeDeal App...' &&
      sleep 15 &&
      npm install -g prisma@5.22.0 ts-node &&
      prisma db push --schema=./prisma/schema.prisma --accept-data-loss &&
      prisma db seed --schema=./prisma/schema.prisma &&
      node server.js
      "
    environment:
      - DATABASE_URL=mysql://${MYSQL_USER:-snipedeal}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE:-snipedeal_pwa}
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dokploy-network

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=mysql://${MYSQL_USER:-snipedeal}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE:-snipedeal_pwa}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
      - app
    networks:
      - dokploy-network
```

---

## 🔧 Problemi Risolti

### 1. Build Failures - Database Connection
**Problema**: Prisma tentava di connettersi al DB durante il build  
**Soluzione**: Aggiunto `ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"` nel Dockerfile prima di `prisma generate` e `npm run build`

### 2. Static Rendering Errors
**Problema**: Next.js tentava pre-rendering statico di pagine dinamiche  
**Soluzione**: Aggiunto `export const dynamic = 'force-dynamic'` a tutte le pagine che usano Prisma o `useSearchParams()`

### 3. Prisma CLI Missing in Standalone Build
**Problema**: Prisma CLI non disponibile nel build standalone  
**Soluzione**: Aggiunto `COPY` commands per:
- `node_modules/prisma`
- `node_modules/.bin/prisma`
- `node_modules/@prisma/engines`
- `node_modules/bcryptjs` (per seed script)

### 4. Database Not Populated
**Problema**: Database vuoto dopo deploy  
**Soluzione**: Aggiunto comandi automatici nel `command` dell'app service:
- `prisma db push` per migrazioni
- `prisma db seed` per seeding

### 5. Permission Errors (npm install -g)
**Problema**: `npm install -g` falliva con utente `nextjs`  
**Soluzione**: Aggiunto `user: root` al service `app`

### 6. Prisma Version Mismatch
**Problema**: `prisma@latest` (v7.x) aveva breaking changes  
**Soluzione**: Installazione esplicita `prisma@5.22.0` per match con `package.json`

### 7. ts-node Module Resolution
**Problema**: `ts-node` non trovava `bcryptjs` durante seed  
**Soluzione**: Cambiato `ts-node` a `npx ts-node` nel seed script

### 8. Proxy Manager Not Reloading
**Problema**: Worker non ricaricava provider dopo aggiunta proxy  
**Soluzione**: Modificato `getProxy()` per forzare `reload()` se `providers.size === 0` e `initialized === true`

### 9. Network Configuration
**Problema**: Conflitti rete `snipedeal-network` vs `dokploy-network`  
**Soluzione**: Rimossi tutti i riferimenti a `snipedeal-network`, solo `dokploy-network`

### 10. Port Allocation
**Problema**: Porta 3000 già allocata  
**Soluzione**: Rimosso `ports: - "3000:3000"`, usato solo `expose: - "3000"` per Traefik

### 11. Redis Healthcheck
**Problema**: Redis unhealthy con password vuota  
**Soluzione**: Rimosso `--requirepass` quando `REDIS_PASSWORD` è vuoto

---

## 🔐 Environment Variables Dokploy

### MySQL
```
MYSQL_ROOT_PASSWORD=TuaPasswordRoot123!
MYSQL_DATABASE=snipedeal_pwa
MYSQL_USER=snipedeal
MYSQL_PASSWORD=TuaPasswordDB456!
```

### Redis
```
REDIS_PASSWORD=  # Vuoto se non necessario
```

### App
```
DATABASE_URL=mysql://snipedeal:TuaPasswordDB456!@mysql:3306/snipedeal_pwa
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=https://app.snipedeal.it
NEXTAUTH_SECRET=[generato con: openssl rand -base64 32]
NODE_ENV=production
```

---

## 📊 Test Eseguiti

### Deployment Dokploy
| Test | Risultato |
|------|-----------|
| Compose deployment | ✅ |
| Database creato | ✅ |
| Migrazioni automatiche | ✅ |
| Seeding automatico | ✅ |
| App avviata | ✅ |
| Worker avviato | ✅ |
| Proxy Manager inizializzato | ✅ |
| Scraping con proxy | ✅ |
| Traefik routing | ✅ |

### Log Deployment Riuscito
```
🚀 Starting SnipeDeal App...
📦 Running database migrations...
✅ The database is now in sync with your Prisma schema
🌱 Seeding database...
✅ Plan "Free" created/updated
✅ Plan "Hobby" created/updated
✅ Plan "Pro" created/updated
✅ Plan "Ultra" created/updated
✅ Plan "Dev" created/updated
✅ Admin user created (admin@snipedeal.it / admin123)
✅ Demo user created (user@snipedeal.it / user123)
✅ Dev user created (dev@snipedeal.it / dev123)
🎉 Starting Next.js...
✓ Ready in 82ms
```

### Worker Logs
```
🚀 Starting Scraper Worker...
✅ Scraper Worker ready and listening for jobs
[Redis] Connected successfully
[ProxyManager] Provider Packetstream loaded
[ProxyManager] Initialized with 1 provider(s)
🔒 Proxy enabled: scraping requests will be proxied
```

### Scraping Test
```
[SubitoScraper] Using proxy: proxy.packetstream.io:31112
[SubitoScraper] Page 1: found 30 ads
[SubitoScraper] Page 2: found 30 ads
[SubitoScraper] Page 3: found 30 ads
[SubitoScraper] Found 90 ads (filtered from 90)
✅ Job completed: 90 new results
```

---

## 🗄 Database Setup

### init.sql (Opzionale)
```sql
CREATE DATABASE IF NOT EXISTS snipedeal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE snipedeal;
GRANT ALL PRIVILEGES ON snipedeal.* TO 'snipedeal'@'%';
FLUSH PRIVILEGES;
```

**Nota**: `init.sql` è ridondante perché MySQL crea automaticamente:
- Database da `MYSQL_DATABASE`
- Utente da `MYSQL_USER`/`MYSQL_PASSWORD`
- Permessi automatici

---

## 🔄 Flusso Deployment

```
[Dokploy Clona Repo]
         ↓
[Docker Compose Build]
         ↓
[MySQL Avvia + Healthcheck]
         ↓
[Redis Avvia + Healthcheck]
         ↓
[App Avvia]
         ↓
[Wait 15s per DB ready]
         ↓
[Install Prisma CLI globalmente]
         ↓
[prisma db push] → Migrazioni
         ↓
[prisma db seed] → Piani + Utenti
         ↓
[node server.js] → Next.js avvia
         ↓
[Worker Avvia]
         ↓
[ProxyManager Inizializza]
         ↓
[Scheduler Attivo]
```

---

## 📝 Note Tecniche

### Dockerfile Multi-Stage
1. **deps**: Installazione dipendenze
2. **builder**: Build Next.js + Prisma generate
3. **runner**: Immagine finale standalone

### Prisma in Standalone Build
- Prisma CLI deve essere copiato esplicitamente
- Engine WASM files necessari per `prisma db push`
- `bcryptjs` necessario per seed script

### Proxy Manager Reload
- Inizializzazione al primo `getProxy()`
- Reload automatico se provider non trovati
- Logging completo per debugging

### Health Checks
- MySQL: `mysqladmin ping`
- Redis: `redis-cli ping`
- App: Traefik healthcheck automatico

---

## 🚀 Comandi Deployment

### Dokploy
1. Crea nuovo Compose deployment
2. Imposta environment variables
3. Seleziona `docker-compose.dokploy.yml`
4. Deploy

### Test Locale
```bash
docker-compose -f docker-compose.dokploy.local.yml up -d --build
docker-compose -f docker-compose.dokploy.local.yml logs -f app
docker-compose -f docker-compose.dokploy.local.yml logs -f worker
```

### Verifica Database
```bash
docker-compose -f docker-compose.dokploy.local.yml exec app npx prisma studio
```

---

## ✅ Stato Finale

- ✅ **Deployment Dokploy**: Funzionante
- ✅ **Database**: Popolato automaticamente
- ✅ **Migrazioni**: Automatiche all'avvio
- ✅ **Seeding**: Automatico all'avvio
- ✅ **Proxy Manager**: Funzionante con reload automatico
- ✅ **Scraping**: Funzionante con proxy
- ✅ **Worker**: Scheduler attivo
- ✅ **Traefik**: Routing configurato

---

## 📎 File Correlati

- `/snipedeal-pwa/DEPLOYMENT_DOKPLOY.md` - Guida deployment completa
- `/snipedeal-pwa/docker-compose.dokploy.yml` - Compose Dokploy
- `/snipedeal-pwa/docker-compose.dokploy.local.yml` - Compose test locale
- `/snipedeal-pwa/Dockerfile` - Build app
- `/snipedeal-pwa/Dockerfile.worker` - Build worker

---

## 🔮 Prossimi Step Suggeriti

1. **Monitoring**: Aggiungere health checks avanzati
2. **Logging**: Centralizzare log con aggregatore
3. **Backup**: Automatizzare backup database
4. **Scaling**: Configurare repliche worker
5. **CI/CD**: Automatizzare deploy su push

