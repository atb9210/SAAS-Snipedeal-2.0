"use strict";
// src/services/proxy/floppydata.ts - Provider Floppydata Webunlocker
// Timestamp: 2026-05-09
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloppydataProvider = void 0;
exports.createFloppydataProvider = createFloppydataProvider;
/**
 * FloppydataProvider
 *
 * Implementazione del provider Floppydata Webunlocker.
 * Fornisce browser+proxy integrati per bypassare protezioni anti-bot.
 * Restituisce HTML completo invece di URL proxy.
 */
class FloppydataProvider {
    constructor(config) {
        this.name = 'floppydata';
        this.displayName = 'Floppydata Webunlocker';
        this.config = config;
    }
    /**
     * Genera URL proxy (fittizio per compatibilità con ProxyProviderService)
     * Floppydata non restituisce URL proxy ma HTML completo
     */
    getProxyUrl(country, preferHttp = true) {
        // Restituisce URL "fittizio" per compatibilità con l'interfaccia
        // Il metodo principale sarà fetchHtml
        return {
            url: '',
            protocol: 'http',
            host: '',
            port: 0,
        };
    }
    /**
     * Testa la connessione API Floppydata
     */
    async testConnection(country) {
        const startTime = Date.now();
        try {
            // Usa endpoint balance per testare la connessione
            const response = await fetch(`${this.config.baseUrl}/v1/webUnlocker/balance`, {
                headers: {
                    'X-Api-Key': this.config.apiKey,
                },
            });
            const latencyMs = Date.now() - startTime;
            if (!response.ok) {
                return {
                    success: false,
                    latencyMs,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
            const data = await response.json();
            return {
                success: true,
                latencyMs,
                // Floppydata non restituisce IP, country, city nel test balance
                ip: undefined,
                country: undefined,
                city: undefined,
            };
        }
        catch (error) {
            return {
                success: false,
                latencyMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Valida la configurazione
     */
    validateConfig() {
        return !!(this.config.apiKey &&
            this.config.apiKey.trim() &&
            this.config.baseUrl &&
            this.config.baseUrl.trim() &&
            this.config.defaultCountry &&
            this.config.defaultCountry.trim());
    }
    /**
     * Fetch HTML completo tramite Floppydata Webunlocker
     * Questo è il metodo principale per Floppydata
     *
     * @param url Target page URL
     * @param country Country code (default: config.defaultCountry)
     * @param difficulty Access difficulty pool (default: 'low')
     * @param expiration Cache age in days (default: 0 = no cache)
     * @returns HTML content or null if failed
     */
    async fetchHtml(url, country, difficulty = 'low', expiration = 0) {
        try {
            const targetCountry = country || this.config.defaultCountry;
            const response = await fetch(`${this.config.baseUrl}/v1/webUnlocker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.config.apiKey,
                },
                body: JSON.stringify({
                    url,
                    country: targetCountry,
                    difficulty,
                    expiration,
                }),
            });
            if (!response.ok) {
                console.error(`[FloppydataProvider] HTTP ${response.status}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            return data.html || null;
        }
        catch (error) {
            console.error(`[FloppydataProvider] Fetch error:`, error);
            return null;
        }
    }
}
exports.FloppydataProvider = FloppydataProvider;
/**
 * Factory function per creare istanze Floppydata
 */
function createFloppydataProvider(config) {
    return new FloppydataProvider(config);
}
