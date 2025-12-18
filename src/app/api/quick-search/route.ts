// src/app/api/quick-search/route.ts - API Quick Search
// Timestamp: 2024-12-18

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createScraper, Platform, ScrapedAd } from '@/services/scrapers';
import { calculateMarketPrice, PriceStats } from '@/lib/market-price';

interface QuickSearchRequest {
  product: string;
  model?: string;
  platforms: Platform[];
  minPrice?: number;
  maxPrice?: number;
}

interface QuickSearchResult {
  success: boolean;
  stats: PriceStats | null;
  results: Array<ScrapedAd & { platform: string }>;
  totalResults: number;
  scrapedPlatforms: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body: QuickSearchRequest = await request.json();
    const { product, model, platforms, minPrice, maxPrice } = body;

    if (!product || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Prodotto e almeno una piattaforma sono richiesti' },
        { status: 400 }
      );
    }

    const keyword = model ? `${product} ${model}` : product;

    console.log(`[QuickSearch] Starting search for: "${keyword}" on platforms:`, platforms);
    if (minPrice || maxPrice) {
      console.log(`[QuickSearch] Price filters: €${minPrice || 0} - €${maxPrice || '∞'}`);
    }

    const scrapePromises = platforms.map(async (platform) => {
      try {
        const scraper = createScraper(platform);
        const result = await scraper.scrape({
          keyword,
          maxPages: 1,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
        });

        if (result.success) {
          return {
            platform,
            ads: result.ads.map(ad => ({ ...ad, platform })),
          };
        }

        console.warn(`[QuickSearch] Failed to scrape ${platform}:`, result.error);
        return { platform, ads: [] };
      } catch (error) {
        console.error(`[QuickSearch] Error scraping ${platform}:`, error);
        return { platform, ads: [] };
      }
    });

    const results = await Promise.all(scrapePromises);

    let allAds = results.flatMap(r => r.ads);

    if (model && model.trim()) {
      const modelLower = model.toLowerCase().trim();
      const modelWords = modelLower.split(/\s+/).filter(w => w.length > 0);
      
      allAds = allAds.filter(ad => {
        const titleLower = ad.title.toLowerCase();
        return modelWords.every(word => titleLower.includes(word));
      });
      
      console.log(`[QuickSearch] Model filter "${model}": ${allAds.length} results match (filtered from ${results.flatMap(r => r.ads).length})`);
    }

    const scrapedPlatforms = results
      .filter(r => r.ads.length > 0)
      .map(r => r.platform);

    const prices = allAds.map(ad => ad.price);
    const stats = calculateMarketPrice(prices);

    const response: QuickSearchResult = {
      success: true,
      stats,
      results: allAds,
      totalResults: allAds.length,
      scrapedPlatforms,
    };

    console.log(`[QuickSearch] Completed: ${allAds.length} results from ${scrapedPlatforms.length} platforms`);
    if (stats) {
      console.log(`[QuickSearch] Market price: €${stats.averagePrice}`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[QuickSearch] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Errore durante la ricerca',
        stats: null,
        results: [],
        totalResults: 0,
        scrapedPlatforms: [],
      },
      { status: 500 }
    );
  }
}
