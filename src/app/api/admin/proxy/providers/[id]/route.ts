// src/app/api/admin/proxy/providers/[id]/route.ts - API singolo provider
// Timestamp: 2024-12-09

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getProxyManager } from '@/services/proxy';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/proxy/providers/[id]
 * Ottiene un singolo provider
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.proxyProvider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching proxy provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/proxy/providers/[id]
 * Elimina un provider
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verifica che il provider esista
    const provider = await prisma.proxyProvider.findUnique({
      where: { id: params.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Elimina il provider (cascade elimina anche i log)
    await prisma.proxyProvider.delete({
      where: { id: params.id },
    });

    // Ricarica il ProxyManager
    const proxyManager = getProxyManager();
    await proxyManager.reload();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting proxy provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/proxy/providers/[id]
 * Aggiorna parzialmente un provider (es. toggle enabled)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Verifica che il provider esista
    const existingProvider = await prisma.proxyProvider.findUnique({
      where: { id: params.id },
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Se si sta impostando come default, rimuovi default da altri
    if (body.isDefault === true) {
      await prisma.proxyProvider.updateMany({
        where: { isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    // Aggiorna solo i campi forniti
    const provider = await prisma.proxyProvider.update({
      where: { id: params.id },
      data: {
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.config !== undefined && { config: body.config }),
      },
    });

    // Ricarica il ProxyManager
    const proxyManager = getProxyManager();
    await proxyManager.reload();

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating proxy provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

