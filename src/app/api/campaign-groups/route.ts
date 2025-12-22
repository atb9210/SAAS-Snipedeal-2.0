// src/app/api/campaign-groups/route.ts - API per creare gruppo campagne multi-platform
// Timestamp: 2024-12-22

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { addScraperJob } from '@/lib/queue';

// Schema validazione creazione gruppo campagne
const createCampaignGroupSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(100),
  keyword: z.string().min(1, 'Keyword richiesta').max(200),
  platforms: z.array(z.enum(['SUBITO', 'EBAY', 'VINTED', 'WALLAPOP'])).min(1, 'Seleziona almeno una piattaforma'),
  minPrice: z.number().min(0).nullable().optional(),
  maxPrice: z.number().min(0).nullable().optional(),
  includeKeywords: z.string().nullable().optional(),
  excludeKeywords: z.string().nullable().optional(),
  platformFilters: z.record(z.record(z.unknown())).nullable().optional(),
});

// POST - Crea gruppo + campagne
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCampaignGroupSchema.parse(body);

    // Crea il gruppo
    const group = await prisma.campaignGroup.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        keyword: validatedData.keyword,
        minPrice: validatedData.minPrice || null,
        maxPrice: validatedData.maxPrice || null,
        includeKeywords: validatedData.includeKeywords || null,
        excludeKeywords: validatedData.excludeKeywords || null,
        isActive: true,
      },
    });

    // Crea una campagna per ogni piattaforma selezionata
    const campaigns = await Promise.all(
      validatedData.platforms.map(async (platform) => {
        const platformFilter = validatedData.platformFilters?.[platform] || {};
        
        // Estrai filtri specifici per piattaforma
        let region = null;
        let exactMatch = false;
        
        if (platform === 'SUBITO') {
          region = (platformFilter as { region?: string }).region || null;
          exactMatch = (platformFilter as { exactMatch?: boolean }).exactMatch || false;
        }

        const campaign = await prisma.campaign.create({
          data: {
            userId: session.user.id,
            groupId: group.id,
            name: `${validatedData.name} - ${platform}`,
            keyword: validatedData.keyword,
            platform: platform as 'SUBITO' | 'EBAY' | 'VINTED' | 'WALLAPOP',
            minPrice: validatedData.minPrice || null,
            maxPrice: validatedData.maxPrice || null,
            region,
            exactMatch,
            includeKeywords: validatedData.includeKeywords || null,
            excludeKeywords: validatedData.excludeKeywords || null,
            platformFilters: Object.keys(platformFilter).length > 0 ? (platformFilter as object) : undefined,
            isActive: true,
          },
        });

        // Avvia job di scraping per questa campagna
        try {
          await addScraperJob({
            campaignId: campaign.id,
            userId: session.user.id,
          });
          console.log(`[CampaignGroup] Scraper job queued for campaign ${campaign.id} (${platform})`);
        } catch (jobError) {
          console.error(`[CampaignGroup] Failed to queue job for ${campaign.id}:`, jobError);
        }

        return campaign;
      })
    );

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        keyword: group.keyword,
        platforms: validatedData.platforms,
        campaignCount: campaigns.length,
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        platform: c.platform,
        name: c.name,
      })),
    });

  } catch (error) {
    console.error('[CampaignGroup] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// GET - Lista gruppi campagne dell'utente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const groups = await prisma.campaignGroup.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        campaigns: {
          select: {
            id: true,
            platform: true,
            isActive: true,
            totalResults: true,
            newResults: true,
            lastRunAt: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Tipo per campagna nel gruppo
    type GroupCampaign = {
      id: string;
      platform: string;
      isActive: boolean;
      totalResults: number;
      newResults: number;
      lastRunAt: Date | null;
    };

    // Aggrega statistiche per gruppo
    const groupsWithStats = groups.map((group: typeof groups[0]) => ({
      id: group.id,
      name: group.name,
      keyword: group.keyword,
      platforms: group.campaigns.map((c: GroupCampaign) => c.platform),
      isActive: group.isActive,
      totalResults: group.campaigns.reduce((sum: number, c: GroupCampaign) => sum + c.totalResults, 0),
      newResults: group.campaigns.reduce((sum: number, c: GroupCampaign) => sum + c.newResults, 0),
      lastRunAt: group.campaigns.reduce((latest: Date | null, c: GroupCampaign) => {
        if (!c.lastRunAt) return latest;
        if (!latest) return c.lastRunAt;
        return c.lastRunAt > latest ? c.lastRunAt : latest;
      }, null as Date | null),
      campaignCount: group._count.campaigns,
      createdAt: group.createdAt,
    }));

    return NextResponse.json(groupsWithStats);

  } catch (error) {
    console.error('[CampaignGroup] GET Error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
