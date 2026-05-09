# Sessione Debugging Scraping 404/403 Errors - Riepilogo Completo
**Data:** 8 Maggio 2026  
**Obiettivo:** Debug e risoluzione errori 403/404 nello scraping delle campagne

## Obiettivo Principale
Il problema principale era che le campagne di scraping restituivano 0 risultati, specificamente con errori 403 localmente (dovuti a protezioni anti-bot) e 404 in deployment. L'obiettivo immediato era testare se l'uso di un browser reale (Playwright) localmente potesse bypassare gli errori 403 riscontrati con richieste HTTP.

## File Creati/Modificati

### File Creati
1. **tests/check-campaigns.ts** - Script per verificare lo stato delle campagne e job logs
2. **tests/test-scraper.ts** - Test generico dello scraper
3. **tests/disable-proxy.ts** - Script per disabilitare proxy nel database
4. **tests/check-proxy.ts** - Script per verificare proxy nel database
5. **tests/enable-proxy.ts** - Script per abilitare proxy nel database
6. **tests/test-url.ts** - Test generazione URL e fetch manuale
7. **tests/test-ebay-scraper.ts** - Test individuale scraper eBay
8. **tests/test-subito-scraper.ts** - Test individuale scraper Subito
9. **tests/test-proxy-ip.ts** - Test rotazione IP proxy
10. **tests/test-subito-improved.ts** - Test scraper Subito migliorato con User-Agent rotation
11. **tests/test-playwright-debug.ts** - Test debug Playwright in headful mode
12. **tests/test-cloudflare-browser.ts** - Test Cloudflare Browser Run API
13. **tests/test-chromium-manual.ts** - Test Chromium headful per interazione manuale
14. **tests/test-subito-stealth.ts** - Test scraper Subito con stealth mode

### File Modificati
1. **.env.local** - Configurato per usare database cloud (MySQL e Redis)
2. **.env** - Configurato per usare database cloud
3. **src/services/scrapers/subito.ts** - Modificato per usare Playwright headful, poi rebrowser-playwright + stealth
4. **src/services/scrapers/ebay.ts** - Modificato per usare got-scraping

### File Letti
- prisma/schema.prisma
- src/workers/scraper-worker.ts
- src/services/proxy/packetstream.ts
- package.json
- env.local.example

## Prove Eseguite in Ordine Cronologico

### Fase 1: Setup Iniziale
1. **Verifica connettività database** - ✅ Completato
   - MySQL cloud: OK
   - Redis cloud: OK
2. **Configurazione ambiente locale** - ✅ Completato
   - Modificati .env e .env.local per usare database cloud
3. **Avvio app locale** - ✅ Completato
   - Fix SWC binary loading issue
   - Fix schema database (User.isActive mancante)
   - Test autenticazione OK

### Fase 2: Debug Worker
4. **Check worker status e logs** - ✅ Completato
   - Worker crashava con errore esbuild
5. **Fix worker esbuild error** - ✅ Completato
   - Modificato tsconfig.worker.json per esbuild

### Fase 3: Test Scraping Base
6. **Test scraper senza proxy** - ✅ Completato
   - Subito: HTTP 403
   - eBay: HTTP 403
7. **Check proxy credentials** - ✅ Completato
   - Proxy Packetstream configurato correttamente
8. **Test scraper con proxy** - ✅ Completato
   - Subito: HTTP 403 (proxy non aiuta)
   - eBay: HTTP 403 (proxy non aiuta)
9. **Test URL generation e fetch manuale** - ✅ Completato
   - URL generati correttamente
   - Fetch manuale: HTTP 403

### Fase 4: Test Proxy
10. **Test rotazione IP proxy** - ✅ Completato
    - Packetstream fornisce IP rotanti
    - Ma IP sono probabilmente blacklistati

### Fase 5: User-Agent Rotation
11. **Test Subito scraper migliorato con User-Agent rotation** - ✅ Completato
    - Multiple User-Agents testati
    - Tutti bloccati con HTTP 403

