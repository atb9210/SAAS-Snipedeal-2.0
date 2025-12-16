// src/services/scrapers/index.ts - Scraper Factory
// Timestamp: 2024-12-15

import { BaseScraper, ScrapeOptions, ScrapeResult } from './base';
import { SubitoScraper } from './subito';
import { EbayScraper } from './ebay';
import { VintedScraper } from './vinted';
import { FacebookScraper } from './facebook';

export type Platform = 'SUBITO' | 'EBAY' | 'VINTED' | 'WALLAPOP' | 'FACEBOOK';

// Scraper factory
export function createScraper(platform: Platform): BaseScraper {
  switch (platform) {
    case 'SUBITO':
      return new SubitoScraper();
    case 'EBAY':
      return new EbayScraper();
    case 'VINTED':
      return new VintedScraper();
    case 'FACEBOOK':
      return new FacebookScraper();
    case 'WALLAPOP':
      throw new Error(`Scraper for ${platform} not yet implemented`);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Check if platform is supported
export function isPlatformSupported(platform: Platform): boolean {
  return ['SUBITO', 'EBAY', 'VINTED', 'FACEBOOK'].includes(platform);
}

// Re-export types
export type { ScrapeOptions, ScrapeResult, ScrapedAd } from './base';


