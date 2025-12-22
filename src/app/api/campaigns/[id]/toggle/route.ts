// src/app/api/campaigns/[id]/toggle/route.ts - Toggle stato campagna
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// POST - Toggle attiva/disattiva campagna o gruppo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Prima prova a trovare una campagna diretta
    const existingCampaign = await prisma.campaign.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id,
      },
    });

    if (existingCampaign) {
      // Toggle singola campagna
      const campaign = await prisma.campaign.update({
        where: { id: params.id },
        data: { isActive: !existingCampaign.isActive },
      });
      
      // Invalida cache per list e detail
      revalidatePath('/campaigns');
      revalidatePath(`/campaigns/${params.id}`);
      
      return NextResponse.json(campaign);
    }

    // Se non trovata, potrebbe essere un groupId - toggle tutte le campagne del gruppo
    const groupCampaigns = await prisma.campaign.findMany({
      where: {
        groupId: params.id,
        userId: session.user.id,
      },
    });

    if (groupCampaigns.length === 0) {
      return NextResponse.json({ error: 'Campagna non trovata' }, { status: 404 });
    }

    // Determina il nuovo stato (inverso della prima campagna)
    const newIsActive = !groupCampaigns[0].isActive;

    // Toggle tutte le campagne del gruppo
    await prisma.campaign.updateMany({
      where: {
        groupId: params.id,
        userId: session.user.id,
      },
      data: { isActive: newIsActive },
    });

    // Invalida cache per list e detail
    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${params.id}`);
    
    // Ritorna un oggetto con le info del gruppo
    return NextResponse.json({
      id: params.id,
      groupId: params.id,
      isActive: newIsActive,
      updatedCount: groupCampaigns.length,
    });
  } catch (error) {
    console.error('Error toggling campaign:', error);
    return NextResponse.json(
      { error: 'Errore nel cambio stato campagna' },
      { status: 500 }
    );
  }
}


