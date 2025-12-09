// src/app/api/campaigns/[id]/toggle/route.ts - Toggle stato campagna
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Toggle attiva/disattiva campagna
export async function POST(
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

    // Toggle stato
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        isActive: !existingCampaign.isActive,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error toggling campaign:', error);
    return NextResponse.json(
      { error: 'Errore nel cambio stato campagna' },
      { status: 500 }
    );
  }
}


