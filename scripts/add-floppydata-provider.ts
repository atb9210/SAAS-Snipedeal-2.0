// scripts/add-floppydata-provider.ts - Add Floppydata provider to database
// Usage: npx tsx scripts/add-floppydata-provider.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Floppydata provider to database...\n');

  const apiKey = process.env.FLOPPYDATA_API_KEY;
  if (!apiKey) {
    console.error('Error: FLOPPYDATA_API_KEY environment variable is required');
    process.exit(1);
  }

  const baseUrl = process.env.FLOPPYDATA_BASE_URL || 'https://client-api.floppy.host';
  const defaultCountry = process.env.FLOPPYDATA_DEFAULT_COUNTRY || 'IT';

  const provider = await prisma.proxyProvider.upsert({
    where: { name: 'floppydata' },
    update: {
      displayName: 'Floppydata Webunlocker',
      isEnabled: true,
      isDefault: true,
      config: {
        apiKey,
        baseUrl,
        defaultCountry,
      },
    },
    create: {
      name: 'floppydata',
      displayName: 'Floppydata Webunlocker',
      isEnabled: true,
      isDefault: true,
      config: {
        apiKey,
        baseUrl,
        defaultCountry,
      },
    },
  });

  console.log('✓ Floppydata provider added/updated successfully');
  console.log(`  ID: ${provider.id}`);
  console.log(`  Name: ${provider.name}`);
  console.log(`  Display Name: ${provider.displayName}`);
  console.log(`  Enabled: ${provider.isEnabled}`);
  console.log(`  Default: ${provider.isDefault}`);
}

main()
  .catch((e) => {
    console.error('Error adding Floppydata provider:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
