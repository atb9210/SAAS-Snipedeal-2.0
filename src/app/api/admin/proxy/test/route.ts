// src/app/api/admin/proxy/test/route.ts - API test connessione proxy
// Timestamp: 2024-12-09

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getProxyManager } from '@/services/proxy';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/proxy/test
 * Testa la connessione di un provider proxy
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { providerId, country } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verifica che il provider esista
    const provider = await prisma.proxyProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (!provider.isEnabled) {
      return NextResponse.json(
        { error: 'Provider is not enabled' },
        { status: 400 }
      );
    }

    // Esegui il test
    const proxyManager = getProxyManager();
    await proxyManager.reload(); // Assicurati che sia aggiornato
    
    const result = await proxyManager.testProvider(providerId, country || 'Italy');

    // Logga il risultato
    await proxyManager.logUsage(
      providerId,
      result.success,
      undefined, // no campaign
      result.latencyMs,
      result.ip,
      result.country,
      result.error
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/proxy/test
 * Ottiene l'IP corrente del server (senza proxy)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ottieni IP del server senza proxy
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://ip-api.com/json', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      
      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        ip: data.query,
        country: data.country,
        city: data.city,
        isp: data.isp,
        latencyMs,
        message: 'IP del server (senza proxy)',
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to get server IP',
        latencyMs: Date.now() - startTime,
      });
    }
  } catch (error) {
    console.error('Error getting server IP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

