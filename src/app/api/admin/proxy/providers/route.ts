// src/app/api/admin/proxy/providers/route.ts - API gestione proxy providers
// Timestamp: 2024-12-09

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/proxy/providers
 * Lista tutti i provider configurati
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await prisma.proxyProvider.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    });

    // Lista statica dei provider supportati (evita import problematici)
    const supportedProviders = [
      { name: 'packetstream', displayName: 'Packetstream' },
    ];

    return NextResponse.json({
      providers,
      supportedProviders,
    });
  } catch (error) {
    console.error('Error fetching proxy providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/proxy/providers
 * Crea o aggiorna un provider
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, displayName, isEnabled, isDefault, config } = body;

    // Validazione base
    if (!name || !displayName || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, config' },
        { status: 400 }
      );
    }

    // Lista statica dei provider supportati
    const supportedProviders = ['packetstream'];
    if (!supportedProviders.includes(name)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${name}` },
        { status: 400 }
      );
    }

    // Se questo provider deve essere default, rimuovi default da altri
    if (isDefault) {
      await prisma.proxyProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    let provider;

    if (id) {
      // Aggiorna provider esistente
      provider = await prisma.proxyProvider.update({
        where: { id },
        data: {
          displayName,
          isEnabled: isEnabled ?? false,
          isDefault: isDefault ?? false,
          config,
        },
      });
    } else {
      // Crea nuovo provider
      provider = await prisma.proxyProvider.upsert({
        where: { name },
        update: {
          displayName,
          isEnabled: isEnabled ?? false,
          isDefault: isDefault ?? false,
          config,
        },
        create: {
          name,
          displayName,
          isEnabled: isEnabled ?? false,
          isDefault: isDefault ?? false,
          config,
        },
      });
    }

    return NextResponse.json(provider, { status: id ? 200 : 201 });
  } catch (error) {
    console.error('Error saving proxy provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

