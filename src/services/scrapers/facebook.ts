// src/services/scrapers/facebook.ts - Scraper Facebook Marketplace
// Usa Playwright per JS rendering (Facebook richiede browser)
// Timestamp: 2024-12-16

import { chromium, Browser } from 'playwright';
import { BaseScraper, ScrapeOptions, ScrapeResult, ScrapedAd } from './base';
import { getProxyManager, ProxyUrl } from '../proxy';
import { FACEBOOK_CITY_MAP } from '@/lib/facebook-cities';

export class FacebookScraper extends BaseScraper {
  private browser: Browser | null = null;
  private proxy: ProxyUrl | null = null;
  private proxyProviderId: string | null = null;

  constructor() {
    super('FacebookScraper', 'https://www.facebook.com/marketplace');
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const { 
      keyword, 
      minPrice, 
      maxPrice, 
      maxPages = 1,
      platformFilters 
    } = options;
    
    // Estrai filtri specifici Facebook
    const city = platformFilters?.city as string || 'Milano';
    const exactMatch = platformFilters?.exactMatch as boolean || false;
    const freeOnly = platformFilters?.freeOnly as boolean || false;
    
    this.log(`Starting scrape for: "${keyword}" in ${city}${freeOnly ? ' (solo regalo)' : ''}`);

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
      const result = await this.scrapeViaPlaywright(keyword, city, exactMatch, freeOnly, minPrice, maxPrice, maxPages);
      
      // Filtra per prezzo (doppio check, Facebook potrebbe non rispettare sempre i filtri)
      const filteredAds = result.ads.filter(ad => 
        this.matchesPriceFilter(ad.price, minPrice, maxPrice)
      );

      this.log(`Found ${filteredAds.length} ads (filtered from ${result.ads.length})`);
      
      return {
        success: true,
        ads: filteredAds,
        totalFound: filteredAds.length,
        scrapedAt: new Date(),
      };
    } catch (error) {
      this.log(`Scrape error: ${error}`, 'error');
      return {
        success: false,
        ads: [],
        totalFound: 0,
        scrapedAt: new Date(),
        error: String(error),
      };
    } finally {
      await this.cleanup();
    }
  }

  private async scrapeViaPlaywright(
    keyword: string,
    city: string,
    exactMatch: boolean,
    freeOnly: boolean,
    minPrice: number | null | undefined,
    maxPrice: number | null | undefined,
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
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'it-IT',
      });

      const page = await context.newPage();

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = this.buildUrl(keyword, city, exactMatch, freeOnly, minPrice, maxPrice);
        this.log(`Loading page ${pageNum}: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait for content to load
        await page.waitForTimeout(2000);

        const html = await page.content();
        const pageAds = this.parseMarketplaceData(html);
        
        this.log(`Page ${pageNum}: found ${pageAds.length} ads`);
        ads.push(...pageAds);

        // Facebook Marketplace non ha paginazione URL standard
        // Per ora supportiamo solo la prima pagina
        // TODO: implementare scroll infinito se necessario
        break;
      }

      await context.close();

    } catch (error) {
      this.log(`Playwright error: ${error}`, 'error');
    }

    return { ads };
  }

  private buildUrl(
    keyword: string, 
    city: string, 
    exactMatch: boolean,
    freeOnly: boolean,
    minPrice: number | null | undefined,
    maxPrice: number | null | undefined
  ): string {
    const cityId = FACEBOOK_CITY_MAP[city] || 'milan';
    
    const params = new URLSearchParams({
      sortBy: 'creation_time_descend', // Più recenti
      query: keyword,
    });
    
    if (exactMatch) {
      params.set('exact', 'true');
    }
    
    // Solo regalo (maxPrice=0)
    if (freeOnly) {
      params.set('maxPrice', '0');
    } else {
      // Filtri prezzo Facebook normali
      if (minPrice && minPrice > 0) {
        params.set('minPrice', String(minPrice));
      }
      if (maxPrice && maxPrice > 0) {
        params.set('maxPrice', String(maxPrice));
      }
    }

    return `https://www.facebook.com/marketplace/${cityId}/search?${params.toString()}`;
  }

  private parseMarketplaceData(html: string): ScrapedAd[] {
    const ads: ScrapedAd[] = [];
    const seenIds = new Set<string>();

    try {
      // Estrai titoli dal JSON embedded
      const titleMatches = html.matchAll(/"marketplace_listing_title":"([^"]+)"/g);
      const titles: string[] = [];
      for (const match of titleMatches) {
        titles.push(match[1]);
      }

      // Estrai prezzi dal JSON embedded
      const priceMatches = html.matchAll(/"listing_price":\{"formatted_amount":"([^"]+)","amount_with_offset_in_currency":"[^"]*","amount":"([^"]+)"\}/g);
      const prices: { formatted: string; amount: string }[] = [];
      for (const match of priceMatches) {
        prices.push({
          formatted: match[1].replace(/\\u20ac/g, '€'),
          amount: match[2],
        });
      }

      // Estrai immagini dal JSON embedded
      const imageMatches = html.matchAll(/"primary_listing_photo":\{"__typename":"[^"]*","image":\{"uri":"([^"]+)"\}/g);
      const images: string[] = [];
      for (const match of imageMatches) {
        images.push(match[1].replace(/\\\//g, '/'));
      }

      // Estrai link agli annunci
      // Facebook usa URL come /marketplace/item/123456789/
      const linkMatches = html.matchAll(/\/marketplace\/item\/(\d+)\//g);
      const links: string[] = [];
      for (const match of linkMatches) {
        if (!seenIds.has(match[1])) {
          seenIds.add(match[1]);
          links.push(`https://www.facebook.com/marketplace/item/${match[1]}/`);
        }
      }

      // Combina i dati
      // Nota: l'ordine potrebbe non corrispondere perfettamente
      // Usiamo il numero minimo di elementi disponibili
      const count = Math.min(titles.length, prices.length, links.length);
      
      for (let i = 0; i < count; i++) {
        // Facebook usa formato americano (320.00), convertiamo in formato italiano
        const priceNum = parseFloat(prices[i].amount);
        const priceFormatted = isNaN(priceNum) 
          ? prices[i].formatted 
          : `€ ${Math.round(priceNum).toLocaleString('it-IT')}`;
        
        ads.push({
          title: titles[i],
          price: priceFormatted,
          location: null,
          link: links[i],
          image: images[i] || null,
        });
      }

      this.log(`Parsed ${ads.length} ads from HTML`);

    } catch (error) {
      this.log(`Parse error: ${error}`, 'error');
    }

    return ads;
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore cleanup errors
      }
      this.browser = null;
    }
  }
}
