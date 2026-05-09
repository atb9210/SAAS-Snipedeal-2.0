// tests/__tests__/floppydata.test.ts - Unit tests for FloppydataProvider
// Timestamp: 2026-05-09

import { FloppydataProvider, FloppydataConfig } from '../../src/services/proxy/floppydata';

describe('FloppydataProvider', () => {
  let provider: FloppydataProvider;
  let config: FloppydataConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      baseUrl: 'https://client-api.floppy.host',
      defaultCountry: 'IT',
    };
    provider = new FloppydataProvider(config);
  });

  describe('validateConfig', () => {
    it('should return true for valid config', () => {
      expect(provider.validateConfig()).toBe(true);
    });

    it('should return false for missing apiKey', () => {
      provider = new FloppydataProvider({
        ...config,
        apiKey: '',
      });
      expect(provider.validateConfig()).toBe(false);
    });

    it('should return false for missing baseUrl', () => {
      provider = new FloppydataProvider({
        ...config,
        baseUrl: '',
      });
      expect(provider.validateConfig()).toBe(false);
    });

    it('should return false for missing defaultCountry', () => {
      provider = new FloppydataProvider({
        ...config,
        defaultCountry: '',
      });
      expect(provider.validateConfig()).toBe(false);
    });
  });

  describe('getProxyUrl', () => {
    it('should return dummy proxy URL for compatibility', () => {
      const proxyUrl = provider.getProxyUrl('IT', true);
      expect(proxyUrl.url).toBe('');
      expect(proxyUrl.protocol).toBe('http');
      expect(proxyUrl.host).toBe('');
      expect(proxyUrl.port).toBe(0);
    });
  });

  describe('name and displayName', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('floppydata');
    });

    it('should have correct displayName', () => {
      expect(provider.displayName).toBe('Floppydata Webunlocker');
    });
  });
});
