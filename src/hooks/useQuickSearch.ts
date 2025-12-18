// src/hooks/useQuickSearch.ts - Hook React Query per Quick Search
// Timestamp: 2024-12-18

import { useMutation } from '@tanstack/react-query';
import { Platform, ScrapedAd } from '@/services/scrapers';
import { PriceStats } from '@/lib/market-price';

interface QuickSearchParams {
  product: string;
  model?: string;
  platforms: Platform[];
  minPrice?: number;
  maxPrice?: number;
}

interface QuickSearchResponse {
  success: boolean;
  stats: PriceStats | null;
  results: Array<ScrapedAd & { platform: string }>;
  totalResults: number;
  scrapedPlatforms: string[];
  error?: string;
}

export function useQuickSearch() {
  return useMutation({
    mutationFn: async (params: QuickSearchParams): Promise<QuickSearchResponse> => {
      const res = await fetch('/api/quick-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore durante la ricerca');
      }

      return res.json();
    },
  });
}
