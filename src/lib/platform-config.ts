// src/lib/platform-config.ts - Configurazione centralizzata piattaforme
// Timestamp: 2024-12-22

import { italianRegions } from './utils';

// Tipi per i filtri
export type FilterType = 'select' | 'boolean' | 'text';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  name: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  default?: string | boolean;
  description?: string;
}

export interface PlatformFilterConfig {
  platform: string;
  displayName: string;
  filters: FilterConfig[];
  isEnabled: boolean;
}

// Opzioni per eBay location
const EBAY_LOCATIONS: FilterOption[] = [
  { value: '', label: 'Tutto il mondo' },
  { value: 'IT', label: 'Italia' },
  { value: 'EU', label: 'Europa' },
];

// Opzioni per regioni italiane (Subito)
const ITALIAN_REGION_OPTIONS: FilterOption[] = [
  { value: '', label: 'Tutta Italia' },
  ...italianRegions.map(region => ({ value: region, label: region })),
];

// Configurazione filtri per piattaforma
export const PLATFORM_FILTERS: Record<string, PlatformFilterConfig> = {
  SUBITO: {
    platform: 'SUBITO',
    displayName: 'Subito.it',
    isEnabled: true,
    filters: [
      {
        name: 'region',
        label: 'Regione',
        type: 'select',
        options: ITALIAN_REGION_OPTIONS,
        default: '',
        description: 'Filtra per regione italiana',
      },
      {
        name: 'exactMatch',
        label: 'Ricerca esatta',
        type: 'boolean',
        default: false,
        description: 'Cerca solo nel titolo dell\'annuncio',
      },
    ],
  },
  EBAY: {
    platform: 'EBAY',
    displayName: 'eBay',
    isEnabled: true,
    filters: [
      {
        name: 'location',
        label: 'Provenienza',
        type: 'select',
        options: EBAY_LOCATIONS,
        default: '',
        description: 'Filtra per provenienza venditore',
      },
    ],
  },
  VINTED: {
    platform: 'VINTED',
    displayName: 'Vinted',
    isEnabled: true,
    filters: [], // Nessun filtro specifico per ora
  },
  WALLAPOP: {
    platform: 'WALLAPOP',
    displayName: 'Wallapop',
    isEnabled: false, // Non ancora implementato
    filters: [],
  },
};

// Helper: ottieni piattaforme abilitate
export function getEnabledPlatforms(): string[] {
  return Object.keys(PLATFORM_FILTERS).filter(
    key => PLATFORM_FILTERS[key].isEnabled
  );
}

// Helper: ottieni filtri per piattaforma
export function getPlatformFilters(platform: string): FilterConfig[] {
  return PLATFORM_FILTERS[platform]?.filters || [];
}

// Helper: ottieni valori default per piattaforma
export function getDefaultFilterValues(platform: string): Record<string, string | boolean> {
  const filters = getPlatformFilters(platform);
  const defaults: Record<string, string | boolean> = {};
  
  for (const filter of filters) {
    defaults[filter.name] = filter.default ?? (filter.type === 'boolean' ? false : '');
  }
  
  return defaults;
}

// Helper: ottieni valori default per tutte le piattaforme selezionate
export function getDefaultFiltersForPlatforms(platforms: string[]): Record<string, Record<string, string | boolean>> {
  const result: Record<string, Record<string, string | boolean>> = {};
  
  for (const platform of platforms) {
    result[platform] = getDefaultFilterValues(platform);
  }
  
  return result;
}

// Tipo per i filtri di una campagna multi-platform
export interface MultiPlatformFilters {
  SUBITO?: {
    region?: string;
    exactMatch?: boolean;
  };
  EBAY?: {
    location?: string;
  };
  VINTED?: Record<string, never>;
  WALLAPOP?: Record<string, never>;
}
