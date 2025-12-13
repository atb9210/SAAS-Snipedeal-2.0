// src/app/api/admin/jobs/list/route.ts - API lista dettagliata jobs
// Timestamp: 2024-12-12

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface JobDetail {
  id: string;
  name: string;
  state: string;
  data: {
    campaignId?: string;
    userId?: string;
  };
  campaignName?: string;
  campaignLastRunAt?: number;
  campaignNextRunAt?: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  returnvalue?: any;
  attemptsMade: number;
  delay?: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const jobs: JobDetail[] = [];

    try {
      const { getScraperQueue } = await import('@/lib/queue');
      const queue = getScraperQueue();

      const statesToFetch = state === 'all' 
        ? ['completed', 'failed', 'delayed', 'active', 'waiting', 'paused']
        : [state];

      for (const jobState of statesToFetch) {
        try {
          const stateJobs = await queue.getJobs([jobState as any], 0, limit);

          for (const job of stateJobs) {
            jobs.push({
              id: job.id || '',
              name: job.name || 'scrape',
              state: jobState,
              data: job.data || {},
              timestamp: job.timestamp || Date.now(),
              processedOn: job.processedOn || undefined,
              finishedOn: job.finishedOn || undefined,
              failedReason: job.failedReason || undefined,
              returnvalue: job.returnvalue || undefined,
              attemptsMade: job.attemptsMade || 0,
              delay: job.delay || undefined,
            });
          }
        } catch (err) {
          console.error(`Error fetching ${jobState} jobs:`, err);
        }
      }

      // Ordina per timestamp (più recenti prima)
      jobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Recupera i nomi delle campagne e informazioni di scheduling
      const campaignIds = [...new Set(jobs.map(j => j.data.campaignId).filter(Boolean))];
      if (campaignIds.length > 0) {
        try {
          const prisma = (await import('@/lib/prisma')).default;
          const campaigns = await prisma.campaign.findMany({
            where: { id: { in: campaignIds as string[] } },
            select: { 
              id: true, 
              name: true,
              lastRunAt: true,
              nextRunAt: true,
            },
          });
          const campaignMap = new Map(campaigns.map(c => [c.id, c]));
          jobs.forEach(job => {
            if (job.data.campaignId) {
              const campaign = campaignMap.get(job.data.campaignId);
              if (campaign) {
                job.campaignName = campaign.name;
                job.campaignLastRunAt = campaign.lastRunAt ? campaign.lastRunAt.getTime() : undefined;
                job.campaignNextRunAt = campaign.nextRunAt ? campaign.nextRunAt.getTime() : undefined;
              }
            }
          });
        } catch (prismaError) {
          console.error('Error fetching campaign names:', prismaError);
        }
      }

    } catch (queueError) {
      console.error('Queue error:', queueError);
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching job list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
