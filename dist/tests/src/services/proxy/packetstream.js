"use strict";
// src/services/proxy/packetstream.ts - Provider Packetstream
// Timestamp: 2024-12-09
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketstreamProvider = void 0;
exports.createPacketstreamProvider = createPacketstreamProvider;
/**
 * Porte Packetstream
 * - 31112: HTTP proxy (funziona con autenticazione Basic)
 * - 31113: SOCKS5 proxy
 * - 31111: HTTPS proxy (deprecato/non funzionante)
 */
const PORTS = {
    HTTP: 31112,
    SOCKS5: 31113,
    HTTPS: 31111, // Deprecato
};
const PROXY_HOST = 'proxy.packetstream.io';
/**
 * PacketstreamProvider
 *
 * Implementazione del provider proxy Packetstream.
 * Supporta proxy HTTP e SOCKS5 con rotazione geografica.
 */
class PacketstreamProvider {
    constructor(config) {
        this.name = 'packetstream';
        this.displayName = 'Packetstream';
        this.config = config;
    }
    /**
     * Genera URL proxy Packetstream
     */
    getProxyUrl(country, preferHttp = true) {
        const targetCountry = country || this.config.defaultCountry || 'Italy';
        // Formatta auth key con country
        let authKeyFormatted = this.config.authKey;
        // Se authKey contiene già _country-, aggiornalo
        if (authKeyFormatted.includes('_country-')) {
            authKeyFormatted = authKeyFormatted.replace(/_country-[^_]+/, `_country-${targetCountry}`);
        }
        else {
            // Altrimenti aggiungi il paese
            authKeyFormatted = `${authKeyFormatted}_country-${targetCountry}`;
        }
        // Determina protocollo e porta
        const protocol = preferHttp ? 'http' : 'socks5h';
        const port = preferHttp ? PORTS.HTTP : PORTS.SOCKS5;
        // Genera URL completo
        const url = `${protocol}://${this.config.username}:${authKeyFormatted}@${PROXY_HOST}:${port}`;
        return {
            url,
            protocol,
            host: PROXY_HOST,
            port,
        };
    }
    /**
     * Testa la connessione proxy verificando l'IP
     */
    async testConnection(country) {
        const startTime = Date.now();
        try {
            const proxyUrl = this.getProxyUrl(country, true); // Usa HTTP per il test
            // Usa ip-api.com per verificare l'IP
            const response = await this.fetchWithProxy('http://ip-api.com/json', proxyUrl.url);
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
                ip: data.query,
                country: data.country,
                city: data.city,
                latencyMs,
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
        return !!(this.config.username &&
            this.config.username.trim() &&
            this.config.authKey &&
            this.config.authKey.trim() &&
            // Username non deve contenere caratteri speciali URL
            !/[:\/@]/.test(this.config.username));
    }
    /**
     * Fetch con proxy HTTP
     * Nota: In Node.js, per usare proxy con fetch nativo servono moduli aggiuntivi
     * come undici o node-fetch con proxy-agent
     */
    async fetchWithProxy(url, proxyUrl) {
        // Per Node.js, usiamo un approccio con proxy-agent
        // In produzione, potresti usare undici o https-proxy-agent
        try {
            // Prova prima con il modulo undici se disponibile
            const { ProxyAgent, fetch: undiciFetch } = await Promise.resolve().then(() => __importStar(require('undici')));
            const proxyAgent = new ProxyAgent(proxyUrl);
            return await undiciFetch(url, {
                dispatcher: proxyAgent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            });
        }
        catch {
            // Fallback: usa curl via child_process (più affidabile per test)
            return this.fetchWithCurl(url, proxyUrl);
        }
    }
    /**
     * Fallback: usa curl per fetch con proxy
     */
    async fetchWithCurl(url, proxyUrl) {
        const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
        try {
            const result = execSync(`curl -s -x "${proxyUrl}" "${url}" -A "Mozilla/5.0" --max-time 30`, { encoding: 'utf-8', timeout: 35000 });
            return new Response(result, {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        catch (error) {
            throw new Error(`Curl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.PacketstreamProvider = PacketstreamProvider;
/**
 * Factory function per creare istanze Packetstream
 */
function createPacketstreamProvider(config) {
    return new PacketstreamProvider(config);
}
