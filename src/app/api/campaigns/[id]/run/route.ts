// src/app/api/campaigns/[id]/run/route.ts - Esegui campagna manualmente
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { addScraperJob } from '@/lib/queue';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Esegui campagna immediatamente
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
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagna non trovata' }, { status: 404 });
    }

    // Add job to queue
    const job = await addScraperJob({
      campaignId: campaign.id,
      userId: session.user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Campagna avviata',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error running campaign:', error);
    return NextResponse.json(
      { error: 'Errore nell\'avvio della campagna' },
      { status: 500 }
    );
  }
}


