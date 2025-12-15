// src/components/filters/index.tsx - Factory per filtri piattaforma
// Timestamp: 2024-12-15

'use client';

import { CommonFilters } from './CommonFilters';
import { SubitoFilters } from './SubitoFilters';
import { EbayFilters } from './EbayFilters';

// Re-export componenti
export { CommonFilters } from './CommonFilters';
export { SubitoFilters } from './SubitoFilters';
export { EbayFilters } from './EbayFilters';

// Tipi per i filtri
export interface FilterValues {
  // Comuni
  minPrice: string;
  maxPrice: string;
  includeKeywords: string;
  excludeKeywords: string;
  // Subito
  region: string;
  exactMatch: boolean;
  // eBay
  ebayLocation: string;
}

interface PlatformFiltersProps {
  platform: string;
  values: FilterValues;
  onChange: (field: string, value: string | boolean) => void;
}

/**
 * Componente factory che renderizza i filtri specifici per piattaforma
 */
export function PlatformFilters({ platform, values, onChange }: PlatformFiltersProps) {
  switch (platform) {
    case 'SUBITO':
      return (
        <SubitoFilters
          region={values.region}
          exactMatch={values.exactMatch}
          onChange={onChange}
        />
      );
    case 'EBAY':
      return (
        <EbayFilters
          ebayLocation={values.ebayLocation}
          onChange={onChange}
        />
      );
    case 'VINTED':
    case 'WALLAPOP':
    case 'FACEBOOK':
      // Placeholder per piattaforme future
      return (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
          <p className="text-sm">Filtri per {platform} in arrivo...</p>
        </div>
      );
    default:
      return null;
  }
}
