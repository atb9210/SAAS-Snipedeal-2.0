// scripts/add-floppydata-provider.ts - Add Floppydata provider to database
// Usage: npx tsx scripts/add-floppydata-provider.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Floppydata provider to database...\n');

  const provider = await prisma.proxyProvider.upsert({
    where: { name: 'floppydata' },
    update: {
      displayName: 'Floppydata Webunlocker',
      isEnabled: true,
      isDefault: true,
      config: {
        apiKey: 'bniEz9eGfe1xtwtjXNLWBkWMtkQPHqQE',
        baseUrl: 'https://client-api.floppy.host',
        defaultCountry: 'IT',
      },
    },
    create: {
      name: 'floppydata',
      displayName: 'Floppydata Webunlocker',
      isEnabled: true,
      isDefault: true,
      config: {
        apiKey: 'bniEz9eGfe1xtwtjXNLWBkWMtkQPHqQE',
        baseUrl: 'https://client-api.floppy.host',
        defaultCountry: 'IT',
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
