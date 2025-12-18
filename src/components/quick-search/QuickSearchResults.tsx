// src/components/quick-search/QuickSearchResults.tsx - Visualizzazione risultati Quick Search
// Timestamp: 2024-12-18

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ArrowUpDown, RefreshCw, ExternalLink } from 'lucide-react';
import { formatPrice, platformConfig } from '@/lib/utils';
import { PriceStats } from '@/lib/market-price';
import { ScrapedAd } from '@/services/scrapers';

interface QuickSearchResultsProps {
  data?: {
    success: boolean;
    stats: PriceStats | null;
    results: Array<ScrapedAd & { platform: string }>;
    totalResults: number;
    scrapedPlatforms: string[];
  };
  onNewSearch: () => void;
}

type SortOption = 'price-asc' | 'price-desc' | 'platform';

export function QuickSearchResults({ data, onNewSearch }: QuickSearchResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');

  const sortedResults = useMemo(() => {
    if (!data?.results) return [];

    const results = [...data.results];

    switch (sortBy) {
      case 'price-asc':
        return results.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
          const priceB = parseFloat(b.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
          return priceA - priceB;
        });
      case 'price-desc':
        return results.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
          const priceB = parseFloat(b.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
          return priceB - priceA;
        });
      case 'platform':
        return results.sort((a, b) => a.platform.localeCompare(b.platform));
      default:
        return results;
    }
  }, [data?.results, sortBy]);

  if (!data) return null;

  const { stats, totalResults, scrapedPlatforms } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Market Price Card */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Prezzo Medio di Mercato</h3>
          </div>
          <div className="text-4xl font-bold mb-4">
            {formatPrice(stats.averagePrice)}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-primary-100 mb-1">Min</p>
              <p className="font-semibold">{formatPrice(stats.minPrice)}</p>
            </div>
            <div>
              <p className="text-primary-100 mb-1">Mediana</p>
              <p className="font-semibold">{formatPrice(stats.medianPrice)}</p>
            </div>
            <div>
              <p className="text-primary-100 mb-1">Max</p>
              <p className="font-semibold">{formatPrice(stats.maxPrice)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary-400 text-xs text-primary-100">
            Calcolato su {stats.validPrices} risultati (esclusi top/bottom 10%)
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm">Risultati Totali</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Piattaforme</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scrapedPlatforms.length}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Risultati</h3>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="price-asc">Prezzo: Basso → Alto</option>
            <option value="price-desc">Prezzo: Alto → Basso</option>
            <option value="platform">Piattaforma</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nessun risultato trovato</p>
          </div>
        ) : (
          sortedResults.map((result, index) => {
            const platform = platformConfig[result.platform as keyof typeof platformConfig];
            
            return (
              <motion.a
                key={`${result.platform}-${index}`}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {platform && <platform.icon size={16} className="text-gray-400 flex-shrink-0" />}
                      <span className="text-xs text-gray-500">{platform?.name}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {result.title}
                    </h4>
                    {result.location && (
                      <p className="text-xs text-gray-500">{result.location}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-bold text-primary whitespace-nowrap">
                      {result.price || 'N/D'}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </motion.a>
            );
          })
        )}
      </div>

      {/* New Search Button */}
      <button
        onClick={onNewSearch}
        className="w-full btn-ghost btn-lg"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Nuova Ricerca
      </button>
    </div>
  );
}
