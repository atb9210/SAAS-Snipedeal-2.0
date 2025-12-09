// src/app/api/admin/jobs/stats/route.ts - API statistiche jobs
// Timestamp: 2024-12-09

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In un setup reale, queste stats verrebbero da BullMQ
    // Per ora restituiamo dati mock
    const stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0
    };

    // Se Redis è disponibile, prova a ottenere le stats reali
    try {
      const { getScraperQueue } = await import('@/lib/queue');
      const queue = getScraperQueue();
      const jobCounts = await queue.getJobCounts();
      stats.waiting = jobCounts.waiting || 0;
      stats.active = jobCounts.active || 0;
      stats.completed = jobCounts.completed || 0;
      stats.failed = jobCounts.failed || 0;
    } catch (queueError) {
      console.log('Queue non disponibile, usando stats mock');
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
