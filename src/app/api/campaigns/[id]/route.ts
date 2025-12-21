// src/app/api/campaigns/[id]/route.ts - API singola campagna
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema validazione update
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  keyword: z.string().min(1).max(200).optional(),
  platform: z.enum(['SUBITO', 'EBAY', 'VINTED', 'WALLAPOP', 'FACEBOOK']).optional(),
  minPrice: z.number().min(0).nullable().optional(),
  maxPrice: z.number().min(0).nullable().optional(),
  region: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  platformFilters: z.any().optional(),
});

// GET - Dettaglio campagna
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
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
        _count: { select: { results: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagna non trovata' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero campagna' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna campagna
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica proprietà campagna
    const existingCampaign = await prisma.campaign.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campagna non trovata' }, { status: 404 });
    }

    const body = await request.json();
    
    // Valida input
    const validation = updateCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Aggiorna campagna
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.keyword && { keyword: data.keyword }),
        ...(data.platform && { platform: data.platform }),
        ...(data.minPrice !== undefined && { minPrice: data.minPrice }),
        ...(data.maxPrice !== undefined && { maxPrice: data.maxPrice }),
        ...(data.region !== undefined && { region: data.region }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.platformFilters !== undefined && { platformFilters: data.platformFilters }),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della campagna' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina campagna
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica proprietà campagna
    const existingCampaign = await prisma.campaign.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campagna non trovata' }, { status: 404 });
    }

    // Elimina campagna (cascade elimina anche risultati e logs)
    await prisma.campaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della campagna' },
      { status: 500 }
    );
  }
}


