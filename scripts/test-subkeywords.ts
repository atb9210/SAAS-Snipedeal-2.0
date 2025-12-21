// Script per testare subKeywords - elimina campagne e crea 10 test su diversi marketplace
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestCampaign {
  name: string;
  keyword: string;
  platform: 'SUBITO' | 'EBAY' | 'VINTED' | 'FACEBOOK';
  subKeywords: Array<{
    model: string;
    exclude?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    notify: boolean;
  }>;
  globalExclude?: string;
}

const testCampaigns: TestCampaign[] = [
  // SUBITO - 3 campagne
  {
    name: 'Test 1 - iPhone 12 Subito (no pro/max)',
    keyword: 'iphone 12',
    platform: 'SUBITO',
    subKeywords: [
      { model: '12', exclude: 'pro, max', maxPrice: 400, notify: true }
    ],
    globalExclude: 'ricambi, cover, custodia'
  },
  {
    name: 'Test 2 - iPhone Pro Max Subito',
    keyword: 'iphone pro max',
    platform: 'SUBITO',
    subKeywords: [
      { model: '13 pro', minPrice: 300, maxPrice: 600, notify: true },
      { model: '14 pro', minPrice: 400, maxPrice: 800, notify: true },
      { model: '15 pro', minPrice: 600, maxPrice: 1000, notify: false } // notify OFF
    ],
    globalExclude: 'rotto, difettoso, ricambi'
  },
  {
    name: 'Test 3 - MacBook Subito',
    keyword: 'macbook',
    platform: 'SUBITO',
    subKeywords: [
      { model: 'air m1', maxPrice: 800, notify: true },
      { model: 'air m2', maxPrice: 1000, notify: true },
      { model: 'pro m1', maxPrice: 1200, notify: false }
    ],
    globalExclude: 'cover, custodia'
  },
  // EBAY - 3 campagne
  {
    name: 'Test 4 - iPhone eBay',
    keyword: 'iphone',
    platform: 'EBAY',
    subKeywords: [
      { model: '14', exclude: 'pro, max', maxPrice: 500, notify: true },
      { model: '15', exclude: 'pro, max', maxPrice: 700, notify: true }
    ],
    globalExclude: 'ricambi, cover'
  },
  {
    name: 'Test 5 - PlayStation eBay',
    keyword: 'playstation 5',
    platform: 'EBAY',
    subKeywords: [
      { model: 'ps5', exclude: 'slim, pro', maxPrice: 350, notify: true },
      { model: 'slim', maxPrice: 400, notify: true }
    ]
  },
  {
    name: 'Test 6 - iPad eBay',
    keyword: 'ipad',
    platform: 'EBAY',
    subKeywords: [
      { model: 'air', maxPrice: 500, notify: true },
      { model: 'pro 11', maxPrice: 700, notify: false },
      { model: 'mini', maxPrice: 400, notify: true }
    ]
  },
  // VINTED - 2 campagne
  {
    name: 'Test 7 - iPhone Vinted',
    keyword: 'iphone',
    platform: 'VINTED',
    subKeywords: [
      { model: '12', maxPrice: 300, notify: true },
      { model: '13', maxPrice: 400, notify: true }
    ]
  },
  {
    name: 'Test 8 - Samsung Vinted',
    keyword: 'samsung galaxy',
    platform: 'VINTED',
    subKeywords: [
      { model: 's23', maxPrice: 500, notify: true },
      { model: 's24', maxPrice: 700, notify: false }
    ]
  },
  // FACEBOOK - 2 campagne
  {
    name: 'Test 9 - iPhone Facebook',
    keyword: 'iphone',
    platform: 'FACEBOOK',
    subKeywords: [
      { model: '14 pro', maxPrice: 600, notify: true },
      { model: '15 pro', maxPrice: 900, notify: true }
    ],
    globalExclude: 'rotto, schermo rotto'
  },
  {
    name: 'Test 10 - Xbox Facebook',
    keyword: 'xbox series',
    platform: 'FACEBOOK',
    subKeywords: [
      { model: 'series x', maxPrice: 350, notify: true },
      { model: 'series s', maxPrice: 200, notify: true }
    ]
  }
];

async function main() {
  // Trova l'utente
  const user = await prisma.user.findFirst({
    where: { email: { not: undefined } },
    select: { id: true, email: true }
  });

  if (!user) {
    console.log('Nessun utente trovato');
    return;
  }

  console.log(`Utente: ${user.email} (${user.id})`);

  // Elimina tutte le campagne esistenti
  const deleted = await prisma.campaign.deleteMany({
    where: { userId: user.id }
  });
  console.log(`Eliminate ${deleted.count} campagne\n`);

  // Crea le 10 campagne test
  console.log('Creazione campagne test...\n');
  
  for (const tc of testCampaigns) {
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: tc.name,
        keyword: tc.keyword,
        platform: tc.platform,
        isActive: true,
        minPrice: null,
        maxPrice: null,
        includeKeywords: null,
        excludeKeywords: null,
        exactMatch: false,
        nextRunAt: new Date(), // Schedula immediato
        platformFilters: {
          subKeywords: tc.subKeywords,
          globalExclude: tc.globalExclude || null,
          // Aggiungi filtri specifici per piattaforma
          ...(tc.platform === 'EBAY' ? { location: 'IT' } : {}),
          ...(tc.platform === 'FACEBOOK' ? { city: 'Milano' } : {})
        }
      }
    });

    const notifyCount = tc.subKeywords.filter(sk => sk.notify).length;
    const noNotifyCount = tc.subKeywords.filter(sk => !sk.notify).length;
    
    console.log(`✅ ${tc.name}`);
    console.log(`   Platform: ${tc.platform} | Keyword: "${tc.keyword}"`);
    console.log(`   SubKeywords: ${tc.subKeywords.length} (${notifyCount} notify, ${noNotifyCount} silent)`);
    console.log(`   ID: ${campaign.id}\n`);
  }

  console.log('='.repeat(60));
  console.log(`Totale: ${testCampaigns.length} campagne create e schedulate.`);
  console.log('Controlla i log del worker per vedere i risultati.');
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
