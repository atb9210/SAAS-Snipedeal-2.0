// prisma/seed.ts - Seeder per database SnipeDeal 2.0 PWA
// Crea piani abbonamento e utenti default (admin + user)
// Timestamp: 2024-12-09

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // SEED PIANI ABBONAMENTO
  // ============================================
  console.log('📋 Creating subscription plans...');

  const plans = [
    {
      name: 'Free',
      description: 'Piano gratuito per iniziare',
      maxCampaigns: 1,
      maxMarketplaces: 1,
      frequencyMins: 180, // 3 ore
      priceYear: 0,
    },
    {
      name: 'Hobby',
      description: 'Per chi cerca occasionalmente',
      maxCampaigns: 3,
      maxMarketplaces: 2,
      frequencyMins: 60, // 1 ora
      priceYear: 0, // Gratuito per ora
    },
    {
      name: 'Pro',
      description: 'Per cacciatori di affari seri',
      maxCampaigns: 5,
      maxMarketplaces: 5,
      frequencyMins: 15, // 15 minuti
      priceYear: 199,
    },
    {
      name: 'Ultra',
      description: 'Il massimo della velocità',
      maxCampaigns: 10,
      maxMarketplaces: 5,
      frequencyMins: 5, // 5 minuti
      priceYear: 299,
    },
    {
      name: 'Dev',
      description: 'Piano sviluppatore per testing (uso interno)',
      maxCampaigns: 100, // Praticamente illimitate
      maxMarketplaces: 5, // Tutti
      frequencyMins: 1, // 1 minuto - per testare velocemente
      priceYear: 0, // Interno
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ Plan "${plan.name}" created/updated`);
  }

  // ============================================
  // SEED UTENTI DEFAULT
  // ============================================
  console.log('👤 Creating default users...');

  // Ottieni piano Free per utente normale
  const freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } });
  // Ottieni piano Ultra per admin
  const ultraPlan = await prisma.plan.findUnique({ where: { name: 'Ultra' } });
  // Ottieni piano Dev per testing
  const devPlan = await prisma.plan.findUnique({ where: { name: 'Dev' } });

  // Password hash
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);
  const devPassword = await bcrypt.hash('dev123', 12);

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@snipedeal.it' },
    update: {
      name: 'Admin',
      password: adminPassword,
      role: Role.ADMIN,
      planId: ultraPlan?.id,
    },
    create: {
      email: 'admin@snipedeal.it',
      name: 'Admin',
      password: adminPassword,
      role: Role.ADMIN,
      planId: ultraPlan?.id,
    },
  });
  console.log('  ✅ Admin user created (admin@snipedeal.it / admin123)');

  // Normal user
  await prisma.user.upsert({
    where: { email: 'user@snipedeal.it' },
    update: {
      name: 'Demo User',
      password: userPassword,
      role: Role.USER,
      planId: freePlan?.id,
    },
    create: {
      email: 'user@snipedeal.it',
      name: 'Demo User',
      password: userPassword,
      role: Role.USER,
      planId: freePlan?.id,
    },
  });
  console.log('  ✅ Demo user created (user@snipedeal.it / user123)');

  // Dev user - per testing con campagne illimitate e frequenza 1 minuto
  await prisma.user.upsert({
    where: { email: 'dev@snipedeal.it' },
    update: {
      name: 'Dev Tester',
      password: devPassword,
      role: Role.USER,
      planId: devPlan?.id,
    },
    create: {
      email: 'dev@snipedeal.it',
      name: 'Dev Tester',
      password: devPassword,
      role: Role.USER,
      planId: devPlan?.id,
    },
  });
  console.log('  ✅ Dev user created (dev@snipedeal.it / dev123) - Piano Dev: 100 campagne, 1 min frequenza');

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Default credentials:');
  console.log('   Admin: admin@snipedeal.it / admin123');
  console.log('   User:  user@snipedeal.it / user123');
  console.log('   Dev:   dev@snipedeal.it / dev123 (100 campagne, 1 min freq)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

