// src/app/api/admin/jobs/stats/route.ts - API statistiche jobs
// Timestamp: 2024-12-12

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0
    };

    // Ottiene le stats reali da BullMQ/Redis
    try {
      const { getScraperQueue } = await import('@/lib/queue');
      const queue = getScraperQueue();
      const jobCounts = await queue.getJobCounts();
      
      stats.waiting = jobCounts.waiting || 0;
      stats.active = jobCounts.active || 0;
      stats.completed = jobCounts.completed || 0;
      stats.failed = jobCounts.failed || 0;
      stats.delayed = jobCounts.delayed || 0;
      stats.paused = jobCounts.paused || 0;
    } catch (queueError) {
      console.error('Queue error:', queueError);
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
