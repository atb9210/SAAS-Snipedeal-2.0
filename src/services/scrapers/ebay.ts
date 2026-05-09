// src/services/scrapers/ebay.ts - Scraper eBay Italia
// Timestamp: 2024-12-15

import { BaseScraper, ScrapeOptions, ScrapeResult, ScrapedAd } from './base';
import { getProxyManager, ProxyUrl } from '../proxy';
import { FloppydataProvider } from '../proxy/floppydata';

// Mappa provenienza -> parametro LH_PrefLoc
const LOCATION_MAP: Record<string, string> = {
  'IT': '1',   // Italia
  'EU': '3',   // Unione Europea
};

export class EbayScraper extends BaseScraper {
  private proxy: ProxyUrl | null = null;
  private proxyProviderId: string | null = null;

  constructor() {
    super('EbayScraper', 'https://www.ebay.it');
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const { keyword, minPrice, maxPrice, region, maxPages = 1 } = options;
    // region viene usato per la provenienza: 'IT', 'EU', o vuoto
    const location = region || '';
    
    this.log(`Starting scrape for: "${keyword}"${location ? ` from ${location}` : ''}`);

    // Ottieni proxy dal ProxyManager
    try {
      const proxyManager = getProxyManager();
      this.proxy = await proxyManager.getProxy('Italy', true);
      
      if (this.proxy) {
        this.log(`Using proxy: ${this.proxy.host}:${this.proxy.port}`);
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
      // Prima prova scraping con Floppydata (primary - bypassa anti-bot)
      this.log('Trying Floppydata Webunlocker...');
      const floppydataResult = await this.scrapeViaFloppydata(keyword, location, maxPages);

      if (floppydataResult.ads.length > 0) {
        // Filtra per prezzo
        const filteredAds = floppydataResult.ads.filter(ad =>
          this.matchesPriceFilter(ad.price, minPrice, maxPrice)
        );

        this.log(`Floppydata: Found ${filteredAds.length} ads (filtered from ${floppydataResult.ads.length})`);

        return {
          success: true,
          ads: filteredAds,
          totalFound: filteredAds.length,
          scrapedAt: new Date(),
        };
      }

      // Fallback: prova scraping HTTP con proxy
      this.log('Floppydata returned no results, trying HTTP with proxy...');
      const allAds: ScrapedAd[] = [];

      for (let page = 1; page <= maxPages; page++) {
        const url = this.buildUrl(keyword, location, page);
        this.log(`Fetching page ${page}: ${url}`);

        const html = await this.fetchWithProxy(url);

        if (!html) {
          this.log(`Failed to fetch page ${page}`, 'warn');
          continue;
        }

        const pageAds = this.parseEbayHtml(html);
        this.log(`Page ${page}: found ${pageAds.length} ads`);
        allAds.push(...pageAds);
      }

      // Filtra per prezzo
      const filteredAds = allAds.filter(ad =>
        this.matchesPriceFilter(ad.price, minPrice, maxPrice)
      );

      this.log(`HTTP: Found ${filteredAds.length} ads (filtered from ${allAds.length})`);

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
    }
  }

  private buildUrl(keyword: string, location: string, page: number): string {
    const params = new URLSearchParams({
      _nkw: keyword,
      rt: 'nc',
      LH_BIN: '1',           // Solo Compralo Subito
      LH_ItemCondition: '4', // Solo Usato
      LH_SellerType: '1',    // Solo Venditori Privati
      _sop: '10',            // Ordina per più recenti
    });

    // Filtro provenienza
    if (location && LOCATION_MAP[location]) {
      params.set('LH_PrefLoc', LOCATION_MAP[location]);
    }

    // Paginazione eBay
    if (page > 1) {
      params.set('_pgn', page.toString());
    }

    return `https://www.ebay.it/sch/i.html?${params.toString()}`;
  }

  private async scrapeViaFloppydata(
    keyword: string,
    location: string,
    maxPages: number
  ): Promise<{ ads: ScrapedAd[] }> {
    const ads: ScrapedAd[] = [];

    try {
      const proxyManager = getProxyManager();
      await proxyManager.initialize();

      // Ottieni provider Floppydata per nome
      const floppydataProvider = proxyManager.getProviderByName('floppydata') as FloppydataProvider;

      if (!floppydataProvider) {
        this.log('Floppydata provider not found', 'warn');
        return { ads };
      }

      for (let page = 1; page <= maxPages; page++) {
        try {
          const url = this.buildUrl(keyword, location, page);
          this.log(`Floppydata: fetching page ${page}`);

          const html = await floppydataProvider.fetchHtml(url, 'IT');

          if (!html) {
            this.log(`Floppydata failed on page ${page}`, 'warn');
            continue;
          }

          const pageAds = this.parseEbayHtml(html);

          this.log(`Floppydata page ${page}: found ${pageAds.length} ads`);
          ads.push(...pageAds);

        } catch (error) {
          this.log(`Floppydata error on page ${page}: ${error}`, 'warn');
        }
      }

    } catch (error) {
      this.log(`Floppydata provider error: ${error}`, 'warn');
    }

    return { ads };
  }

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

          await this.logProxyUsage(true, Date.now() - startTime);
          return await response.text();
        } catch (undiciError) {
          this.log(`Undici failed, trying curl: ${undiciError}`, 'warn');
          return this.fetchWithCurl(url, this.proxy.url);
        }
      } else {
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

  private async logProxyUsage(success: boolean, latencyMs: number, error?: string): Promise<void> {
    if (!this.proxyProviderId) return;

    try {
      const proxyManager = getProxyManager();
      await proxyManager.logUsage(
        this.proxyProviderId,
        success,
        undefined,
        latencyMs,
        undefined,
        'Italy',
        error
      );
    } catch {
      // Ignore logging errors
    }
  }

  private parseEbayHtml(html: string): ScrapedAd[] {
    const ads: ScrapedAd[] = [];

    try {
      // Verifica presenza di data-listingid
      if (!html.includes('data-listingid')) {
        this.log('No data-listingid found in HTML, eBay may be blocking', 'warn');
        return ads;
      }
      
      // eBay Italia usa <li> con data-listingid e classe s-card
      // Usa split per dividere l'HTML in blocchi per ogni item
      const blocks = html.split(/<li[^>]*data-listingid=/i);
      
      for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        
        // Estrai listingId dall'inizio del blocco
        const listingIdMatch = block.match(/^["']?(\d+)["']?/);
        if (!listingIdMatch) continue;
        
        const listingId = listingIdMatch[1];
        
        // Salta item placeholder (listingId troppo corto)
        if (!listingId || listingId.length < 8) continue;
        
        // Trova la fine del tag </li> per questo item
        const endIndex = block.indexOf('</li>');
        if (endIndex === -1) continue;
        
        const itemHtml = block.substring(0, endIndex);

        // Estrai titolo - prova diversi pattern
        let title = '';
        const titleMatch = 
          itemHtml.match(/role=heading[^>]*>([^<]+)</i) ||
          itemHtml.match(/role="heading"[^>]*>([^<]+)</i) ||
          itemHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</i) ||
          itemHtml.match(/<span[^>]*>([^<]{20,})</i);
        
        if (titleMatch) {
          title = this.stripHtml(titleMatch[1]).trim();
        }
        
        // Salta se non c'è titolo valido
        if (!title || title.length < 3) continue;

        // Estrai prezzo
        let price: string | null = null;
        const priceMatch = itemHtml.match(/EUR\s*([\d.,]+)/i) || 
                          itemHtml.match(/([\d.,]+)\s*€/i);
        if (priceMatch) {
          price = this.normalizePrice(priceMatch[1]);
        }

        // Estrai link
        let link = '';
        const linkMatch = itemHtml.match(/href="(https:\/\/www\.ebay\.it\/itm\/\d+[^"]*)"/i);
        if (linkMatch) {
          link = linkMatch[1].split('?')[0];
        } else {
          link = `https://www.ebay.it/itm/${listingId}`;
        }

        // Immagine: lasciamo null, useremo placeholder per piattaforma
        const image: string | null = null;

        // Estrai location (provenienza venditore) - pattern più specifico
        let location: string | null = null;
        const locationMatch = itemHtml.match(/s-item__location[^>]*>(?:da\s+)?([^<]+)</i);
        if (locationMatch) {
          location = this.stripHtml(locationMatch[1]).trim();
        }

        // Controlla spedizione gratuita
        const hasShipping = itemHtml.toLowerCase().includes('spedizione gratuita') || 
                           itemHtml.toLowerCase().includes('free shipping');

        ads.push({
          title,
          price,
          location,
          link,
          image,
          status: 'available',
          hasShipping,
        });
      }

    } catch (error) {
      this.log(`Error parsing eBay HTML: ${error}`, 'error');
    }

    return ads;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
}

// Factory function
export function createEbayScraper(): EbayScraper {
  return new EbayScraper();
}
