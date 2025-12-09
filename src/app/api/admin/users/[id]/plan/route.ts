// src/app/api/admin/users/[id]/plan/route.ts - Update user plan (Admin only)
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH - Update user's plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { planId } = await request.json();

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { planId },
      include: { plan: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        planId: user.planId,
        planName: user.plan?.name,
      },
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del piano' },
      { status: 500 }
    );
  }
}


