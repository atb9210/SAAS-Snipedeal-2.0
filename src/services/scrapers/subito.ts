// src/services/scrapers/subito.ts - Scraper Subito.it
// Port da PHP a TypeScript
// Timestamp: 2024-12-09

import { chromium, Browser } from 'playwright';
import { BaseScraper, ScrapeOptions, ScrapeResult, ScrapedAd } from './base';
import { getProxyManager, ProxyUrl } from '../proxy';

// Mappa regioni italiane -> URL Subito.it
const REGION_URL_MAP: Record<string, string> = {
  'Piemonte': 'piemonte',
  'Valle d\'Aosta': 'valle-d-aosta',
  'Lombardia': 'lombardia',
  'Trentino-Alto Adige': 'trentino-alto-adige',
  'Veneto': 'veneto',
  'Friuli-Venezia Giulia': 'friuli-venezia-giulia',
  'Liguria': 'liguria',
  'Emilia-Romagna': 'emilia-romagna',
  'Toscana': 'toscana',
  'Umbria': 'umbria',
  'Marche': 'marche',
  'Lazio': 'lazio',
  'Abruzzo': 'abruzzo',
  'Molise': 'molise',
  'Campania': 'campania',
  'Puglia': 'puglia',
  'Basilicata': 'basilicata',
  'Calabria': 'calabria',
  'Sicilia': 'sicilia',
  'Sardegna': 'sardegna',
};

export class SubitoScraper extends BaseScraper {
  private browser: Browser | null = null;
  private proxy: ProxyUrl | null = null;
  private proxyProviderId: string | null = null;

