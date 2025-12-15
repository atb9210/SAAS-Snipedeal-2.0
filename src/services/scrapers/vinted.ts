// src/services/scrapers/vinted.ts - Scraper Vinted Italia
// Timestamp: 2024-12-15

import { BaseScraper, ScrapeOptions, ScrapeResult, ScrapedAd } from './base';
import { getProxyManager, ProxyUrl } from '../proxy';

export class VintedScraper extends BaseScraper {
  private proxy: ProxyUrl | null = null;

  constructor() {
    super('VintedScraper', 'https://www.vinted.it');
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const { keyword, minPrice, maxPrice, maxPages = 1 } = options;
    
    this.log(`Starting scrape for: "${keyword}"`);

    // Ottieni proxy dal ProxyManager
    try {
      const proxyManager = getProxyManager();
      this.proxy = await proxyManager.getProxy('Italy', true);
      
      if (this.proxy) {
        this.log(`Using proxy: ${this.proxy.host}:${this.proxy.port}`);
      } else {
        this.log('No proxy available, scraping without proxy', 'warn');
      }
    } catch (proxyError) {
      this.log(`Proxy error: ${proxyError}, continuing without proxy`, 'warn');
      this.proxy = null;
    }

    try {
      const allAds: ScrapedAd[] = [];

      for (let page = 1; page <= maxPages; page++) {
        const url = this.buildUrl(keyword, page);
        this.log(`Fetching page ${page}: ${url}`);

        const html = await this.fetchWithProxy(url);

        if (!html) {
          this.log(`Failed to fetch page ${page}`, 'warn');
          continue;
        }

        const pageAds = this.parseVintedHtml(html);
        this.log(`Page ${page}: found ${pageAds.length} ads`);
        allAds.push(...pageAds);
      }

      // Filtra per prezzo
      const filteredAds = allAds.filter(ad => 
        this.matchesPriceFilter(ad.price, minPrice, maxPrice)
      );

      this.log(`Found ${filteredAds.length} ads (filtered from ${allAds.length})`);

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

  private buildUrl(keyword: string, page: number): string {
    const params = new URLSearchParams({
      search_text: keyword,
      order: 'newest_first',  // Ordina per più recenti
      page: page.toString(),
    });

    return `${this.baseUrl}/catalog?${params.toString()}`;
  }

  private async fetchWithProxy(url: string): Promise<string | null> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };

      let response: Response;

      if (this.proxy) {
        // Usa proxy - ProxyUrl ha già l'URL completo
        const { HttpsProxyAgent } = await import('https-proxy-agent');
        const agent = new HttpsProxyAgent(this.proxy.url);
        
        response = await fetch(url, {
          headers,
          // @ts-ignore - agent è supportato in Node.js
          agent,
        });
      } else {
        response = await fetch(url, { headers });
      }

      if (!response.ok) {
        this.log(`HTTP error: ${response.status}`, 'error');
        return null;
      }

      return await response.text();
    } catch (error) {
      this.log(`Fetch error: ${error}`, 'error');
      return null;
    }
  }

  private parseVintedHtml(html: string): ScrapedAd[] {
    const ads: ScrapedAd[] = [];

    try {
      // Trova tutti gli ID degli item usando data-testid="product-item-id-{ID}"
      const itemIdMatches = html.matchAll(/data-testid="product-item-id-(\d+)"/g);
      const itemIds = [...new Set([...itemIdMatches].map(m => m[1]))];

      this.log(`Found ${itemIds.length} unique item IDs`);

      for (const itemId of itemIds) {
        try {
          // Estrai titolo usando data-testid="product-item-id-{ID}--description-title"
          let title = '';
          const titleRegex = new RegExp(
            `data-testid="product-item-id-${itemId}--description-title"[^>]*>([^<]+)<`,
            'i'
          );
          const titleMatch = html.match(titleRegex);
          if (titleMatch) {
            title = this.stripHtml(titleMatch[1]).trim();
          }

          // Skip se titolo vuoto o troppo corto
          if (!title || title.length < 2) continue;

          // Estrai prezzo usando data-testid="product-item-id-{ID}--price-text"
          let price: string | null = null;
          const priceRegex = new RegExp(
            `data-testid="product-item-id-${itemId}--price-text"[^>]*>([^<]+)<`,
            'i'
          );
          const priceMatch = html.match(priceRegex);
          if (priceMatch) {
            price = this.normalizePrice(priceMatch[1]);
          }

          // Costruisci link all'annuncio
          const link = `${this.baseUrl}/items/${itemId}`;

          // Immagine: lasciamo null, useremo placeholder per piattaforma
          const image: string | null = null;

          // Location: Vinted non mostra location nella lista, solo nel dettaglio
          const location: string | null = null;

          ads.push({
            title,
            price,
            location,
            link,
            image,
            status: 'available',
          });
        } catch (itemError) {
          this.log(`Error parsing item ${itemId}: ${itemError}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Error parsing Vinted HTML: ${error}`, 'error');
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