### Fase 6: Playwright Testing
12. **Install Playwright browsers** - ✅ Completato
13. **Test Subito scraper con Playwright fallback** - ✅ Completato
    - Playwright non installato inizialmente
    - Dopo installazione: ancora bloccato
14. **Test Playwright headful mode** - ✅ Completato
    - Headful mode bypassa DataDome in test debug
    - Ma non funziona nello scraper automatizzato

### Fase 7: Cloudflare Browser Run
15. **Test Cloudflare Browser Run su Subito** - ✅ Completato
    - Screenshot: OK
    - Content fetch: HTTP 429 (rate limit)
16. **Test Cloudflare Browser Run su Google/eBay** - ✅ Completato
    - Google: OK
    - eBay: HTTP 429 (rate limit)

### Fase 8: Analisi DataDome
17. **Test manuale Chromium headful su Subito** - ✅ Completato
    - Browser manuale funziona
    - Browser automatizzato bloccato da DataDome
    - DataDome rileva comportamento automatizzato, non IP

### Fase 9: Multi-step Navigation
18. **Test navigazione eBay→Subito** - ✅ Completato
    - Chromium headful aperto su eBay
    - Navigazione manuale a Subito: funziona
    - Ma non soluzione scalabile per scraping automatizzato

### Fase 10: Stealth Mode
19. **Install rebrowser-playwright + playwright-extra + stealth** - ✅ Completato
20. **Modifica Subito scraper con stealth + human-like behavior** - ✅ Completato
    - rebrowser-playwright
    - puppeteer-extra-plugin-stealth
    - Random viewport, locale italiano
    - Mouse movements, scroll, delays
    - Navigazione Google prima di Subito
21. **Test stealth scraper senza proxy** - ✅ Completato
    - ANCORA BLOCCATO DA CAPTCHA
22. **Test stealth scraper con proxy** - ✅ Completato
    - Timeout error (proxy troppo lento)

### Fase 11: TLS-Coherent HTTP Client
23. **Install got-scraping** - ✅ Completato
24. **Modifica eBay scraper per usare got-scraping** - ✅ Completato
    - TLS fingerprinting coerente con Chrome
    - Header HTTP/2 coerenti
25. **Test eBay scraper con got-scraping + proxy** - ✅ Completato
    - HTTP 403
26. **Test eBay scraper con got-scraping senza proxy** - ✅ Completato
    - HTTP 403

### Fase 12: eBay Playwright Headful (Post-Reset)
27. **Reset repository all'ultimo commit** - ✅ Completato
    - Rimosse tutte le modifiche
    - Mantenuto solo riepilogo markdown
28. **Test eBay Playwright headful isolato (networkidle)** - ✅ Completato
    - eBay caricato visivamente
    - Timeout su networkidle (risorse bloccate/lente)
29. **Fix test con domcontentloaded** - ✅ Completato
30. **Test eBay Playwright headful - Access Denied** - ✅ Completato
    - Akamai/Edgecast blocking (rate limiting dopo primo test)
    - Protezioni avanzate rilevano automazione

### Fase 13: Floppydata Webunlocker Test
31. **Test Floppydata webunlocker su Subito** - ✅ Completato
    - API URL corretto: https://client-api.floppy.host/v1/webUnlocker
    - Ricevuto HTML completo di Subito.it (479820 bytes)
    - DataDome bypassato con successo
    - **42 annunci trovati** (iPhone 6, iPhone 16 256gb, iPhone 12 Pro, ecc.)
    - Dati strutturati presenti
    - **SCOPERTA: Floppydata webunlocker FUNZIONA per Subito.it!**
    - Costo: $0.0009 per request (~$0.89 per 1000 scrape)

## Risultati Completi

### Subito.it
- ✗ HTTP requests (con/ senza proxy)
- ✗ Playwright headless
- ✗ Playwright headful automatizzato
- ✗ Cloudflare Browser Run
- ✗ Stealth mode + human behavior (con/ senza proxy)
- ✓ Browser manuale (ma non scalabile)
- ✓ **Floppydata webunlocker - FUNZIONA!** (DataDome bypassato)

