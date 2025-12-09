# 003_2024-12-09_fix-worker-scheduler-jobs.md

## Riepilogo Tecnico: Fix Sistema Worker, Scheduler e Jobs

### Problema Identificato
Le campagne venivano create nel database ma i job di scraping non venivano mai eseguiti. Il sistema era "morto" - nessun job partiva automaticamente.

### Causa Root
3 problemi critici identificati:

1. **API Creazione Campagna non schedulava il primo job**
   - File: `src/app/api/campaigns/route.ts`
   - La campagna veniva salvata nel DB ma `addScraperJob()` non veniva chiamato

2. **Path alias `@/` non funzionava con tsx/ts-node**
   - File: `src/services/scrapers/subito.ts`, `src/services/proxy/manager.ts`
   - Il worker standalone non risolveva `@/services/proxy` → crash

3. **Nessuno scheduler per job periodici**
   - File: `src/workers/scraper-worker.ts`
   - Il worker aspettava job ma nessun processo li creava periodicamente

### Soluzioni Implementate

#### Fix 1: API Creazione Campagna
```typescript
// src/app/api/campaigns/route.ts
import { addScraperJob } from '@/lib/queue';

// Dopo la creazione campagna (riga ~129)
await addScraperJob({ 
  campaignId: campaign.id, 
  userId: session.user.id 
});
```

#### Fix 2: Path Alias → Path Relativi
```typescript
// src/services/scrapers/subito.ts
- import { getProxyManager, ProxyUrl } from '@/services/proxy';
+ import { getProxyManager, ProxyUrl } from '../proxy';

// src/services/proxy/manager.ts
- import prisma from '@/lib/prisma';
+ import prisma from '../../lib/prisma';
```

#### Fix 3: Scheduler nel Worker
```typescript
// src/workers/scraper-worker.ts
async function checkPendingCampaigns() {
  const pendingCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() },
    },
  });
  
  for (const campaign of pendingCampaigns) {
    // Evita duplicati in coda
    const hasExistingJob = await checkQueueForCampaign(campaign.id);
    if (!hasExistingJob) {
      await addScraperJob({ campaignId: campaign.id, userId: campaign.userId });
    }
  }
}

// Esegui ogni 60 secondi
setInterval(checkPendingCampaigns, 60000);
```

#### Fix 4: Script Worker con tsx
```json
// package.json
- "worker": "ts-node --project tsconfig.worker.json src/workers/scraper-worker.ts"
+ "worker": "tsx src/workers/scraper-worker.ts"
```

### Utente Dev per Testing
Creato utente speciale per testare il sistema:

| Campo | Valore |
|-------|--------|
| Email | dev@snipedeal.it |
| Password | dev123 |
| Piano | Dev |
| Max Campagne | 100 |
| Frequenza | 1 minuto |

```typescript
// prisma/seed.ts - Piano Dev aggiunto
{
  name: 'Dev',
  maxCampaigns: 100,
  maxMarketplaces: 5,
  frequencyMins: 1,
  priceYear: 0,
}
```

### Flusso Operativo Corretto

```
1. Utente crea campagna (POST /api/campaigns)
   ↓
2. API salva campagna + chiama addScraperJob() immediatamente
   ↓
3. Job viene aggiunto a BullMQ queue
   ↓
4. Worker processa il job (scraping)
   ↓
5. Worker salva risultati + schedula nextRunAt
   ↓
6. Scheduler (ogni 60s) controlla campagne con nextRunAt <= now
   ↓
7. Scheduler aggiunge nuovi job per campagne da eseguire
   ↓
8. Ciclo si ripete automaticamente
```

### Test Eseguiti

```
=== JOB ESEGUITI (Campagna "Test Worker Dev") ===
Job 1: SUCCESS - 11:58:18 - Found: 90 (90 new)  ← Creazione automatica
Job 2: SUCCESS - 11:59:25 - Found: 90 (0 new)   ← Scheduler automatico
Job 3: SUCCESS - 12:01:28 - Found: 90 (0 new)   ← Scheduler automatico
```

### File Modificati

| File | Modifica |
|------|----------|
| `src/app/api/campaigns/route.ts` | Aggiunto `addScraperJob()` dopo creazione |
| `src/services/scrapers/subito.ts` | Path `@/` → `../` |
| `src/services/proxy/manager.ts` | Path `@/` → `../../` |
| `src/workers/scraper-worker.ts` | Aggiunto scheduler + import `addScraperJob` |
| `package.json` | Worker script: `ts-node` → `tsx` |
| `prisma/seed.ts` | Aggiunto piano Dev + utente devuser |

### Comandi Utili

```bash
# Avviare i servizi
npm run dev &          # Next.js server
npm run worker &       # BullMQ worker + scheduler

# Verificare stato
redis-cli KEYS "bull:*"  # Job in coda
npx prisma studio        # Database GUI

# Riavvio pulito
pkill -f "next dev"; pkill -f "tsx.*worker"
npm run dev &
npm run worker &
```

### Stato Finale
- ✅ Job partono automaticamente alla creazione campagna
- ✅ Scheduler esegue job periodici ogni 60 secondi
- ✅ Worker processa job con proxy attivo
- ✅ Risultati salvati e visibili in UI
- ✅ Utente Dev disponibile per testing rapido (1 min frequenza)


