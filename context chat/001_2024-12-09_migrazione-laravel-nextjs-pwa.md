# Context Chat #001
**Data:** 2024-12-09  
**Task:** Migrazione SnipeDeal da Laravel a Next.js PWA

---

## 🎯 Obiettivo
Migrare l'applicazione SnipeDeal 1.0 (Laravel + Blade + MySQL) a una PWA moderna con Next.js 14, mantenendo MySQL come database e semplificando l'architettura.

---

## 📋 Requisiti Definiti

### Funzionalità Core da Mantenere
- **Campagne di scraping** (monitoraggio keyword su marketplace)
- **Scraping Subito.it** (attivo), eBay/Vinted/Wallapop/FB Marketplace (placeholder)
- **Notifiche Push Web** (sostituisce Telegram)
- **Autenticazione** (email/password con NextAuth.js)

### Funzionalità Rimosse
- Business Manager
- Pipeline
- Lead/Appointments/Calendar
- JobLog complesso
- Gestione proxy avanzata

### Piani Abbonamento
| Piano | Campagne | Marketplace | Frequenza | Prezzo |
|-------|----------|-------------|-----------|--------|
| Free | 1 | 1 | 3 ore | €0 |
| Hobby | 3 | 2 | 1 ora | €0 |
| Pro | 5 | 5 | 15 min | €199/anno |
| Ultra | 10 | 5 | 5 min | €299/anno |

### Utenti Default
- **Admin:** `admin@snipedeal.it` / `admin123`
- **User:** `user@snipedeal.it` / `user123`

---

## 🛠 Stack Tecnologico Implementato

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (tema rosso vivace)
- **Framer Motion** (animazioni)
- **Lucide React** (icone)

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **MySQL 8.0** (Docker)
- **Redis 7** (Docker) per BullMQ
- **BullMQ** (job queue scraping)

### Autenticazione
- **NextAuth.js** (Credentials provider)
- **JWT Strategy**
- **bcryptjs** (hash password)

### PWA
- **next-pwa**
- **Web Push API** (VAPID)
- **Service Worker** personalizzato

---

## 📁 Struttura Progetto Creata

```
snipedeal-pwa/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/      # App utente
│   │   │   ├── dashboard/    # Home con stats
│   │   │   ├── campaigns/    # Lista + wizard creazione
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── pricing/
│   │   ├── admin/            # Pannello admin
│   │   │   ├── page.tsx      # Dashboard admin
│   │   │   ├── users/        # Gestione utenti
│   │   │   ├── plans/        # Visualizza piani
│   │   │   ├── jobs/         # Monitoraggio BullMQ
│   │   │   └── settings/     # Impostazioni sistema
│   │   └── api/
│   │       ├── auth/         # NextAuth + register
│   │       ├── campaigns/    # CRUD campagne
│   │       ├── push/         # Subscribe push
│   │       └── admin/        # API admin
│   ├── components/
│   │   ├── layout/           # BottomNav, FAB
│   │   └── providers.tsx
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # NextAuth config
│   │   ├── queue.ts          # BullMQ setup
│   │   ├── redis.ts          # Redis client
│   │   └── utils.ts          # Helper functions
│   ├── services/scrapers/
│   │   ├── base.ts           # Interface scraper
│   │   ├── subito.ts         # Scraper Subito.it
│   │   └── index.ts          # Registry scrapers
│   ├── hooks/
│   │   └── use-push-notifications.ts
│   ├── workers/
│   │   └── scraper-worker.ts # BullMQ worker
│   └── middleware.ts         # Protezione route
├── prisma/
│   ├── schema.prisma         # Schema DB
│   └── seed.ts               # Seeder piani + utenti
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── icons/                # Icone PWA (SVG)
│   └── sw-custom.js          # Service worker push
├── docker-compose.yml        # MySQL + Redis
├── Dockerfile
└── .env                      # Variabili ambiente
```

---

## 🗄 Schema Database (Prisma)

