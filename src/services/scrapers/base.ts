// src/services/scrapers/base.ts - Base Scraper Interface
// Timestamp: 2024-12-09

export interface ScrapedAd {
  title: string;
  price: string | null;
  location: string | null;
  link: string;
  image: string | null;
  status?: string; // available, sold
  hasShipping?: boolean;
  date?: string;
  extraData?: Record<string, unknown>;
}

export interface ScrapeOptions {
  keyword: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  region?: string | null;
  maxPages?: number;
}

export interface ScrapeResult {
  success: boolean;
  ads: ScrapedAd[];
  totalFound: number;
  error?: string;
  scrapedAt: Date;
}

export abstract class BaseScraper {
  protected name: string;
  protected baseUrl: string;

  constructor(name: string, baseUrl: string) {
    this.name = name;
    this.baseUrl = baseUrl;
  }

  abstract scrape(options: ScrapeOptions): Promise<ScrapeResult>;

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const prefix = `[${this.name}]`;
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  protected normalizePrice(price: string | null): string | null {
    if (!price) return null;
    
    // Remove currency symbols and normalize
    const cleaned = price
      .replace(/[€$£]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    
    const num = parseFloat(cleaned);
    if (isNaN(num)) return price; // Return original if can't parse
    
    return `€ ${num.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  protected matchesPriceFilter(
    price: string | null,
    minPrice?: number | null,
    maxPrice?: number | null
  ): boolean {
    if (!price) return true; // Include if no price
    
    const numericPrice = this.extractNumericPrice(price);
    if (numericPrice === null) return true;

    if (minPrice && numericPrice < minPrice) return false;
    if (maxPrice && numericPrice > maxPrice) return false;

    return true;
  }

  protected extractNumericPrice(price: string | null): number | null {
    if (!price) return null;
    
    // Formato italiano: 85.000,50 → rimuovi punti (migliaia), sostituisci virgola con punto (decimali)
    // Formato semplice: 85000 o 85.00
    const cleaned = price
      .replace(/[^\d.,]/g, '')  // Rimuovi tutto tranne numeri, punti e virgole
      .replace(/\.(?=\d{3})/g, '')  // Rimuovi punti seguiti da 3 cifre (separatori migliaia)
      .replace(',', '.');  // Sostituisci virgola con punto per decimali
    
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  }
}


