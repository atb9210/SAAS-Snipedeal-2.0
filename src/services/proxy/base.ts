// src/services/proxy/base.ts - Interface base per i provider proxy
// Timestamp: 2024-12-09

/**
 * Configurazione proxy generica
 */
export interface ProxyConfig {
  protocol: 'http' | 'https' | 'socks5' | 'socks5h';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * URL proxy completo
 */
export interface ProxyUrl {
  url: string;           // URL completo: protocol://user:pass@host:port
  protocol: string;
  host: string;
  port: number;
}

/**
 * Risultato test connessione
 */
export interface ProxyTestResult {
  success: boolean;
  ip?: string;
  country?: string;
  city?: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Configurazione specifica Packetstream
 */
export interface PacketstreamConfig {
  username: string;
  authKey: string;
  defaultCountry: string;
}

/**
 * Configurazione specifica BrightData (futuro)
 */
export interface BrightDataConfig {
  zone: string;
  username: string;
  password: string;
}

/**
 * Union di tutte le configurazioni supportate
 */
export type ProviderConfig = PacketstreamConfig | BrightDataConfig | Record<string, unknown>;

/**
 * Interface che ogni provider proxy deve implementare
 */
export interface ProxyProviderService {
  /**
   * Nome identificativo del provider (lowercase)
   */
  readonly name: string;

  /**
   * Nome visualizzato
   */
  readonly displayName: string;

  /**
   * Genera URL proxy per un paese specifico
   * @param country Paese per il proxy (default: Italy)
   * @param preferHttp Se true, preferisce HTTP invece di SOCKS5
   */
  getProxyUrl(country?: string, preferHttp?: boolean): ProxyUrl;

  /**
   * Testa la connessione proxy
   * @param country Paese per il test
   */
  testConnection(country?: string): Promise<ProxyTestResult>;

  /**
   * Valida la configurazione
   */
  validateConfig(): boolean;
}

/**
 * Dati provider dal database
 */
export interface ProxyProviderData {
  id: string;
  name: string;
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  config: ProviderConfig;
}

/**
 * Factory function type per creare istanze di provider
 */
export type ProxyProviderFactory = (config: ProviderConfig) => ProxyProviderService;


