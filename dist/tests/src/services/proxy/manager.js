"use strict";
// src/services/proxy/manager.ts - Proxy Manager centralizzato
// Timestamp: 2024-12-12
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyManager = void 0;
exports.getProxyManager = getProxyManager;
exports.resetProxyManager = resetProxyManager;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const packetstream_1 = require("./packetstream");
const floppydata_1 = require("./floppydata");
/**
 * Registry dei provider supportati
 */
const providerFactories = {
    packetstream: (config) => new packetstream_1.PacketstreamProvider(config),
    floppydata: (config) => new floppydata_1.FloppydataProvider(config),
    // Aggiungi altri provider qui in futuro:
    // brightdata: (config) => new BrightDataProvider(config as BrightDataConfig),
    // oxylabs: (config) => new OxylabsProvider(config as OxylabsConfig),
};
// Cache TTL: 5 minuti tra ogni reload dal database
const CACHE_TTL_MS = 5 * 60 * 1000;
/**
 * ProxyManager
 *
 * Gestisce tutti i provider proxy configurati.
 * Supporta round-robin, fallback, logging e cache con TTL.
 */
class ProxyManager {
    constructor() {
        this.providers = new Map();
        this.roundRobinIndex = 0;
        this.initialized = false;
        this.lastLoadTime = 0;
    }
    /**
     * Inizializza il manager caricando i provider dal database
     * Usa cache TTL per evitare query ripetute
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            const dbProviders = await prisma_1.default.proxyProvider.findMany({
                where: { isEnabled: true },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'asc' },
                ],
            });
            this.providers.clear();
            for (const dbProvider of dbProviders) {
                const factory = providerFactories[dbProvider.name];
                if (factory) {
                    try {
                        const provider = factory(dbProvider.config);
                        if (provider.validateConfig()) {
                            this.providers.set(dbProvider.id, provider);
                            console.log(`[ProxyManager] Provider ${dbProvider.displayName} loaded`);
                        }
                        else {
                            console.warn(`[ProxyManager] Provider ${dbProvider.displayName} has invalid config`);
                        }
                    }
                    catch (error) {
                        console.error(`[ProxyManager] Failed to create provider ${dbProvider.name}:`, error);
                    }
                }
                else {
                    console.warn(`[ProxyManager] Unknown provider type: ${dbProvider.name}`);
                }
            }
            this.initialized = true;
            this.lastLoadTime = Date.now();
            console.log(`[ProxyManager] Initialized with ${this.providers.size} provider(s)`);
        }
        catch (error) {
            console.error('[ProxyManager] Failed to initialize:', error);
            throw error;
        }
    }
    /**
     * Verifica se la cache è scaduta e serve un reload
     */
    isCacheExpired() {
        return Date.now() - this.lastLoadTime > CACHE_TTL_MS;
    }
    /**
     * Ricarica i provider dal database
     */
    async reload() {
        this.initialized = false;
        await this.initialize();
    }
    /**
     * Ottiene un proxy URL (round-robin tra provider abilitati)
     * Usa cache TTL per evitare query ripetute al database
     * @param country Paese per il proxy
     * @param preferHttp Se true, preferisce HTTP invece di SOCKS5
     */
    async getProxy(country = 'Italy', preferHttp = true) {
        await this.initialize();
        if (this.providers.size === 0) {
            // Se non ci sono provider, ricarica SOLO se la cache è scaduta
            // Evita query ripetute al database quando non ci sono proxy configurati
            if (this.initialized && this.isCacheExpired()) {
                console.log('[ProxyManager] Cache expired, reloading from database...');
                await this.reload();
            }
            if (this.providers.size === 0) {
                // Log solo una volta ogni tanto per non sporcare i log
                return null;
            }
        }
        // Round-robin tra i provider
        const providerIds = Array.from(this.providers.keys());
        const providerId = providerIds[this.roundRobinIndex % providerIds.length];
        this.roundRobinIndex++;
        const provider = this.providers.get(providerId);
        if (!provider) {
            return null;
        }
        try {
            return provider.getProxyUrl(country, preferHttp);
        }
        catch (error) {
            console.error(`[ProxyManager] Error getting proxy from ${provider.name}:`, error);
            return null;
        }
    }
    /**
     * Ottiene proxy da un provider specifico
     */
    async getProxyFromProvider(providerId, country = 'Italy', preferHttp = true) {
        await this.initialize();
        const provider = this.providers.get(providerId);
        if (!provider) {
            console.warn(`[ProxyManager] Provider ${providerId} not found`);
            return null;
        }
        return provider.getProxyUrl(country, preferHttp);
    }
    /**
     * Testa un provider specifico
     */
    async testProvider(providerId, country) {
        await this.initialize();
        const provider = this.providers.get(providerId);
        if (!provider) {
            return {
                success: false,
                error: 'Provider not found or not enabled',
            };
        }
        return provider.testConnection(country);
    }
    /**
     * Testa tutti i provider abilitati
     */
    async testAllProviders(country) {
        await this.initialize();
        const results = new Map();
        for (const [id, provider] of this.providers) {
            const result = await provider.testConnection(country);
            results.set(id, result);
        }
        return results;
    }
    /**
     * Logga l'utilizzo di un proxy
     */
    async logUsage(providerId, success, campaignId, latencyMs, ipUsed, country, error) {
        try {
            await prisma_1.default.proxyUsageLog.create({
                data: {
                    providerId,
                    campaignId,
                    success,
                    latencyMs,
                    ipUsed,
                    country,
                    error,
                },
            });
        }
        catch (err) {
            console.error('[ProxyManager] Failed to log usage:', err);
        }
    }
    /**
     * Ottiene statistiche di utilizzo
     */
    async getStats(providerId, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const where = {
            createdAt: { gte: since },
            ...(providerId ? { providerId } : {}),
        };
        const [total, success, avgLatency] = await Promise.all([
            prisma_1.default.proxyUsageLog.count({ where }),
            prisma_1.default.proxyUsageLog.count({ where: { ...where, success: true } }),
            prisma_1.default.proxyUsageLog.aggregate({
                where: { ...where, success: true, latencyMs: { not: null } },
                _avg: { latencyMs: true },
            }),
        ]);
        return {
            totalRequests: total,
            successCount: success,
            failureCount: total - success,
            avgLatency: Math.round(avgLatency._avg.latencyMs || 0),
        };
    }
    /**
     * Verifica se ci sono provider disponibili
     */
    async hasAvailableProxy() {
        await this.initialize();
        return this.providers.size > 0;
    }
    /**
     * Ottiene la lista dei provider supportati (per UI admin)
     */
    getSupportedProviders() {
        return [
            { name: 'packetstream', displayName: 'Packetstream' },
            // Aggiungi altri provider qui in futuro
            // { name: 'brightdata', displayName: 'BrightData' },
            // { name: 'oxylabs', displayName: 'Oxylabs' },
        ];
    }
}
exports.ProxyManager = ProxyManager;
// Singleton instance
let proxyManagerInstance = null;
/**
 * Ottiene l'istanza singleton del ProxyManager
 */
function getProxyManager() {
    if (!proxyManagerInstance) {
        proxyManagerInstance = new ProxyManager();
    }
    return proxyManagerInstance;
}
/**
 * Reset dell'istanza (utile per testing)
 */
function resetProxyManager() {
    proxyManagerInstance = null;
}
exports.default = getProxyManager;
