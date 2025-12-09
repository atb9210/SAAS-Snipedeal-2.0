# SnipeDeal 2.0 PWA

> **⚠️ Versione Beta - In Sviluppo**  
> Migrazione da Laravel a Next.js PWA completata. Sistema funzionante in locale ma ancora da testare completamente.  
> Checkpoint: 2024-12-09

Applicazione PWA per il monitoraggio automatico di annunci sui marketplace (Subito.it, eBay, Vinted, Wallapop, Facebook Marketplace).

## 📋 Stato Migrazione

**Versione:** Beta 0.1.0  
**Data Checkpoint:** 2024-12-09  
**Stato:** Funzionante in locale, test completi in corso

### ✅ Completato
- Migrazione completa da Laravel a Next.js 14
- Sistema di autenticazione (NextAuth.js)
- Dashboard utente e admin
- Scraping Subito.it funzionante
- Worker e scheduler per job automatici
- Sistema di code (BullMQ + Redis)
- Database MySQL con Prisma ORM
- PWA base (manifest, service worker)

### 🚧 In Sviluppo/Test
- Test completi end-to-end
- Notifiche push Web
- Supporto altri marketplace (eBay, Vinted, Wallapop)
- Sistema di billing
- Deploy produzione

Vedi `context chat/` per dettagli completi sulla migrazione e fix implementati.

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript
- **Database**: MySQL + Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Auth**: NextAuth.js (Credentials)
- **PWA**: next-pwa + Service Workers
- **Notifiche**: Web Push API
- **Queue**: BullMQ + Redis
- **Scraping**: Playwright
- **Container**: Docker + docker-compose

## Requisiti

- Node.js 20+
- Docker Desktop (per MySQL e Redis)
- npm o yarn

## Setup Locale

### 1. Installa dipendenze

```bash
cd snipedeal-pwa
npm install
```

### 2. Avvia i container Docker

```bash
npm run docker:up
```

Questo avvia:
- MySQL su porta 3306
- Redis su porta 6379

### 3. Configura ambiente

Crea il file `.env`:

```bash
cp .env.example .env
```

### 4. Setup database

```bash
# Genera Prisma client
npm run db:generate

# Push schema al database
npm run db:push

# Seed dati iniziali (piani + utenti demo)
npm run db:seed
```

### 5. Avvia l'applicazione

```bash
npm run dev
```

L'app sarà disponibile su http://localhost:3000

## Credenziali Demo

- **Admin**: admin@snipedeal.it / admin123
- **User**: user@snipedeal.it / user123
- **Dev**: dev@snipedeal.it / dev123 (100 campagne, 1 min freq - per testing)

## Comandi Utili

```bash
# Sviluppo
npm run dev          # Avvia server di sviluppo
npm run build        # Build produzione
npm run start        # Avvia server produzione

# Database
npm run db:generate  # Genera Prisma client
npm run db:push      # Push schema a DB
npm run db:migrate   # Esegui migrazioni
npm run db:seed      # Seed dati iniziali
npm run db:studio    # Apri Prisma Studio

# Docker
npm run docker:up    # Avvia container
npm run docker:down  # Ferma container
npm run docker:build # Build immagini

# Worker (scraping)
npm run worker       # Avvia worker di scraping
```

## Struttura Progetto

```
snipedeal-pwa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register
│   │   ├── (dashboard)/        # App principale
│   │   ├── admin/              # Pannello admin
│   │   └── api/                # API Routes
│   ├── components/             # UI Components
│   ├── lib/                    # Utilities, Prisma, Auth
│   ├── services/               # Scrapers
│   │   └── scrapers/
│   │       ├── base.ts         # Interface base
│   │       └── subito.ts       # Scraper Subito.it
│   ├── hooks/                  # React hooks
│   └── workers/                # Background jobs
├── prisma/
│   ├── schema.prisma           # Schema database
│   └── seed.ts                 # Seeder
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Piani Abbonamento

| Piano | Campagne | Marketplace | Frequenza | Prezzo |
|-------|----------|-------------|-----------|--------|
| Free | 1 | 1 | 3 ore | Gratis |
| Hobby | 3 | 2 | 1 ora | Gratis |
| Pro | 5 | 5 | 15 min | 199€/anno |
| Ultra | 10 | 5 | 5 min | 299€/anno |

## Piattaforme Supportate

- ✅ Subito.it (attivo)
- ⏳ eBay (coming soon)
- ⏳ Vinted (coming soon)
- ⏳ Wallapop (coming soon)
- ⏳ Facebook Marketplace (coming soon)

## PWA Features

- Installabile su mobile e desktop
- Notifiche push per nuovi annunci
- Funziona offline (caching)
- Aggiornamenti automatici

## Note

- Il billing non è ancora implementato (tutti i piani sono gratuiti)
- Per generare VAPID keys per push notifications: `npx web-push generate-vapid-keys`
- Il worker di scraping va avviato separatamente in produzione


