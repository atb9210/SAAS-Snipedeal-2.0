"use strict";
// src/services/scrapers/base.ts - Base Scraper Interface
// Timestamp: 2024-12-09
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
class BaseScraper {
    constructor(name, baseUrl) {
        this.name = name;
        this.baseUrl = baseUrl;
    }
    log(message, level = 'info') {
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
    normalizePrice(price) {
        if (!price)
            return null;
        // Remove currency symbols and normalize
        const cleaned = price
            .replace(/[€$£]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
        const num = parseFloat(cleaned);
        if (isNaN(num))
            return price; // Return original if can't parse
        return `€ ${num.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    matchesPriceFilter(price, minPrice, maxPrice) {
        if (!price)
            return true; // Include if no price
        const numericPrice = this.extractNumericPrice(price);
        if (numericPrice === null)
            return true;
        if (minPrice && numericPrice < minPrice)
            return false;
        if (maxPrice && numericPrice > maxPrice)
            return false;
        return true;
    }
    extractNumericPrice(price) {
        if (!price)
            return null;
        // Formato italiano: 85.000,50 → rimuovi punti (migliaia), sostituisci virgola con punto (decimali)
        // Formato semplice: 85000 o 85.00
        const cleaned = price
            .replace(/[^\d.,]/g, '') // Rimuovi tutto tranne numeri, punti e virgole
            .replace(/\.(?=\d{3})/g, '') // Rimuovi punti seguiti da 3 cifre (separatori migliaia)
            .replace(',', '.'); // Sostituisci virgola con punto per decimali
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }
}
exports.BaseScraper = BaseScraper;
