# Integrazione Floppydata Webunlocker per Subito.it

**Data:** 2026-05-08  
**Scopo:** Documento per l'integrazione di Floppydata Webunlocker API per bypassare DataDome su Subito.it

---

## Panoramica

Floppydata Webunlocker è un servizio API che bypassa protezioni anti-bot come DataDome, permettendo di ottenere HTML completo da Subito.it.

**Risultati test:**
- ✅ Bypassa DataDome con successo
- ✅ 42 annunci trovati per ricerca "iphone"
- ✅ HTML completo: ~468 KB per pagina
- ✅ Costo: $0.0009 per request (~$0.89 per 1000 scrape)

---

## Configurazione API

### Endpoint
```
POST https://client-api.floppy.host/v1/webUnlocker
```

### Headers
```
Content-Type: application/json
X-Api-Key: YOUR_API_KEY
```

### Body Parameters
```json
{
  "url": "https://www.subito.it/annunci-italia/vendita/usato/?q=iphone&order=datedesc",
  "country": "IT",
  "difficulty": "low",
  "expiration": 0
}
```

**Parametri:**
- `url` (required): Target page URL
- `country` (optional): 2-letter country code (es. "IT")
- `city` (optional): City name from geonames.org
- `difficulty` (optional): "low" o "medium" (default: "low")
- `expiration` (optional): Cache age in days, 0 = no cache

### Response
```json
{
  "html": "<string>"
}
```

---

## Esempio di Codice

### Basic Request
```typescript
async function fetchSubitoWithFloppydata(keyword: string, region?: string): Promise<string | null> {
  const apiKey = process.env.FLOPPYDATA_API_KEY;
  const url = `https://www.subito.it/annunci-italia/vendita/usato/?q=${keyword}&order=datedesc`;

  const response = await fetch('https://client-api.floppy.host/v1/webUnlocker', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      url: url,
      country: 'IT',
      difficulty: 'low',
      expiration: 0,
    }),
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  return data.html;
}
```

### Parsing HTML
```typescript
interface SubitoAd {
  subject: string;
  price?: string;
  url?: string;
  location?: string;
  date?: string;
}

