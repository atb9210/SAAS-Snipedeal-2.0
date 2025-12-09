// src/app/(dashboard)/campaigns/[id]/page.tsx - Dettaglio Campagna
// Timestamp: 2024-12-09

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CampaignDetailClient } from './campaign-detail-client';

interface PageProps {
  params: { id: string };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const campaign = await prisma.campaign.findFirst({
    where: { 
      id: params.id,
      userId: session.user.id,
    },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      _count: { 
        select: { 
          results: true,
        } 
      },
      jobLogs: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  // Get user plan for frequency info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { plan: true },
  });

  // Marca i risultati come visti (isNew: false) quando l'utente apre la campagna
  // Questo resetta il contatore "Nuovi" nel widget
  await prisma.result.updateMany({
    where: { 
      campaignId: params.id,
      isNew: true,
    },
    data: { isNew: false },
  });

  // Serializza i dati per il client component (le Date devono essere stringhe)
  const serializedCampaign = {
    ...campaign,
    lastRunAt: campaign.lastRunAt?.toISOString() || null,
    nextRunAt: campaign.nextRunAt?.toISOString() || null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    results: campaign.results.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };

  return (
    <CampaignDetailClient 
      campaign={serializedCampaign}
      frequencyMins={user?.plan?.frequencyMins || 180}
    />
  );
}

