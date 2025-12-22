// src/app/(dashboard)/campaigns/[id]/page.tsx - Dettaglio Campagna
// Timestamp: 2024-12-09

// Forza rendering dinamico (non SSG durante build)
export const dynamic = 'force-dynamic';

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

  // Prima prova a trovare una campagna singola
  let campaign = await prisma.campaign.findFirst({
    where: { 
      id: params.id,
      userId: session.user.id,
    },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          favorites: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          },
        },
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

  // Se non trovata, potrebbe essere un groupId - carica TUTTE le campagne del gruppo
  let isGroupView = false;
  let groupCampaigns: typeof campaign[] = [];
  
  if (!campaign) {
        // Cerca tutte le campagne del gruppo
    groupCampaigns = await prisma.campaign.findMany({
      where: { 
        groupId: params.id,
        userId: session.user.id,
      },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Più risultati per gruppo
          include: {
            favorites: {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
              },
            },
          },
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
    
        
    if (groupCampaigns.length > 0) {
      isGroupView = true;
      // Crea una campagna "virtuale" con risultati aggregati di tutte le piattaforme
      const firstCampaign = groupCampaigns[0]!;
      
      // Filtra campagne non null
      const validCampaigns = groupCampaigns.filter((c): c is NonNullable<typeof c> => c !== null);
      
      // Aggrega tutti i risultati da tutte le campagne del gruppo
      const allResults = validCampaigns.flatMap(c => 
        c.results.map((r: any) => ({
          ...r,
          // Aggiungi info sulla piattaforma di origine
          sourcePlatform: c.platform,
        }))
      );
      
      const sortedResults = allResults.slice(0, 100); // Senza ordinamento per vedere tutti i risultati
      
      // Calcola conteggio totale
      const totalResults = validCampaigns.reduce((sum, c) => sum + c._count.results, 0);
      
      // Aggrega jobLogs
      const allJobLogs = validCampaigns.flatMap(c => c.jobLogs)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 10);
      
      // Crea oggetto campagna aggregata - costruisci manualmente per evitare che spread sovrascriva results
      campaign = {
        id: firstCampaign.id,
        userId: firstCampaign.userId,
        groupId: firstCampaign.groupId,
        name: firstCampaign.name.replace(/ - (SUBITO|EBAY|VINTED|WALLAPOP)$/, ''),
        keyword: firstCampaign.keyword,
        platform: validCampaigns.map(c => c.platform).join(',') as any, // Piattaforme aggregate per il client (UI only)
        minPrice: firstCampaign.minPrice,
        maxPrice: firstCampaign.maxPrice,
        region: firstCampaign.region,
        exactMatch: firstCampaign.exactMatch,
        includeKeywords: firstCampaign.includeKeywords,
        excludeKeywords: firstCampaign.excludeKeywords,
        platformFilters: firstCampaign.platformFilters,
        isActive: firstCampaign.isActive,
        lastRunAt: firstCampaign.lastRunAt,
        nextRunAt: firstCampaign.nextRunAt,
        totalResults: totalResults,
        newResults: firstCampaign.newResults,
        createdAt: firstCampaign.createdAt,
        updatedAt: firstCampaign.updatedAt,
        results: sortedResults, // Risultati aggregati e ordinati da tutte le piattaforme
        _count: { results: totalResults },
        jobLogs: allJobLogs,
      };
    }
  }

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
    results: campaign.results.map((r: any) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      isFavorited: r.favorites && r.favorites.length > 0,
    })),
  };

  return (
    <CampaignDetailClient 
      key={`${campaign.id}-${campaign.results.length}`}
      campaign={serializedCampaign}
      frequencyMins={user?.plan?.frequencyMins || 180}
    />
  );
}

