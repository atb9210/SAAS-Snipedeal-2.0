// src/app/api/campaigns/route.ts - API CRUD Campagne
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { addScraperJob } from '@/lib/queue';

// Schema validazione creazione campagna
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(100),
  keyword: z.string().min(1, 'Keyword richiesta').max(200),
  platform: z.enum(['SUBITO', 'EBAY', 'VINTED', 'WALLAPOP']).default('SUBITO'),
  minPrice: z.number().min(0).nullable().optional(),
  maxPrice: z.number().min(0).nullable().optional(),
  region: z.string().nullable().optional(),
  // Filtri avanzati
  exactMatch: z.boolean().optional().default(false),
  includeKeywords: z.string().nullable().optional(),
  excludeKeywords: z.string().nullable().optional(),
  // Filtri specifici per piattaforma (JSON)
  platformFilters: z.record(z.unknown()).nullable().optional(),
});

// GET - Lista campagne utente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero campagne' },
      { status: 500 }
    );
  }
}

// POST - Crea nuova campagna
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    
    // Valida input
    const validation = createCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verifica limiti piano
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        plan: true,
        campaigns: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const maxCampaigns = user.plan?.maxCampaigns || 1;
    const currentCampaigns = user.campaigns.length;

    if (currentCampaigns >= maxCampaigns) {
      return NextResponse.json(
        { 
          error: `Hai raggiunto il limite di ${maxCampaigns} campagne per il piano ${user.plan?.name || 'Free'}. Effettua l'upgrade per crearne altre.` 
        },
        { status: 403 }
      );
    }

    // Verifica piattaforma disponibile nel piano
    const maxMarketplaces = user.plan?.maxMarketplaces || 1;
    const usedPlatforms = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      select: { platform: true },
      distinct: ['platform'],
    });

    const uniquePlatforms = new Set(usedPlatforms.map(c => c.platform));
    if (!uniquePlatforms.has(data.platform) && uniquePlatforms.size >= maxMarketplaces) {
      return NextResponse.json(
        { 
          error: `Hai raggiunto il limite di ${maxMarketplaces} marketplace per il piano ${user.plan?.name || 'Free'}.` 
        },
        { status: 403 }
      );
    }

    // Calcola prossima esecuzione basata sul piano
    const frequencyMins = user.plan?.frequencyMins || 180;
    const nextRunAt = new Date(Date.now() + frequencyMins * 60 * 1000);

    // Crea campagna
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        name: data.name,
        keyword: data.keyword,
        platform: data.platform,
        minPrice: data.minPrice || null,
        maxPrice: data.maxPrice || null,
        region: data.region || null,
        exactMatch: data.exactMatch || false,
        includeKeywords: data.includeKeywords || null,
        excludeKeywords: data.excludeKeywords || null,
        platformFilters: data.platformFilters as object | undefined,
        nextRunAt,
        isActive: true,
      },
    });

    // Schedula immediatamente il primo job di scraping
    try {
      await addScraperJob({ 
        campaignId: campaign.id, 
        userId: session.user.id 
      });
      console.log(`[Campaign] Scheduled first scrape job for campaign ${campaign.id}`);
    } catch (jobError) {
      console.error(`[Campaign] Failed to schedule first job:`, jobError);
      // Non fallire la creazione campagna se il job non parte
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della campagna' },
      { status: 500 }
    );
  }
}

