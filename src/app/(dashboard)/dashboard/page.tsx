// src/app/(dashboard)/dashboard/page.tsx - Dashboard principale
// Timestamp: 2024-12-09

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  // Fetch dati utente con campagne e risultati recenti
  const [campaigns, recentResults, user] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.result.findMany({
      where: {
        campaign: { userId: session.user.id },
        isNew: true,
      },
      include: {
        campaign: { select: { name: true, platform: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    }),
  ]);

  // Stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.isActive).length,
    newResults: recentResults.length,
    planName: user?.plan?.name || 'Free',
    maxCampaigns: user?.plan?.maxCampaigns || 1,
  };

  // Serializza le date per il client component
  const serializedCampaigns = campaigns.map(c => ({
    ...c,
    lastRunAt: c.lastRunAt?.toISOString() || null,
    nextRunAt: c.nextRunAt?.toISOString() || null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedResults = recentResults.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient 
      user={session.user}
      campaigns={serializedCampaigns}
      recentResults={serializedResults}
      stats={stats}
    />
  );
}


