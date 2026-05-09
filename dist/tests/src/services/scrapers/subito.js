"use strict";
// src/services/scrapers/subito.ts - Scraper Subito.it
// Port da PHP a TypeScript
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
exports.SubitoScraper = void 0;
exports.createSubitoScraper = createSubitoScraper;
const playwright_1 = require("playwright");
const base_1 = require("./base");
const proxy_1 = require("../proxy");
// Mappa regioni italiane -> URL Subito.it
const REGION_URL_MAP = {
    'Piemonte': 'piemonte',
    'Valle d\'Aosta': 'valle-d-aosta',
    'Lombardia': 'lombardia',
    'Trentino-Alto Adige': 'trentino-alto-adige',
    'Veneto': 'veneto',
    'Friuli-Venezia Giulia': 'friuli-venezia-giulia',
    'Liguria': 'liguria',
    'Emilia-Romagna': 'emilia-romagna',
    'Toscana': 'toscana',
    'Umbria': 'umbria',
    'Marche': 'marche',
    'Lazio': 'lazio',
    'Abruzzo': 'abruzzo',
    'Molise': 'molise',
    'Campania': 'campania',
    'Puglia': 'puglia',
    'Basilicata': 'basilicata',
    'Calabria': 'calabria',
    'Sicilia': 'sicilia',
    'Sardegna': 'sardegna',
};
class SubitoScraper extends base_1.BaseScraper {
    constructor() {
        super('SubitoScraper', 'https://www.subito.it');
        this.browser = null;
        this.proxy = null;
        this.proxyProviderId = null;
        this.exactMatch = false;
    }
    async scrape(options) {
        const { keyword, minPrice, maxPrice, region, maxPages = 3, exactMatch = false } = options;
        this.exactMatch = exactMatch;
        this.log(`Starting scrape for: "${keyword}"${region ? ` in ${region}` : ''}`);
        // Ottieni proxy dal ProxyManager (GLOBALE per tutti gli utenti)
        try {
            const proxyManager = (0, proxy_1.getProxyManager)();
            this.proxy = await proxyManager.getProxy('Italy', true);
            if (this.proxy) {
                this.log(`Using proxy: ${this.proxy.host}:${this.proxy.port}`);
                // Salva provider ID per logging
                const providers = await proxyManager['providers'];
                this.proxyProviderId = providers?.keys().next().value || null;
            }
            else {
                this.log('No proxy available, scraping without proxy', 'warn');
            }
        }
        catch (proxyError) {
            this.log(`Proxy error: ${proxyError}, continuing without proxy`, 'warn');
            this.proxy = null;
        }
        try {
            // Prima prova scraping con Floppydata (primary - bypassa DataDome)
            this.log('Trying Floppydata Webunlocker...');
            const floppydataResult = await this.scrapeViaFloppydata(keyword, region, maxPages);
            if (floppydataResult.ads.length > 0) {
                // Filtra per prezzo
                const filteredAds = floppydataResult.ads.filter(ad => this.matchesPriceFilter(ad.price, minPrice, maxPrice));
                this.log(`Floppydata: Found ${filteredAds.length} ads (filtered from ${floppydataResult.ads.length})`);
                return {
                    success: true,
                    ads: filteredAds,
                    totalFound: filteredAds.length,
                    scrapedAt: new Date(),
                };
            }
            // Fallback 1: prova scraping HTTP con proxy
            this.log('Floppydata returned no results, trying HTTP with proxy...');
            const httpResult = await this.scrapeViaHttp(keyword, region, maxPages);
            if (httpResult.ads.length > 0) {
                // Filtra per prezzo
                const filteredAds = httpResult.ads.filter(ad => this.matchesPriceFilter(ad.price, minPrice, maxPrice));
                this.log(`HTTP: Found ${filteredAds.length} ads (filtered from ${httpResult.ads.length})`);
                return {
                    success: true,
                    ads: filteredAds,
                    totalFound: filteredAds.length,
                    scrapedAt: new Date(),
                };
            }
            // Fallback 2: prova con Playwright (browser headless)
            this.log('HTTP scraping returned no results, trying Playwright...');
            const playwrightResult = await this.scrapeViaPlaywright(keyword, region, maxPages);
            const filteredAds = playwrightResult.ads.filter(ad => this.matchesPriceFilter(ad.price, minPrice, maxPrice));
            return {
                success: true,
                ads: filteredAds,
                totalFound: filteredAds.length,
                scrapedAt: new Date(),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.log(`Scraping failed: ${errorMessage}`, 'error');
            return {
                success: false,
                ads: [],
                totalFound: 0,
                error: errorMessage,
                scrapedAt: new Date(),
            };
        }
        finally {
            await this.closeBrowser();
        }
    }
    async scrapeViaFloppydata(keyword, region, maxPages) {
        const ads = [];
        try {
            const proxyManager = (0, proxy_1.getProxyManager)();
            await proxyManager.initialize();
            // Ottieni provider Floppydata
            const floppydataProvider = proxyManager['providers'].get('floppydata');
            if (!floppydataProvider) {
                this.log('Floppydata provider not found', 'warn');
                return { ads };
            }
            for (let page = 1; page <= maxPages; page++) {
                try {
                    const url = this.buildUrl(keyword, region, page);
                    this.log(`Floppydata: fetching page ${page}`);
                    const html = await floppydataProvider.fetchHtml(url, 'Italy');
                    if (!html) {
                        this.log(`Floppydata failed on page ${page}`, 'warn');
                        continue;
                    }
                    const pageAds = this.parseNextJsData(html);
                    this.log(`Floppydata page ${page}: found ${pageAds.length} ads`);
                    ads.push(...pageAds);
                }
                catch (error) {
                    this.log(`Floppydata error on page ${page}: ${error}`, 'warn');
                }
            }
        }
        catch (error) {
            this.log(`Floppydata provider error: ${error}`, 'warn');
        }
        return { ads };
    }
    async scrapeViaHttp(keyword, region, maxPages) {
        const ads = [];
        for (let page = 1; page <= maxPages; page++) {
            try {
                const url = this.buildUrl(keyword, region, page);
                this.log(`Fetching page ${page}: ${url}`);
                const html = await this.fetchWithProxy(url);
                if (!html) {
                    this.log(`Failed to fetch page ${page}`, 'warn');
                    continue;
                }
                const pageAds = this.parseNextJsData(html);
                this.log(`Page ${page}: found ${pageAds.length} ads`);
                ads.push(...pageAds);
            }
            catch (error) {
                this.log(`Error on page ${page}: ${error}`, 'warn');
            }
        }
        return { ads };
    }
    /**
     * Fetch URL con proxy (se disponibile)
     */
    async fetchWithProxy(url) {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
        };
        const startTime = Date.now();
        try {
            if (this.proxy) {
                // Usa undici con ProxyAgent se disponibile
                try {
                    const { ProxyAgent, fetch: undiciFetch } = await Promise.resolve().then(() => __importStar(require('undici')));
                    const proxyAgent = new ProxyAgent(this.proxy.url);
                    const response = await undiciFetch(url, {
                        dispatcher: proxyAgent,
                        headers,
                    });
                    if (!response.ok) {
                        this.log(`HTTP ${response.status} via proxy`, 'warn');
                        return null;
                    }
                    // Log successo proxy
                    await this.logProxyUsage(true, Date.now() - startTime);
                    return await response.text();
                }
                catch (undiciError) {
                    // Fallback: usa curl con proxy
                    this.log(`Undici failed, trying curl: ${undiciError}`, 'warn');
                    return this.fetchWithCurl(url, this.proxy.url);
                }
            }
            else {
                // Senza proxy: fetch normale
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    this.log(`HTTP ${response.status}`, 'warn');
                    return null;
                }
                return await response.text();
            }
        }
        catch (error) {
            this.log(`Fetch error: ${error}`, 'error');
            await this.logProxyUsage(false, Date.now() - startTime, String(error));
            return null;
        }
    }
    /**
     * Fallback: usa curl per fetch con proxy
     */
    async fetchWithCurl(url, proxyUrl) {
        try {
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const result = execSync(`curl -s -x "${proxyUrl}" "${url}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" --max-time 30`, { encoding: 'utf-8', timeout: 35000 });
            return result;
        }
        catch (error) {
            this.log(`Curl failed: ${error}`, 'error');
            return null;
        }
    }
    /**
     * Log utilizzo proxy
     */
    async logProxyUsage(success, latencyMs, error) {
        if (!this.proxyProviderId)
            return;
        try {
            const proxyManager = (0, proxy_1.getProxyManager)();
            await proxyManager.logUsage(this.proxyProviderId, success, undefined, // campaignId viene passato dal worker
            latencyMs, undefined, // ipUsed
            'Italy', error);
        }
        catch {
            // Ignore logging errors
        }
    }
    async scrapeViaPlaywright(keyword, region, maxPages) {
        const ads = [];
        try {
            // Configura proxy per Playwright se disponibile
            const launchOptions = {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            };
            if (this.proxy) {
                launchOptions.proxy = {
                    server: `${this.proxy.protocol}://${this.proxy.host}:${this.proxy.port}`,
                };
                // Estrai username:password dall'URL proxy
                const proxyUrlMatch = this.proxy.url.match(/\/\/([^:]+):([^@]+)@/);
                if (proxyUrlMatch) {
                    launchOptions.proxy.username = proxyUrlMatch[1];
                    launchOptions.proxy.password = proxyUrlMatch[2];
                }
                this.log(`Playwright using proxy: ${this.proxy.host}:${this.proxy.port}`);
            }
            this.browser = await playwright_1.chromium.launch(launchOptions);
            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                locale: 'it-IT',
            });
            const page = await context.newPage();
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                const url = this.buildUrl(keyword, region, pageNum);
                this.log(`Playwright: loading page ${pageNum}`);
                await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
                // Wait for content
                await page.waitForSelector('body', { timeout: 10000 });
                const html = await page.content();
                const pageAds = this.parseNextJsData(html);
                this.log(`Playwright page ${pageNum}: found ${pageAds.length} ads`);
                ads.push(...pageAds);
                // Small delay between pages
                if (pageNum < maxPages) {
                    await page.waitForTimeout(1000);
                }
            }
            await context.close();
        }
        catch (error) {
            this.log(`Playwright error: ${error}`, 'error');
        }
        return { ads };
    }
    buildUrl(keyword, region, page) {
        let baseUrl = 'https://www.subito.it/annunci-italia/vendita/usato/';
        // Use region-specific URL if provided
        if (region && REGION_URL_MAP[region]) {
            const regionSlug = REGION_URL_MAP[region];
            baseUrl = `https://www.subito.it/annunci-${regionSlug}/vendita/usato/`;
        }
        const params = new URLSearchParams({
            q: keyword,
            order: 'datedesc', // Ordina per più recenti (IMPORTANTE!)
        });
        // Aggiungi qso=true solo se exactMatch è attivo (ricerca solo nel titolo)
        if (this.exactMatch) {
            params.set('qso', 'true');
        }
        if (page > 1) {
            params.set('o', page.toString());
        }
        return `${baseUrl}?${params.toString()}`;
    }
    parseNextJsData(html) {
        const ads = [];
        try {
            // Extract __NEXT_DATA__ JSON (Subito.it uses Next.js)
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
            if (!nextDataMatch) {
                this.log('No __NEXT_DATA__ found in HTML', 'warn');
                return ads;
            }
            const jsonData = JSON.parse(nextDataMatch[1]);
            // Navigate to items list
            let itemsList = [];
            // Path 1: props.pageProps.initialState.items.list
            if (jsonData?.props?.pageProps?.initialState?.items?.list) {
                itemsList = jsonData.props.pageProps.initialState.items.list;
            }
            // Path 2: Try to find recursively
            else {
                itemsList = this.findInObject(jsonData, 'list') || [];
            }
            for (const listItem of itemsList) {
                const item = listItem.item || listItem;
                // Skip non-ad items
                if (item.kind !== 'AdItem' && !item.subject)
                    continue;
                // Extract price (solo il valore numerico, normalizePrice aggiungerà €)
                let price = null;
                if (item.features?.['/price']?.values?.[0]?.value) {
                    price = String(item.features['/price'].values[0].value);
                }
                // Extract location
                let location = '';
                if (item.geo?.town?.value) {
                    location = item.geo.town.value;
                }
                if (item.geo?.city?.shortName) {
                    location += ` (${item.geo.city.shortName})`;
                }
                // Extract image
                let image = null;
                if (item.images?.[0]?.cdnBaseUrl) {
                    image = item.images[0].cdnBaseUrl;
                }
                // Check shipping
                const hasShipping = item.features?.['/item_shippable']?.values?.[0]?.key === '1';
                ads.push({
                    title: item.subject || 'Senza titolo',
                    price: this.normalizePrice(price),
                    location: location.trim() || null,
                    link: item.urls?.default || '',
                    image,
                    status: 'available',
                    hasShipping,
                    date: item.date || null,
                });
            }
        }
        catch (error) {
            this.log(`Error parsing Next.js data: ${error}`, 'error');
        }
        return ads;
    }
    findInObject(obj, key) {
        if (!obj || typeof obj !== 'object')
            return null;
        if (Array.isArray(obj[key])) {
            return obj[key];
        }
        for (const value of Object.values(obj)) {
            if (typeof value === 'object') {
                const result = this.findInObject(value, key);
                if (result)
                    return result;
            }
        }
        return null;
    }
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
exports.SubitoScraper = SubitoScraper;
// Factory function
function createSubitoScraper() {
    return new SubitoScraper();
}
