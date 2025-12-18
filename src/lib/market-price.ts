// src/lib/market-price.ts - Utility per calcolo prezzo medio di mercato
// Timestamp: 2024-12-18

export interface PriceStats {
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  totalResults: number;
  validPrices: number;
  priceRange: {
    min: number;
    max: number;
  };
}

/**
 * Estrae il valore numerico da una stringa di prezzo
 */
export function extractNumericPrice(price: string | null): number | null {
  if (!price) return null;
  
  const cleaned = price
    .replace(/[^\d.,]/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Calcola statistiche di prezzo rimuovendo top 10% e bottom 10%
 * per ottenere un prezzo medio di mercato più accurato
 */
export function calculateMarketPrice(prices: (string | null)[]): PriceStats | null {
  const numericPrices = prices
    .map(extractNumericPrice)
    .filter((p): p is number => p !== null && p > 0)
    .sort((a, b) => a - b);

  if (numericPrices.length === 0) {
    return null;
  }

  const totalResults = prices.length;
  const validPrices = numericPrices.length;

  if (validPrices < 3) {
    const avg = numericPrices.reduce((sum, p) => sum + p, 0) / validPrices;
    const median = numericPrices[Math.floor(validPrices / 2)];
    
    return {
      averagePrice: Math.round(avg),
      medianPrice: Math.round(median),
      minPrice: Math.round(numericPrices[0]),
      maxPrice: Math.round(numericPrices[validPrices - 1]),
      totalResults,
      validPrices,
      priceRange: {
        min: Math.round(numericPrices[0]),
        max: Math.round(numericPrices[validPrices - 1]),
      },
    };
  }

  const removeCount = Math.floor(validPrices * 0.1);
  
  const trimmedPrices = numericPrices.slice(removeCount, validPrices - removeCount);

  const average = trimmedPrices.reduce((sum, p) => sum + p, 0) / trimmedPrices.length;
  const median = trimmedPrices[Math.floor(trimmedPrices.length / 2)];

  return {
    averagePrice: Math.round(average),
    medianPrice: Math.round(median),
    minPrice: Math.round(numericPrices[0]),
    maxPrice: Math.round(numericPrices[validPrices - 1]),
    totalResults,
    validPrices,
    priceRange: {
      min: Math.round(trimmedPrices[0]),
      max: Math.round(trimmedPrices[trimmedPrices.length - 1]),
    },
  };
}

/**
 * Formatta le statistiche di prezzo per la visualizzazione
 */
export function formatPriceStats(stats: PriceStats): string {
  return `€${stats.averagePrice.toLocaleString('it-IT')}`;
}
