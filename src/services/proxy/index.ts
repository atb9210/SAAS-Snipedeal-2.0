// src/services/proxy/index.ts - Export proxy services
// Timestamp: 2024-12-09

// Base types and interfaces
export type {
  ProxyConfig,
  ProxyUrl,
  ProxyTestResult,
  PacketstreamConfig,
  BrightDataConfig,
  ProviderConfig,
  ProxyProviderService,
  ProxyProviderData,
  ProxyProviderFactory,
} from './base';

// Providers
export { PacketstreamProvider, createPacketstreamProvider } from './packetstream';

// Manager
export { ProxyManager, getProxyManager, resetProxyManager } from './manager';

// Default export: singleton manager
export { default } from './manager';


