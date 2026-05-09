// src/services/proxy/floppydata.ts - Provider Floppydata Webunlocker
// Timestamp: 2026-05-09

import {
  ProxyProviderService,
  ProxyUrl,
  ProxyTestResult,
  FloppydataConfig,
} from './base';

export type { FloppydataConfig };

/**
 * FloppydataProvider
 * 
 * Implementazione del provider Floppydata Webunlocker.
 * Fornisce browser+proxy integrati per bypassare protezioni anti-bot.
 * Restituisce HTML completo invece di URL proxy.
 */
export class FloppydataProvider implements ProxyProviderService {
  readonly name = 'floppydata';
  readonly displayName = 'Floppydata Webunlocker';

  private config: FloppydataConfig;

  constructor(config: FloppydataConfig) {
    this.config = config;
  }

  /**
   * Genera URL proxy (fittizio per compatibilità con ProxyProviderService)
   * Floppydata non restituisce URL proxy ma HTML completo
   */
  getProxyUrl(country?: string, preferHttp: boolean = true): ProxyUrl {
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
  async testConnection(country?: string): Promise<ProxyTestResult> {
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
      this.config.apiKey &&
      this.config.apiKey.trim() &&
      this.config.baseUrl &&
      this.config.baseUrl.trim() &&
      this.config.defaultCountry &&
      this.config.defaultCountry.trim()
    );
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
  async fetchHtml(
    url: string,
    country?: string,
    difficulty: 'low' | 'medium' = 'low',
    expiration: number = 0
  ): Promise<string | null> {
    try {
      const targetCountry = country || this.config.defaultCountry;

      const requestBody = {
        url,
        country: targetCountry,
        difficulty,
        expiration,
      };

      console.log(`[FloppydataProvider] Request:`, {
        url: `${this.config.baseUrl}/v1/webUnlocker`,
        targetUrl: url,
        country: targetCountry,
        difficulty,
        expiration,
      });

      const response = await fetch(`${this.config.baseUrl}/v1/webUnlocker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[FloppydataProvider] Response:`, {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FloppydataProvider] HTTP ${response.status}: ${response.statusText}`);
        console.error(`[FloppydataProvider] Error body:`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`[FloppydataProvider] Success:`, {
        hasHtml: !!data.html,
        htmlLength: data.html?.length || 0,
      });

      // DEBUG: dump HTML to /tmp/floppydata-dumps for inspection
      if (process.env.FLOPPYDATA_DEBUG_DUMP === '1' && data.html) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const dir = '/tmp/floppydata-dumps';
          fs.mkdirSync(dir, { recursive: true });
          const safeUrl = url.replace(/[^a-z0-9]/gi, '_').substring(0, 80);
          const ts = Date.now();
          const filename = path.join(dir, `${ts}_${safeUrl}_${data.html.length}b.html`);
          fs.writeFileSync(filename, data.html);
          console.log(`[FloppydataProvider] HTML dumped: ${filename}`);
        } catch (e) {
          console.error(`[FloppydataProvider] Dump error:`, e);
        }
      }

      return data.html || null;
    } catch (error) {
      console.error(`[FloppydataProvider] Fetch error:`, error);
      return null;
    }
  }
}

/**
 * Factory function per creare istanze Floppydata
 */
export function createFloppydataProvider(config: FloppydataConfig): FloppydataProvider {
  return new FloppydataProvider(config);
}
