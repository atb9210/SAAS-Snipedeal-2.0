// tests/test-subito-floppydata-integration.ts - Test integration Floppydata with SubitoScraper
// Timestamp: 2026-05-09

import { SubitoScraper } from '../src/services/scrapers/subito';

async function testSubitoFloppydataIntegration() {
  console.log('=== TEST SUBITO FLOPPYDATA INTEGRATION ===\n');

  const scraper = new SubitoScraper();

  try {
    const result = await scraper.scrape({
      keyword: 'iphone',
      maxPages: 1,
    });

    console.log(`Success: ${result.success}`);
    console.log(`Total found: ${result.totalFound}`);
    console.log(`Ads count: ${result.ads.length}`);

    if (result.ads.length > 0) {
      console.log('\nFirst 3 ads:');
      result.ads.slice(0, 3).forEach((ad, i) => {
        console.log(`${i + 1}. ${ad.title}`);
        console.log(`   Price: ${ad.price}`);
        console.log(`   Location: ${ad.location}`);
        console.log(`   Link: ${ad.link}`);
      });
    }

    if (result.error) {
      console.log(`\nError: ${result.error}`);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testSubitoFloppydataIntegration()
  .catch(console.error)
  .finally(() => process.exit(0));
