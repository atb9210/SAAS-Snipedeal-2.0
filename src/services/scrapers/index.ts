// src/services/scrapers/index.ts - Scraper Factory
// Timestamp: 2024-12-09

import { BaseScraper, ScrapeOptions, ScrapeResult } from './base';
import { SubitoScraper } from './subito';

export type Platform = 'SUBITO' | 'EBAY' | 'VINTED' | 'WALLAPOP' | 'FACEBOOK';

// Scraper factory
export function createScraper(platform: Platform): BaseScraper {
  switch (platform) {
    case 'SUBITO':
      return new SubitoScraper();
    case 'EBAY':
    case 'VINTED':
    case 'WALLAPOP':
    case 'FACEBOOK':
      throw new Error(`Scraper for ${platform} not yet implemented`);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Check if platform is supported
export function isPlatformSupported(platform: Platform): boolean {
  return platform === 'SUBITO';
}

// Re-export types
export type { ScrapeOptions, ScrapeResult, ScrapedAd } from './base';


