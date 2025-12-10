# 🧭 Orientamento Progetto - SnipeDeal 2.0 PWA

**Data:** 2024-12-10  
**Versione:** 2.0.0 Beta  
**Stato:** Funzionante in locale, pronto per deployment produzione

---

## 📋 Cos'è SnipeDeal 2.0

**SnipeDeal** è una **PWA (Progressive Web App)** per il monitoraggio automatico di annunci su marketplace italiani e internazionali.

### Funzionalità Principali
- ✅ **Monitoraggio automatico** di annunci su Subito.it (e altri marketplace in arrivo)
- ✅ **Notifiche push** quando vengono trovati nuovi annunci corrispondenti alle ricerche
- ✅ **Sistema di campagne** con filtri avanzati (prezzo, regione, keyword)
- ✅ **Dashboard utente** e **pannello admin**
- ✅ **Sistema di abbonamenti** con piani Free, Hobby, Pro, Ultra
- ✅ **Scraping intelligente** con supporto proxy (Packetstream)

---

## 🏗️ Architettura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SNIPEDEAL 2.0 PWA                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         FRONTEND + API (Next.js 14)                │    │
│  │  - App Router                                      │    │
│  │  - API Routes (/api/*)                             │    │
│  │  - Server Components                                │    │
│  │  - PWA (Service Worker + Manifest)                 │    │
│  │  Porta: 3000                                       │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                           │
│  ┌──────────────┴─────────────────────────────────────┐    │
│  │         WORKER (Background Jobs)                    │    │
│  │  - Processa job di scraping                        │    │
│  │  - Scheduler integrato (check ogni 60s)            │    │
│  │  - Usa Playwright per scraping                     │    │
│  │  - Supporto proxy Packetstream                      │    │
│  └──────────────┬─────────────────────────────────────┘    │
│                 │                                           │
│  ┌──────────────┴──────────────┐  ┌──────────────────┐    │
│  │      MySQL 8.0              │  │   Redis 7        │    │
│  │  (Database principale)      │  │  (Job Queue)     │    │
│  │  - Utenti                    │  │  - BullMQ        │    │
│  │  - Campagne                  │  │  - Job storage   │    │
│  │  - Risultati                 │  │                  │    │
│  │  - Proxy providers           │  │                  │    │
│  └──────────────────────────────┘  └──────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnologico

### Frontend & Backend
- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **State Management**: Zustand + TanStack React Query
- **Form**: React Hook Form + Zod validation

### Database & Storage
- **Database**: MySQL 8.0 (con Prisma ORM)
- **Cache/Queue**: Redis 7 (BullMQ per job queue)
- **ORM**: Prisma Client

### Autenticazione & Sicurezza
- **Auth**: NextAuth.js (Credentials provider)
- **Password**: bcryptjs
- **Session**: JWT-based

### Scraping & Automazione
- **Browser Automation**: Playwright (Chromium)
- **Proxy**: Packetstream (configurabile via admin)
- **Queue System**: BullMQ + Redis

### PWA & Notifiche
- **PWA**: next-pwa (Service Worker + Manifest)
- **Push Notifications**: Web Push API (VAPID keys)

### Deployment
- **Container**: Docker + docker-compose
- **Platform**: Dokploy (production)
- **Build**: Multi-stage Dockerfile ottimizzato

---

## 📁 Struttura Progetto

```
snipedeal-pwa/
├── 📄 Dockerfile              # Build app Next.js (production)
├── 📄 Dockerfile.worker       # Build worker scraping
├── 📄 docker-compose.yml      # Stack completo (dev/prod)
├── 📄 next.config.js           # Config Next.js + PWA
├── 📄 package.json            # Dipendenze e script
│
├── 📂 prisma/
│   ├── schema.prisma          # Schema database (MySQL)
│   └── seed.ts                # Seeder dati iniziali
│
├── 📂 docker/
│   └── mysql/
│       └── init.sql           # Script inizializzazione MySQL
│
├── 📂 src/
│   ├── 📂 app/                # Next.js App Router
│   │   ├── (auth)/            # Login, Register
│   │   ├── (dashboard)/       # Dashboard utente
│   │   │   ├── campaigns/     # Gestione campagne
│   │   │   ├── profile/        # Profilo utente
│   │   │   └── pricing/       # Piani abbonamento
│   │   ├── admin/             # Pannello admin
│   │   │   ├── proxy/         # Gestione proxy
│   │   │   ├── users/         # Gestione utenti
│   │   │   └── jobs/          # Monitoraggio job
│   │   └── api/               # API Routes
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── campaigns/     # CRUD campagne
│   │       └── admin/         # API admin
│   │
│   ├── 📂 components/         # Componenti React riutilizzabili
│   ├── 📂 hooks/              # Custom React hooks
│   ├── 📂 lib/                # Utilities
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── queue.ts           # BullMQ queue setup
│   │   └── redis.ts           # Redis client
│   │
│   ├── 📂 services/           # Business logic
│   │   ├── scrapers/          # Scrapers marketplace
│   │   │   ├── base.ts        # Interface scraper
│   │   │   ├── subito.ts      # Scraper Subito.it
│   │   │   └── index.ts       # Factory scraper
│   │   └── proxy/             # Sistema proxy
│   │       ├── base.ts        # Interface proxy
│   │       ├── packetstream.ts # Provider Packetstream
│   │       └── manager.ts     # Proxy manager
│   │
│   ├── 📂 workers/            # Background workers
│   │   └── scraper-worker.ts  # Worker principale scraping
│   │
│   └── 📂 types/              # TypeScript types
│
├── 📂 public/                 # File statici
│   ├── manifest.json          # PWA manifest
│   ├── sw-custom.js           # Service Worker custom
│   └── icons/                 # Icone PWA
│
└── 📂 context chat/           # Documentazione migrazione
```

---

## 🐳 Configurazione Docker

### File Docker Principali

#### 1. **Dockerfile** (App Next.js)
- **Multi-stage build** ottimizzato
- Stage 1: Base (dipendenze sistema per Playwright)
- Stage 2: Dependencies (npm ci)
- Stage 3: Builder (build Next.js standalone)
- Stage 4: Runner (immagine finale minimale)
- Include Playwright Chromium per scraping
- Utente non-root per sicurezza

#### 2. **Dockerfile.worker** (Worker Scraping)
- Build separato per worker
- Include Playwright + dipendenze
- Esegue `tsx src/workers/scraper-worker.ts`
- Stesso ambiente dell'app ma senza server HTTP

#### 3. **docker-compose.yml** (Stack Completo)

**Servizi:**
- `mysql`: MySQL 8.0 con volume persistente
- `redis`: Redis 7 con persistenza AOF
- `app`: Next.js app (porta 3000)
- `worker`: Worker scraping (background)

**Volumi:**
- `mysql-data`: Database persistente
- `redis-data`: Cache/queue persistente

**Network:**
- `snipedeal-network`: Bridge network interno

**Health Checks:**
- MySQL: ping ogni 10s
- Redis: ping ogni 10s
- App e Worker aspettano che DB siano healthy

---

## 🚀 Deployment su Dokploy

### Architettura Deployment

```
DOKPLOY ENVIRONMENT
├── MySQL Service (PERSISTENTE)
│   └── Volume: mysql-data
│
├── Redis Service (PERSISTENTE)
│   └── Volume: redis-data
│
├── App Next.js (Application)
│   └── Dockerfile: snipedeal-pwa/Dockerfile
│   └── Port: 3000
│   └── Domains: app.snipedeal.it
│
└── Worker (Application)
    └── Dockerfile: snipedeal-pwa/Dockerfile.worker
    └── No ports (background)
```

### Variabili Ambiente Richieste

#### Per App Next.js:
```bash
DATABASE_URL=mysql://user:pass@mysql-service:3306/dbname
REDIS_URL=redis://redis-service:6379
NEXTAUTH_URL=https://app.snipedeal.it
NEXTAUTH_SECRET=random_32_chars
NODE_ENV=production
```

#### Per Worker:
```bash
DATABASE_URL=mysql://user:pass@mysql-service:3306/dbname
REDIS_URL=redis://redis-service:6379
NODE_ENV=production
```

### Ordine di Deploy
1. ✅ MySQL → Deploy e aspetta running
2. ✅ Redis → Deploy e aspetta running
3. ✅ App Next.js → Deploy
4. ✅ Worker → Deploy
5. ✅ Dominio → Configura SSL
6. ✅ Migrazioni → `npx prisma db push`
7. ✅ Seed → `npx prisma db seed`

**📖 Vedi `DEPLOYMENT_DOKPLOY.md` per guida completa**

---

## 🗄️ Database Schema (Prisma)

### Modelli Principali

#### **User**
- Autenticazione (email/password)
- Ruolo (USER/ADMIN)
- Piano abbonamento (Plan)
- Push subscription (JSON)

#### **Plan**
- Free, Hobby, Pro, Ultra
- Limiti: maxCampaigns, maxMarketplaces, frequencyMins
- Prezzo annuale

#### **Campaign**
- Keyword di ricerca
- Piattaforma (SUBITO, EBAY, VINTED, WALLAPOP, FACEBOOK)
- Filtri: minPrice, maxPrice, region
- Scheduling: isActive, lastRunAt, nextRunAt
- Statistiche: totalResults, newResults

#### **Result**
- Dati annuncio: title, price, location, link, image
- Stato: notified, isNew, status
- PublishedAt (stringa dal marketplace)
- ExtraData (JSON per dati specifici)

#### **JobLog**
- Log esecuzione job scraping
- Status: RUNNING, SUCCESS, FAILED, CANCELLED
- Metriche: totalFound, newFound, notified
- Timing: startedAt, completedAt, durationMs

#### **ProxyProvider**
- Configurazione proxy (Packetstream, etc.)
- Config JSON con credenziali
- isEnabled, isDefault

#### **ProxyUsageLog**
- Log utilizzo proxy
- Success, latency, IP usato, country

---

## ⚙️ Come Funziona il Sistema

### 1. **Creazione Campagna**
- Utente crea campagna con keyword, filtri, piattaforma
- Sistema valida limiti piano abbonamento
- Campagna salvata in DB con `isActive=true`

### 2. **Scheduling Automatico**
- Worker esegue check ogni 60 secondi
- Trova campagne con `isActive=true` e `nextRunAt <= now()`
- Crea job BullMQ per ogni campagna da eseguire

### 3. **Esecuzione Scraping**
- Worker processa job dalla queue Redis
- Crea JobLog con status RUNNING
- Seleziona scraper appropriato (es. SubitoScraper)
- Ottiene proxy dal ProxyManager (se configurato)
- Esegue scraping con Playwright
- Salva risultati in DB (evita duplicati con unique constraint)

### 4. **Notifiche**
- Per ogni nuovo risultato (`isNew=true`)
- Invia notifica push Web (se utente ha subscription)
- Aggiorna `notified=true` e `isNew=false`

### 5. **Aggiornamento Campagna**
- Aggiorna `lastRunAt` e `nextRunAt` (basato su frequencyMins del piano)
- Aggiorna statistiche: `totalResults`, `newResults`
- JobLog completato con status SUCCESS/FAILED

---

## 🔧 Comandi Utili

### Sviluppo Locale
```bash
# Avvia stack completo
npm run docker:up

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Avvia app
npm run dev

# Avvia worker (in terminale separato)
npm run worker
```

### Produzione
```bash
# Build app
npm run build

# Start app
npm run start

# Worker
npm run worker
```

### Database
```bash
npm run db:generate  # Genera Prisma client
npm run db:push      # Push schema a DB
npm run db:migrate   # Esegui migrazioni
npm run db:seed      # Seed dati iniziali
npm run db:studio    # Apri Prisma Studio (GUI)
```

---

## 📊 Piani Abbonamento

| Piano | Campagne Max | Marketplace | Frequenza | Prezzo |
|-------|--------------|-------------|-----------|--------|
| **Free** | 1 | 1 | 3 ore | Gratis |
| **Hobby** | 3 | 2 | 1 ora | Gratis |
| **Pro** | 5 | 5 | 15 min | 199€/anno |
| **Ultra** | 10 | 5 | 5 min | 299€/anno |

**Nota:** Billing non ancora implementato (tutti i piani sono gratuiti per ora)

---

## 🌐 Marketplace Supportati

- ✅ **Subito.it** (attivo e funzionante)
- ⏳ eBay (in arrivo)
- ⏳ Vinted (in arrivo)
- ⏳ Wallapop (in arrivo)
- ⏳ Facebook Marketplace (in arrivo)

---

## 🔐 Credenziali Demo

- **Admin**: `admin@snipedeal.it` / `admin123`
- **User**: `user@snipedeal.it` / `user123`
- **Dev**: `dev@snipedeal.it` / `dev123` (100 campagne, 1 min freq - per testing)

---

## 📝 Note Importanti

### Stato Attuale
- ✅ Migrazione da Laravel a Next.js completata
- ✅ Sistema funzionante in locale
- ✅ Scraping Subito.it operativo
- ✅ Worker e scheduler integrati
- ✅ Sistema proxy Packetstream configurato
- ⏳ Test end-to-end in corso
- ⏳ Deploy produzione in preparazione

### Prossimi Step
1. Test completi end-to-end
2. Deploy su Dokploy produzione
3. Configurazione SSL e domini
4. Monitoraggio e logging
5. Implementazione billing
6. Supporto altri marketplace

### File Chiave da Conoscere
- `DEPLOYMENT_DOKPLOY.md` - Guida deployment completa
- `prisma/schema.prisma` - Schema database
- `src/workers/scraper-worker.ts` - Worker principale
- `src/services/scrapers/subito.ts` - Scraper Subito.it
- `src/services/proxy/packetstream.ts` - Provider proxy
- `docker-compose.yml` - Stack Docker completo

---

## 🆘 Troubleshooting

### Worker non processa job
- Verifica Redis running: `docker ps | grep redis`
- Controlla logs worker: `docker logs snipedeal-worker`
- Verifica DATABASE_URL e REDIS_URL

### App non si connette a MySQL
- Verifica MySQL running: `docker ps | grep mysql`
- Controlla hostname (deve essere nome servizio Docker)
- Verifica DATABASE_URL formato corretto

### Build Docker fallisce
- Verifica Build Path: `snipedeal-pwa`
- Verifica Dockerfile Path: `snipedeal-pwa/Dockerfile`
- Controlla logs build in Dokploy

---

**Creato da:** Cursor AI Assistant  
**Per:** Orientamento rapido progetto SnipeDeal 2.0 PWA