**Bloccato da:** DataDome - protezione anti-bot avanzata che rileva:
- navigator.webdriver
- Canvas/WebGL fingerprint
- Mouse/keyboard patterns
- TLS/JA4 fingerprint
- Browser fingerprinting completo

### eBay
- ✗ HTTP requests standard
- ✗ HTTP requests con proxy
- ✗ got-scraping TLS-coherent (con/ senza proxy)
- ✗ Playwright headful (Access Denied - Akamai/Edgecast)
- ✓ Browser manuale Chromium headful

**Bloccato da:** Protezioni anti-bot Akamai/Edgecast - rileva anche browser headful automatizzato

## Conclusioni

### Soluzioni Testate
1. ✗ HTTP requests con User-Agent rotation
2. ✗ Proxy residenziale (Packetstream)
3. ✗ Playwright headless
4. ✗ Playwright headful automatizzato
5. ✗ Cloudflare Browser Run
6. ✗ Stealth mode (rebrowser-playwright + puppeteer-extra-plugin-stealth)
7. ✗ Human-like behavior (mouse movements, scroll, delays)
8. ✗ TLS-coherent HTTP client (got-scraping)
9. ✓ **Floppydata webunlocker - FUNZIONA per Subito.it!**

### Motivo del Fallimento
DataDome (Subito) e protezioni eBay sono troppo avanzate per soluzioni standard. Rilevano:
- Fingerprinting a livello browser
- Comportamento automatizzato
- TLS/JA4 fingerprint
- Canvas/WebGL fingerprint
- Mouse/keyboard patterns
- JavaScript execution patterns

### Opzioni Rimanenti

#### Opzione 1: Floppydata Webunlocker (SCOPERTA RECENTE)
- Costo: Da verificare
- Funzionalità: Bypassa DataDome su Subito.it
- Pro: Funziona per Subito.it, HTML completo con tutti i dati
- Contro: Costo da verificare, non testato su eBay

#### Opzione 2: CAPTCHA Solver (CapSolver)
- Costo: ~$1.5-3 per 1000 risoluzioni
- Funzionalità: Rileva CAPTCHA automaticamente e delega a servizio esterno
- Pro: Costo minimo, funzionale
- Contro: Richiede integrazione, dipendenza da servizio esterno

#### Opzione 3: Cookie Warming Manuale
- Costo: Gratuito
- Funzionalità: Estrai datadome cookie da browser manuale, inietta in Playwright
- Pro: Gratis, funziona
- Contro: Richiede interazione manuale periodica, non scalabile

#### Opzione 4: API Gestite (ZenRows/Scrapfly)
- Costo: ~$49/mese
- Funzionalità: Gestiscono tutto internamente (CAPTCHA, fingerprinting, proxy)
- Pro: Soluzione completa, zero manutenzione
- Contro: Costo mensile

#### Opzione 5: Rinunciare a Subito/eBay
- Costo: 0
- Funzionalità: Concentrarsi su altre piattaforme meno protette
- Pro: Nessun costo
- Contro: Perdita di due marketplace importanti

## Raccomandazione

Considerando i risultati dei test, le opzioni più realistiche sono:

1. **Prima opzione (SCOPERTA):** Implementare Floppydata webunlocker per Subito.it
   - Funziona già testato
   - Bypassa DataDome con successo
   - HTML completo con tutti i dati
   - Costo da verificare

2. **Breve termine:** Implementare CAPTCHA solver (CapSolver) se Floppydata non è disponibile
3. **Lungo termine:** Valutare API gestite (ZenRows) se il volume giustifica il costo
4. **Alternativa:** Cercare altre piattaforme con protezioni meno aggressive

## Dipendenze Aggiunte
- playwright-extra
- puppeteer-extra-plugin-stealth
- rebrowser-playwright
- puppeteer
- got-scraping

## Note Importanti
- Il proxy Packetstream fornisce IP rotanti ma molti sono blacklistati
- DataDome non rileva solo l'IP, ma il fingerprint completo del browser
- Il comportamento umano (mouse, scroll) non è sufficiente a bypassare DataDome
- Le protezioni 2026 sono molto più avanzate rispetto al 2024
- Le soluzioni standard (HTTP requests, Playwright base) non funzionano più