function parseSubitoHtml(html: string): SubitoAd[] {
  const ads: SubitoAd[] = [];

  // Extract subjects
  const subjectMatches = html.match(/"subject":"([^"]*)"/g);
  if (!subjectMatches) return ads;

  // Extract prices
  const priceMatches = html.match(/"price":\s*\{[^}]*"value":\s*"([^"]*)"/g);

  // Extract URLs
  const urlMatches = html.match(/"default":"(https:\/\/www\.subito\.it\/[^"]*)"/g);

  // Combine data
  for (let i = 0; i < subjectMatches.length; i++) {
    const subject = subjectMatches[i].match(/"subject":"([^"]*)"/)?.[1];
    const price = priceMatches?.[i]?.match(/"value":\s*"([^"]*)"/)?.[1];
    const url = urlMatches?.[i]?.match(/"default":"([^"]*)"/)?.[1];

    if (subject) {
      ads.push({
        subject,
        price,
        url,
      });
    }
  }

  return ads;
}
```

---

## Integrazione nello Scraper Esistente

### Opzione 1: Wrapper Service
Creare un nuovo servizio `floppydata.ts`:

```typescript
// src/services/floppydata.ts
export class FloppydataService {
  private apiKey: string;
  private baseUrl = 'https://client-api.floppy.host/v1/webUnlocker';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchPage(url: string, country: string = 'IT'): Promise<string | null> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        url,
        country,
        difficulty: 'low',
        expiration: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Floppydata API error: ${response.status}`);
    }

    const data = await response.json();
    return data.html;
  }
}
```

### Opzione 2: Modificare SubitoScraper
Aggiungere metodo per usare Floppydata come primary:

```typescript
// src/services/scrapers/subito.ts
private async scrapeViaFloppydata(
  keyword: string, 
  region: string | null | undefined, 
  maxPages: number
): Promise<{ ads: ScrapedAd[] }> {
  const ads: ScrapedAd[] = [];
  const floppydataService = new FloppydataService(process.env.FLOPPYDATA_API_KEY!);

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = this.buildUrl(keyword, region, page);
      this.log(`Fetching page ${page} via Floppydata...`);

      const html = await floppydataService.fetchPage(url);

      if (!html) {
        this.log(`Failed to fetch page ${page}`, 'warn');
        continue;
      }

      const pageAds = this.parseSubitoHtml(html);
      this.log(`Page ${page}: found ${pageAds.length} ads`);
      ads.push(...pageAds);

    } catch (error) {
      this.log(`Error on page ${page}: ${error}`, 'warn');
    }
  }

  return { ads };
}
```

---

## Environment Variables

Aggiungere a `.env.local`:
```
FLOPPYDATA_API_KEY=bniEz9eGfe1xtwtjXNLWBkWMtkQPHqQE
```

---

## Pricing

| Plan | Costo | Requests |
|------|-------|----------|
| 10k scrape | $9 | 10,000 |
| 100k scrape | $89 | 100,000 |

**Costo per request:** $0.0009  
**Costo per 1000 scrape:** $0.89

---

## Error Handling

### Common Errors
```typescript
try {
  const html = await floppydataService.fetchPage(url);
} catch (error) {
  if (error.message.includes('401')) {
    // Invalid API key
    console.error('Invalid Floppydata API key');
  } else if (error.message.includes('429')) {
    // Rate limit exceeded
    console.error('Floppydata rate limit exceeded');
  } else if (error.message.includes('402')) {
    // Insufficient balance
    console.error('Floppydata insufficient balance');
  } else {
    // Other errors
    console.error('Floppydata error:', error);
  }
}
```

### Fallback Strategy
```typescript
async function scrapeWithFallback(keyword: string, region?: string) {
  try {
    // Try Floppydata first
    const html = await fetchSubitoWithFloppydata(keyword, region);
    if (html) {
      return parseSubitoHtml(html);
    }
  } catch (error) {
    console.warn('Floppydata failed, trying fallback:', error);
  }

  // Fallback to existing methods
  return await existingScraper.scrape({ keyword, region });
}
```

---

## Testing

### Unit Test
```typescript
describe('FloppydataService', () => {
  it('should fetch Subito page', async () => {
    const service = new FloppydataService(process.env.FLOPPYDATA_API_KEY!);
    const html = await service.fetchPage('https://www.subito.it/annunci-italia/vendita/usato/?q=iphone');
    
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(100000);
    expect(html.includes('__NEXT_DATA__')).toBe(true);
  });
});
```

### Integration Test
```typescript
describe('SubitoScraper with Floppydata', () => {
  it('should scrape iPhone ads', async () => {
    const scraper = new SubitoScraper();
    const result = await scraper.scrape({
      keyword: 'iphone',
      maxPages: 1,
    });
    
    expect(result.success).toBe(true);
    expect(result.ads.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Considerations

1. **Cache:** Floppydata ha cache integrata (parametro `expiration`)
   - `expiration: 0` = no cache (sempre fresco)
   - `expiration: 1` = cache 1 giorno

2. **Rate Limiting:** Rispettare i limiti dell'API
   - Implementare retry con exponential backoff
   - Monitorare usage balance

3. **Cost Monitoring:** Tracciare usage per evitare costi imprevisti
   - Implementare logging delle request
   - Monitorare balance API

---

## Next Steps per Refactor

1. **Creare servizio Floppydata dedicato**
   - `src/services/floppydata.ts`
   - Implementare error handling
   - Aggiungere rate limiting client-side

2. **Modificare SubitoScraper**
   - Aggiungere metodo `scrapeViaFloppydata`
   - Usare Floppydata come primary method
   - Mantenere fallback esistente

3. **Aggiungere monitoring**
   - Log delle request Floppydata
   - Monitorare costi
   - Alert per errori API

4. **Testing completo**
   - Unit tests per FloppydataService
   - Integration tests per SubitoScraper
   - Load testing per performance

5. **Deployment**
   - Aggiungere env var a produzione
   - Configurare monitoring
   - Documentare processo

---

## Note Importanti

- Floppydata webunlocker ha dimostrato di funzionare per Subito.it
- Non testato ancora su eBay (potrebbe funzionare anche lì)
- Costo competitivo rispetto a soluzioni alternative
- Richiede refactor dello scraper esistente
- Monitorare costi in produzione
