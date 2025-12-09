# 002 - Sistema Proxy Packetstream

**Data**: 2024-12-09  
**Task**: Implementazione sistema proxy globale per scraping  
**Stato**: ✅ Completato e Testato

---

## 1. Obiettivo

Implementare un sistema di proxy centralizzato, gestito dall'admin, trasparente agli utenti e **attivo per TUTTI gli utenti** (non solo Pro/Ultra). Il sistema deve essere estensibile per supportare altri provider proxy in futuro.

---

## 2. Requisiti Utente

- Proxy attivo globalmente per tutti gli utenti
- Utenti NON vedono/gestiscono impostazioni proxy
- Solo admin configura e testa i provider
- Sistema estensibile per futuri provider (BrightData, Oxylabs, etc.)
- Integrazione trasparente nello scraper esistente

---

## 3. Architettura Implementata

### 3.1 Schema Database (Prisma)

```prisma
model ProxyProvider {
  id          String   @id @default(cuid())
  name        String   @unique  // "packetstream", "brightdata", etc.
  displayName String   // "Packetstream"
  isEnabled   Boolean  @default(false)
  isDefault   Boolean  @default(false)
  config      Json     // { username, authKey, defaultCountry }
  usageLogs   ProxyUsageLog[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProxyUsageLog {
  id         String   @id @default(cuid())
  providerId String
  provider   ProxyProvider @relation(...)
  campaignId String?
  success    Boolean
  latencyMs  Int?
  ipUsed     String?
  country    String?
  error      String?  @db.Text
  createdAt  DateTime @default(now())
}
```

### 3.2 Service Layer

**Directory**: `src/services/proxy/`

| File | Descrizione |
|------|-------------|
| `base.ts` | Interfaces e types (ProxyProviderService, ProxyUrl, ProxyTestResult) |
| `packetstream.ts` | Implementazione provider Packetstream |
| `manager.ts` | ProxyManager singleton con round-robin e logging |
| `index.ts` | Exports |

**ProxyManager Features**:
- Singleton pattern
- Caricamento provider da DB
- Round-robin tra provider abilitati
- Test connessione
- Logging utilizzo
- Reload dinamico

### 3.3 API Routes

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/admin/proxy/providers` | GET | Lista provider configurati |
| `/api/admin/proxy/providers` | POST | Crea/aggiorna provider |
| `/api/admin/proxy/providers/[id]` | GET | Singolo provider |
| `/api/admin/proxy/providers/[id]` | PATCH | Aggiorna parziale |
| `/api/admin/proxy/providers/[id]` | DELETE | Elimina provider |
| `/api/admin/proxy/test` | GET | IP server (senza proxy) |
| `/api/admin/proxy/test` | POST | Test connessione provider |

### 3.4 UI Admin

**Pagina**: `/admin/proxy`

Features:
- Visualizzazione IP server (senza proxy)
- Lista provider configurati con stato
- Form aggiunta/modifica Packetstream
- Test connessione con risultato visivo
- Toggle abilita/disabilita
- Badge "Default"

### 3.5 Integrazione Scraper

**File**: `src/services/scrapers/subito.ts`

Modifiche:
- Import `getProxyManager`
- Ottenimento proxy all'inizio dello scrape
- `fetchWithProxy()` con supporto undici/curl
- Configurazione proxy per Playwright
- Logging utilizzo automatico

### 3.6 Worker BullMQ

**File**: `src/workers/scraper-worker.ts`

Modifiche:
- Import `getProxyManager`
- Inizializzazione proxy all'avvio
- Log stato proxy disponibile

---

## 4. Configurazione Packetstream

**Credenziali configurate**:
- Username: `zaro`
- Auth Key: `5a7bfb0070db1be4`
- Paese default: Italy
- Stato: ✅ Abilitato, Default

**Porte Packetstream**:
- HTTP: 31112
- SOCKS5: 31113
- Host: `proxy.packetstream.io`

**Formato URL**:
```
http://username:authKey_country-Italy@proxy.packetstream.io:31112
```

---

## 5. Test Eseguito

| Parametro | Valore |
|-----------|--------|
| IP Server (senza proxy) | 151.82.169.183 (Milan) |
| IP Proxy | 185.203.125.225 (Italy) |
| Latenza | 1162ms |
| Risultato | ✅ Successo |

---

## 6. Dipendenze Aggiunte

```json
{
  "undici": "^6.x"  // Per proxy HTTP in Node.js
}
```

---

## 7. File Creati/Modificati

### Nuovi file:
- `prisma/schema.prisma` (aggiunto ProxyProvider, ProxyUsageLog)
- `src/services/proxy/base.ts`
- `src/services/proxy/packetstream.ts`
- `src/services/proxy/manager.ts`
- `src/services/proxy/index.ts`
- `src/app/api/admin/proxy/providers/route.ts`
- `src/app/api/admin/proxy/providers/[id]/route.ts`
- `src/app/api/admin/proxy/test/route.ts`
- `src/app/admin/proxy/page.tsx`

### File modificati:
- `src/services/scrapers/subito.ts` (integrazione proxy)
- `src/workers/scraper-worker.ts` (init proxy)
- `src/app/admin/admin-sidebar.tsx` (link Proxy)

---

## 8. Estensibilità Futura

Per aggiungere un nuovo provider:

1. Creare `src/services/proxy/brightdata.ts`:
```typescript
export class BrightDataProvider implements ProxyProviderService {
  readonly name = 'brightdata';
  readonly displayName = 'BrightData';
  // implementare getProxyUrl(), testConnection(), validateConfig()
}
```

2. Registrare in `manager.ts`:
```typescript
const providerFactories = {
  packetstream: (config) => new PacketstreamProvider(config),
  brightdata: (config) => new BrightDataProvider(config),
};
```

3. Aggiungere alla lista supportedProviders nelle API

4. Aggiungere campi form specifici in UI

---

## 9. Flusso Operativo

```
[Admin configura Packetstream] 
         ↓
[ProxyProvider salvato in DB]
         ↓
[Utente avvia campagna]
         ↓
[Worker BullMQ processa job]
         ↓
[SubitoScraper.scrape() chiamato]
         ↓
[ProxyManager.getProxy() → ProxyUrl]
         ↓
[Fetch con proxy via undici/curl]
         ↓
[ProxyUsageLog salvato]
         ↓
[Risultati salvati senza esporre proxy]
```

---

## 10. Note Tecniche

- Il proxy è **trasparente** agli utenti - non vedono mai configurazioni
- In caso di proxy non disponibile, lo scraping procede senza proxy (con warning)
- I log di utilizzo permettono monitoraggio costi/performance
- Round-robin tra provider (utile con più provider in futuro)
- Credenziali proxy MAI esposte al client

---

## 11. Prossimi Passi Suggeriti

1. Implementare dashboard statistiche proxy (richieste/giorno, latenza media)
2. Aggiungere alerting se proxy fallisce ripetutamente
3. Implementare rotazione automatica IP (cambio country periodico)
4. Aggiungere altri provider (BrightData, Oxylabs)
5. Implementare caching risultati test