### Modelli Principali
```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  name      String?
  role      String     @default("user") // user | admin
  planId    String
  plan      Plan       @relation(...)
  campaigns Campaign[]
  pushSubscriptions PushSubscription[]
}

model Plan {
  id              String  @id @default(cuid())
  name            String  @unique  // Free, Hobby, Pro, Ultra
  maxCampaigns    Int
  maxMarketplaces Int
  frequencyMins   Int
  priceYear       Float   @default(0)
  users           User[]
}

model Campaign {
  id          String   @id @default(cuid())
  name        String
  keyword     String
  platform    String   // subito, ebay, vinted...
  minPrice    Float?
  maxPrice    Float?
  region      String?
  isActive    Boolean  @default(true)
  userId      String
  user        User     @relation(...)
  results     Result[]
}

model Result {
  id         String   @id @default(cuid())
  title      String
  price      Float
  url        String   @unique
  image      String?
  location   String?
  isNew      Boolean  @default(true)
  campaignId String
  campaign   Campaign @relation(...)
}

model PushSubscription {
  id       String @id @default(cuid())
  endpoint String @unique
  p256dh   String
  auth     String
  userId   String
  user     User   @relation(...)
}
```

---

## 🐳 Docker Setup

### docker-compose.yml
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: snipedeal-mysql
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: snipedeal
      MYSQL_USER: snipedeal
      MYSQL_PASSWORD: snipedeal_secret
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    container_name: snipedeal-redis
    ports: ["6379:6379"]
    volumes:
      - redis-data:/data
```

### .env
```env
DATABASE_URL="mysql://snipedeal:snipedeal_secret@localhost:3306/snipedeal"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

---

## 🔧 Comandi Esecuzione

```bash
# Setup iniziale
cd snipedeal-pwa
npm install

# Avvia Docker (MySQL + Redis)
docker-compose up -d

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Avvia app development
npm run dev

# (Opzionale) Avvia worker scraping
npm run worker
```

---

## ✅ Test Effettuati (Browser Automation)

### App Utente
| Test | Risultato |
|------|-----------|
| Login con credenziali demo | ✅ |
| Dashboard con stats | ✅ |
| FAB button (+) | ✅ |
| Wizard campagna 3 step | ✅ |
| Bottom navigation | ✅ |
| Pagina Campagne | ✅ |

### Pannello Admin
| Test | Risultato |
|------|-----------|
| Dashboard admin | ✅ |
| Gestione Utenti | ✅ |
| Cambio piano utente | ✅ |
| Visualizza Piani | ✅ |
| Monitoraggio Jobs | ✅ |
| Impostazioni | ✅ |
| Torna all'App | ✅ |

---

## 🐛 Problemi Risolti

1. **Pagine admin mancanti (404)** → Create `/admin/plans`, `/admin/jobs`, `/admin/settings`
2. **Errore Prisma `subscriptionPlan`** → Corretto in `plan` (nome corretto del modello)
3. **Errori 404 icone** → Create icone SVG e aggiornato manifest.json
4. **Import Prisma** → Standardizzato `import prisma from '@/lib/prisma'`

---

## 📝 Note Tecniche

### Scraper Subito.it
- Usa **Cheerio** per parsing HTML
- Fallback su **Playwright** se necessario
- Estrae dati da `__NEXT_DATA__` (JSON embedded)
- Supporta filtri: keyword, prezzo min/max, regione

### Web Push Notifications
- Richiede chiavi VAPID (generare con `web-push generate-vapid-keys`)
- Service worker gestisce `push` e `notificationclick`
- Subscription salvata in DB per ogni utente

### BullMQ Worker
- Processa job di scraping in background
- Scheduling automatico basato su `frequencyMins` del piano
- Retry automatico con backoff esponenziale

---

## 🚀 Prossimi Step Suggeriti

1. **Generare chiavi VAPID** e configurare push notifications
2. **Testare scraper Subito.it** con keyword reali
3. **Implementare altri scrapers** (eBay, Vinted, etc.)
4. **Aggiungere Stripe/billing** per piani a pagamento
5. **Deploy** su Vercel + PlanetScale/Railway

---

## 📎 File Correlati

- `/snipedeal-pwa/README.md` - Documentazione progetto
- `/SnipeDeal 1.0 Laravel/LogCursorAttivita.md` - Log attività
- `/AnalisiSnipeDealLaravel.md` - Analisi progetto originale


