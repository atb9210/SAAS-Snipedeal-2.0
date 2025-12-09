# 004_2024-12-09_fix-scraping-logic-risultati.md

## Contesto
Dopo aver completato il fix del worker/scheduler (003), sono emersi problemi con la logica di scraping e visualizzazione risultati.

---

## Problemi Identificati

### 1. Scraping sempre 3 pagine
- **Problema**: Lo scraper usava sempre `maxPages: 3` anche per run successivi
- **Impatto**: Carico eccessivo, dati ridondanti

### 2. Widget "Nuovi" non si resettava
- **Problema**: Il contatore "50 nuovi" non si azzerava dopo visualizzazione
- **Causa**: Campo `isNew` non veniva aggiornato a `false`

### 3. Prezzo doppio €€
- **Problema**: I prezzi mostravano `€€ 350` invece di `€ 350`
- **Causa**: Il prezzo veniva formattato 2 volte (nello scraper e in `normalizePrice`)

### 4. Data pubblicazione mancante
- **Problema**: Non veniva salvata la data di pubblicazione dell'annuncio
- **Impatto**: Impossibile sapere quando l'annuncio è stato pubblicato su Subito

### 5. Ordinamento sbagliato
- **Problema**: URL senza `order=datedesc` → Subito ordinava per "rilevanza"
- **Impatto**: Lo scraper prendeva annunci vecchi invece dei più recenti

---

## Fix Implementati

### Fix 1: maxPages Dinamico
**File**: `src/workers/scraper-worker.ts`

```typescript
// Prima
const result = await scraper.scrape({ maxPages: 3 });

// Dopo
const maxPages = campaign.lastRunAt ? 1 : 3;
const result = await scraper.scrape({ maxPages });
```

**Logica**:
- Primo run (`lastRunAt: null`) → 3 pagine (popolare DB)
- Run successivi → 1 pagina (solo nuovi annunci)

---

### Fix 2: Reset isNew
**File**: `src/app/(dashboard)/campaigns/[id]/page.tsx`

```typescript
// Aggiunto prima del return
await prisma.result.updateMany({
  where: { 
    campaignId: params.id,
    isNew: true,
  },
  data: { isNew: false },
});
```

**Comportamento**: Quando l'utente apre la pagina della campagna, tutti i risultati vengono marcati come "visti".

---

### Fix 3: Prezzo Singolo €
**File**: `src/services/scrapers/subito.ts`

```typescript
// Prima (doppio €)
price = `€ ${item.features['/price'].values[0].value}`;

// Dopo (solo valore, normalizePrice aggiunge €)
price = String(item.features['/price'].values[0].value);
```

---

### Fix 4: Campo publishedAt
**File**: `prisma/schema.prisma`

```prisma
model Result {
  // ... altri campi
  publishedAt String?   // Data pubblicazione dal marketplace
}
```

**File**: `src/workers/scraper-worker.ts`

```typescript
const newResult = await prisma.result.create({
  data: {
    // ... altri campi
    publishedAt: ad.date || null,
  },
});
```

---

### Fix 5: Ordinamento per Data
**File**: `src/services/scrapers/subito.ts`

```typescript
// Prima
const params = new URLSearchParams({
  q: keyword,
});

// Dopo
const params = new URLSearchParams({
  q: keyword,
  order: 'datedesc', // Ordina per più recenti
});
```

**URL Risultante**:
```
https://www.subito.it/annunci-italia/vendita/usato/?q=iphone&order=datedesc
```

---

## Migrazione Database

```bash
npx prisma db push --accept-data-loss
```

Campo aggiunto: `Result.publishedAt`

---

## Verifica Fix

### Test maxPages
```
Job 1: 12:19:28 - Found: 90 (~3 pagine)  ← vecchio
Job 2: 12:20:34 - Found: 30 (~1 pagina)  ← FIX OK!
```

### Test isNew Reset
```
Prima di aprire campagna: isNew=true: 50
Dopo aver aperto:         isNew=true: 0  ✅
```

### Test Prezzo
```
Prima: €€ 350
Dopo:  € 350  ✅
```

### Test publishedAt
```
publishedAt: 2025-12-09 12:36:43  ✅
```

### Test Ordinamento
```
Risultati ultimi 2 min: 20/20
Pubblicati ultimi 10 min: 20/20  ✅
```

---

## Analisi Delay Scraping

### Breakdown del ritardo (~4-5 min):

| Fase | Tempo | Controllabile |
|------|-------|---------------|
| Delay Subito (indicizzazione) | ~3-4 min | ❌ |
| Nostro job (ogni 1 min) | 0-1 min | ✅ |
| Scraping (fetch + parse) | ~2-3 sec | ✅ |

**Conclusione**: Il delay principale è interno a Subito.it (indicizzazione/moderazione). Non riducibile ulteriormente.

---

## File Modificati

| File | Modifica |
|------|----------|
| `src/workers/scraper-worker.ts` | maxPages dinamico, salva publishedAt |
| `src/app/(dashboard)/campaigns/[id]/page.tsx` | Reset isNew su visualizzazione |
| `src/services/scrapers/subito.ts` | Fix prezzo, aggiunto order=datedesc |
| `prisma/schema.prisma` | Aggiunto campo publishedAt |

---

## Stato Finale

✅ **Scraping efficiente**: 1 pagina per run successivi
✅ **Widget "Nuovi" corretto**: Si resetta alla visualizzazione
✅ **Prezzi corretti**: Singolo simbolo €
✅ **Date pubblicazione**: Salvate nel DB
✅ **Ordinamento corretto**: Annunci più recenti prima
✅ **Delay analizzato**: ~4 min dovuto a Subito, non nostro

---

## Prossimi Step Suggeriti

1. Pagina risultati dedicata per utenti
2. Filtri avanzati sui risultati (prezzo, data, location)
3. Notifiche push per nuovi risultati
4. Supporto altri marketplace (eBay, Vinted, Wallapop)