  constructor() {
    super('SubitoScraper', 'https://www.subito.it');
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const { keyword, minPrice, maxPrice, region, maxPages = 3 } = options;
    
    this.log(`Starting scrape for: "${keyword}"${region ? ` in ${region}` : ''}`);

    // Ottieni proxy dal ProxyManager (GLOBALE per tutti gli utenti)
    try {
      const proxyManager = getProxyManager();
      this.proxy = await proxyManager.getProxy('Italy', true);
      
      if (this.proxy) {
        this.log(`Using proxy: ${this.proxy.host}:${this.proxy.port}`);
        // Salva provider ID per logging
        const providers = await proxyManager['providers'];
        this.proxyProviderId = providers?.keys().next().value || null;
      } else {
        this.log('No proxy available, scraping without proxy', 'warn');
      }
    } catch (proxyError) {
      this.log(`Proxy error: ${proxyError}, continuing without proxy`, 'warn');
      this.proxy = null;
    }

    try {
      // Prima prova scraping HTTP (più veloce)
      const httpResult = await this.scrapeViaHttp(keyword, region, maxPages);
      
      if (httpResult.ads.length > 0) {
        // Filtra per prezzo
        const filteredAds = httpResult.ads.filter(ad => 
          this.matchesPriceFilter(ad.price, minPrice, maxPrice)
        );

        this.log(`Found ${filteredAds.length} ads (filtered from ${httpResult.ads.length})`);
        
        return {
          success: true,
          ads: filteredAds,
          totalFound: filteredAds.length,
          scrapedAt: new Date(),
        };
      }

      // Fallback: prova con Playwright (browser headless)
      this.log('HTTP scraping returned no results, trying Playwright...');
      const playwrightResult = await this.scrapeViaPlaywright(keyword, region, maxPages);
      
      const filteredAds = playwrightResult.ads.filter(ad => 
        this.matchesPriceFilter(ad.price, minPrice, maxPrice)
      );

      return {
        success: true,
        ads: filteredAds,
        totalFound: filteredAds.length,
        scrapedAt: new Date(),
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Scraping failed: ${errorMessage}`, 'error');
      
      return {
        success: false,
        ads: [],
        totalFound: 0,
        error: errorMessage,
        scrapedAt: new Date(),
      };
    } finally {
      await this.closeBrowser();
    }
  }

  private async scrapeViaHttp(
    keyword: string, 
    region: string | null | undefined, 
    maxPages: number
  ): Promise<{ ads: ScrapedAd[] }> {
    const ads: ScrapedAd[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = this.buildUrl(keyword, region, page);
        this.log(`Fetching page ${page}: ${url}`);

        const html = await this.fetchWithProxy(url);

        if (!html) {
          this.log(`Failed to fetch page ${page}`, 'warn');
          continue;
        }

        const pageAds = this.parseNextJsData(html);
        
        this.log(`Page ${page}: found ${pageAds.length} ads`);
        ads.push(...pageAds);

      } catch (error) {
        this.log(`Error on page ${page}: ${error}`, 'warn');
      }
    }

    return { ads };
  }

  /**
   * Fetch URL con proxy (se disponibile)
   */
  private async fetchWithProxy(url: string): Promise<string | null> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
    };

    const startTime = Date.now();

    try {
      if (this.proxy) {
        // Usa undici con ProxyAgent se disponibile
        try {
          const { ProxyAgent, fetch: undiciFetch } = await import('undici');
          const proxyAgent = new ProxyAgent(this.proxy.url);
          
          const response = await undiciFetch(url, {
            dispatcher: proxyAgent,
            headers,
          });

          if (!response.ok) {
            this.log(`HTTP ${response.status} via proxy`, 'warn');
            return null;
          }

          // Log successo proxy
          await this.logProxyUsage(true, Date.now() - startTime);
          
          return await response.text();
        } catch (undiciError) {
          // Fallback: usa curl con proxy
          this.log(`Undici failed, trying curl: ${undiciError}`, 'warn');
          return this.fetchWithCurl(url, this.proxy.url);
        }
      } else {
        // Senza proxy: fetch normale
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          this.log(`HTTP ${response.status}`, 'warn');
          return null;
        }

        return await response.text();
      }
    } catch (error) {
      this.log(`Fetch error: ${error}`, 'error');
      await this.logProxyUsage(false, Date.now() - startTime, String(error));
      return null;
    }
  }

  /**
   * Fallback: usa curl per fetch con proxy
   */
  private async fetchWithCurl(url: string, proxyUrl: string): Promise<string | null> {
    try {
      const { execSync } = await import('child_process');
      
      const result = execSync(
        `curl -s -x "${proxyUrl}" "${url}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" --max-time 30`,
        { encoding: 'utf-8', timeout: 35000 }
      );
      
      return result;
    } catch (error) {
      this.log(`Curl failed: ${error}`, 'error');
      return null;
    }
  }

  /**
   * Log utilizzo proxy
   */
  private async logProxyUsage(success: boolean, latencyMs: number, error?: string): Promise<void> {
    if (!this.proxyProviderId) return;

    try {
      const proxyManager = getProxyManager();
      await proxyManager.logUsage(
        this.proxyProviderId,
        success,
        undefined, // campaignId viene passato dal worker
        latencyMs,
        undefined, // ipUsed
        'Italy',
        error
      );
    } catch {
      // Ignore logging errors
    }
  }

  private async scrapeViaPlaywright(
    keyword: string, 
    region: string | null | undefined, 
    maxPages: number
  ): Promise<{ ads: ScrapedAd[] }> {
    const ads: ScrapedAd[] = [];

    try {
      // Configura proxy per Playwright se disponibile
      const launchOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };

      if (this.proxy) {
        launchOptions.proxy = {
          server: `${this.proxy.protocol}://${this.proxy.host}:${this.proxy.port}`,
        };
        
        // Estrai username:password dall'URL proxy
        const proxyUrlMatch = this.proxy.url.match(/\/\/([^:]+):([^@]+)@/);
        if (proxyUrlMatch) {
          launchOptions.proxy.username = proxyUrlMatch[1];
          launchOptions.proxy.password = proxyUrlMatch[2];
        }
        
        this.log(`Playwright using proxy: ${this.proxy.host}:${this.proxy.port}`);
      }

      this.browser = await chromium.launch(launchOptions);

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'it-IT',
      });

      const page = await context.newPage();

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = this.buildUrl(keyword, region, pageNum);
        this.log(`Playwright: loading page ${pageNum}`);

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for content
        await page.waitForSelector('body', { timeout: 10000 });

        const html = await page.content();
        const pageAds = this.parseNextJsData(html);
        
        this.log(`Playwright page ${pageNum}: found ${pageAds.length} ads`);
        ads.push(...pageAds);

        // Small delay between pages
        if (pageNum < maxPages) {
          await page.waitForTimeout(1000);
        }
      }

      await context.close();

    } catch (error) {
      this.log(`Playwright error: ${error}`, 'error');
    }

    return { ads };
  }

  private buildUrl(keyword: string, region: string | null | undefined, page: number): string {
    let baseUrl = 'https://www.subito.it/annunci-italia/vendita/usato/';
    
    // Use region-specific URL if provided
    if (region && REGION_URL_MAP[region]) {
      const regionSlug = REGION_URL_MAP[region];
      baseUrl = `https://www.subito.it/annunci-${regionSlug}/vendita/usato/`;
    }

    const params = new URLSearchParams({
      q: keyword,
      order: 'datedesc', // Ordina per più recenti (IMPORTANTE!)
    });

    if (page > 1) {
      params.set('o', page.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private parseNextJsData(html: string): ScrapedAd[] {
    const ads: ScrapedAd[] = [];

    try {
      // Extract __NEXT_DATA__ JSON (Subito.it uses Next.js)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      
      if (!nextDataMatch) {
        this.log('No __NEXT_DATA__ found in HTML', 'warn');
        return ads;
      }

      const jsonData = JSON.parse(nextDataMatch[1]);
      
      // Navigate to items list
      let itemsList: any[] = [];
      
      // Path 1: props.pageProps.initialState.items.list
      if (jsonData?.props?.pageProps?.initialState?.items?.list) {
        itemsList = jsonData.props.pageProps.initialState.items.list;
      }
      // Path 2: Try to find recursively
      else {
        itemsList = this.findInObject(jsonData, 'list') || [];
      }

      for (const listItem of itemsList) {
        const item = listItem.item || listItem;
        
        // Skip non-ad items
        if (item.kind !== 'AdItem' && !item.subject) continue;

        // Extract price (solo il valore numerico, normalizePrice aggiungerà €)
        let price: string | null = null;
        if (item.features?.['/price']?.values?.[0]?.value) {
          price = String(item.features['/price'].values[0].value);
        }

        // Extract location
        let location = '';
        if (item.geo?.town?.value) {
          location = item.geo.town.value;
        }
        if (item.geo?.city?.shortName) {
          location += ` (${item.geo.city.shortName})`;
        }

        // Extract image
        let image: string | null = null;
        if (item.images?.[0]?.cdnBaseUrl) {
          image = item.images[0].cdnBaseUrl;
        }

        // Check shipping
        const hasShipping = item.features?.['/item_shippable']?.values?.[0]?.key === '1';

        ads.push({
          title: item.subject || 'Senza titolo',
          price: this.normalizePrice(price),
          location: location.trim() || null,
          link: item.urls?.default || '',
          image,
          status: 'available',
          hasShipping,
          date: item.date || null,
        });
      }

    } catch (error) {
      this.log(`Error parsing Next.js data: ${error}`, 'error');
    }

    return ads;
  }

  private findInObject(obj: any, key: string): any[] | null {
    if (!obj || typeof obj !== 'object') return null;

    if (Array.isArray(obj[key])) {
      return obj[key];
    }

    for (const value of Object.values(obj)) {
      if (typeof value === 'object') {
        const result = this.findInObject(value, key);
        if (result) return result;
      }
    }

    return null;
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Factory function
export function createSubitoScraper(): SubitoScraper {
  return new SubitoScraper();
}

