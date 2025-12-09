// src/app/(dashboard)/campaigns/page.tsx - Lista Campagne
// Timestamp: 2024-12-09

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const [campaigns, user] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { 
          select: { 
            results: true,
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    }),
  ]);

  const planLimits = {
    maxCampaigns: user?.plan?.maxCampaigns || 1,
    maxMarketplaces: user?.plan?.maxMarketplaces || 1,
    planName: user?.plan?.name || 'Free',
  };

  // Serializza le date per il client component
  const serializedCampaigns = campaigns.map(c => ({
    ...c,
    lastRunAt: c.lastRunAt?.toISOString() || null,
    nextRunAt: c.nextRunAt?.toISOString() || null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <CampaignsClient 
      initialCampaigns={serializedCampaigns}
      planLimits={planLimits}
    />
  );
}


