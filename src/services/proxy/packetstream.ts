// src/services/proxy/packetstream.ts - Provider Packetstream
// Timestamp: 2024-12-09

import {
  ProxyProviderService,
  ProxyUrl,
  ProxyTestResult,
  PacketstreamConfig,
} from './base';

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
} as const;

const PROXY_HOST = 'proxy.packetstream.io';

/**
 * PacketstreamProvider
 * 
 * Implementazione del provider proxy Packetstream.
 * Supporta proxy HTTP e SOCKS5 con rotazione geografica.
 */
export class PacketstreamProvider implements ProxyProviderService {
  readonly name = 'packetstream';
  readonly displayName = 'Packetstream';

  private config: PacketstreamConfig;

  constructor(config: PacketstreamConfig) {
    this.config = config;
  }

  /**
   * Genera URL proxy Packetstream
   */
  getProxyUrl(country?: string, preferHttp: boolean = true): ProxyUrl {
    const targetCountry = country || this.config.defaultCountry || 'Italy';
    
    // Formatta auth key con country
    let authKeyFormatted = this.config.authKey;
    
    // Se authKey contiene già _country-, aggiornalo
    if (authKeyFormatted.includes('_country-')) {
      authKeyFormatted = authKeyFormatted.replace(
        /_country-[^_]+/,
        `_country-${targetCountry}`
      );
    } else {
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
  async testConnection(country?: string): Promise<ProxyTestResult> {
    const startTime = Date.now();
    
    try {
      const proxyUrl = this.getProxyUrl(country, true); // Usa HTTP per il test
      
      // Usa ip-api.com per verificare l'IP
      const response = await this.fetchWithProxy(
        'http://ip-api.com/json',
        proxyUrl.url
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json() as { query: string; country: string; city: string };

      return {
        success: true,
        ip: data.query,
        country: data.country,
        city: data.city,
        latencyMs,
      };
    } catch (error) {
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
  validateConfig(): boolean {
    return !!(
      this.config.username &&
      this.config.username.trim() &&
      this.config.authKey &&
      this.config.authKey.trim() &&
      // Username non deve contenere caratteri speciali URL
      !/[:\/@]/.test(this.config.username)
    );
  }

  /**
   * Fetch con proxy HTTP
   * Nota: In Node.js, per usare proxy con fetch nativo servono moduli aggiuntivi
   * come undici o node-fetch con proxy-agent
   */
  private async fetchWithProxy(url: string, proxyUrl: string): Promise<Response> {
    // Per Node.js, usiamo un approccio con proxy-agent
    // In produzione, potresti usare undici o https-proxy-agent
    
    try {
      // Prova prima con il modulo undici se disponibile
      const { ProxyAgent, fetch: undiciFetch } = await import('undici');
      
      const proxyAgent = new ProxyAgent(proxyUrl);
      
      return await undiciFetch(url, {
        dispatcher: proxyAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }) as unknown as Response;
    } catch {
      // Fallback: usa curl via child_process (più affidabile per test)
      return this.fetchWithCurl(url, proxyUrl);
    }
  }

  /**
   * Fallback: usa curl per fetch con proxy
   */
  private async fetchWithCurl(url: string, proxyUrl: string): Promise<Response> {
    const { execSync } = await import('child_process');
    
    try {
      const result = execSync(
        `curl -s -x "${proxyUrl}" "${url}" -A "Mozilla/5.0" --max-time 30`,
        { encoding: 'utf-8', timeout: 35000 }
      );
      
      return new Response(result, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      throw new Error(`Curl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Factory function per creare istanze Packetstream
 */
export function createPacketstreamProvider(config: PacketstreamConfig): PacketstreamProvider {
  return new PacketstreamProvider(config);
}


