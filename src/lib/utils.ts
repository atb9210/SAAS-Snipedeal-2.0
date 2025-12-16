// src/lib/utils.ts - Utility functions
// Timestamp: 2024-12-09

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price
export function formatPrice(price: string | number | null | undefined): string {
  if (!price) return 'N/D';
  
  if (typeof price === 'string') {
    // Se già formattato (es. "€ 150")
    if (price.includes('€')) return price;
    
    // Estrai numero
    const num = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(num)) return price;
    price = num;
  }
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Format date relative
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ora';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;
  
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

// Platform display names and colors
export const platformConfig = {
  SUBITO: {
    name: 'Subito.it',
    color: '#FF6600',
    icon: '🟠',
  },
  EBAY: {
    name: 'eBay',
    color: '#E53238',
    icon: '🔴',
  },
  VINTED: {
    name: 'Vinted',
    color: '#09B1BA',
    icon: '🟢',
  },
  FACEBOOK: {
    name: 'FB Marketplace',
    color: '#1877F2',
    icon: '🔵',
  },
} as const;

// Italian regions
export const italianRegions = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
];

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}


