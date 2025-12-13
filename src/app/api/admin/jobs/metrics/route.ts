// src/app/api/admin/jobs/metrics/route.ts - API metriche aggregate jobs
// Calcola statistiche storiche dai JobLog
// Timestamp: 2024-12-12

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

export interface JobMetrics {
  // Statistiche ultime 24 ore
  last24h: {
    total: number;
    succeeded: number;
    failed: number;
    cancelled: number;
    avgDuration: number;
    errorRate: string;
  };
  // Statistiche ultima ora
  lastHour: {
    total: number;
    succeeded: number;
    failed: number;
  };
  // Statistiche per ora (ultime 24 ore)
  hourlyStats: Array<{
    hour: string;
    total: number;
    succeeded: number;
    failed: number;
  }>;
  // Campagne più attive
  topCampaigns: Array<{
    id: string;
    name: string;
    jobCount: number;
    successRate: string;
  }>;
  // Errori recenti
  recentErrors: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    error: string;
    timestamp: Date;
  }>;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Query parallele per performance
    const [
      jobs24h,
      jobsHour,
      avgDurationResult,
      hourlyJobsRaw,
      topCampaignsRaw,
      recentErrors,
    ] = await Promise.all([
      // Jobs ultime 24 ore per stato
      prisma.jobLog.groupBy({
        by: ['status'],
        where: { startedAt: { gte: last24h } },
        _count: true,
      }),
      
      // Jobs ultima ora per stato
      prisma.jobLog.groupBy({
        by: ['status'],
        where: { startedAt: { gte: lastHour } },
        _count: true,
      }),
      
      // Durata media jobs success ultime 24h
      prisma.jobLog.aggregate({
        where: {
          startedAt: { gte: last24h },
          status: JobStatus.SUCCESS,
          durationMs: { not: null },
        },
        _avg: { durationMs: true },
      }),
      
      // Jobs per ora (ultime 24 ore) - raw query per groupBy orario
      prisma.$queryRaw<Array<{ hour: string; status: string; count: bigint }>>`
        SELECT 
          DATE_FORMAT(startedAt, '%Y-%m-%d %H:00') as hour,
          status,
          COUNT(*) as count
        FROM JobLog
        WHERE startedAt >= ${last24h}
        GROUP BY DATE_FORMAT(startedAt, '%Y-%m-%d %H:00'), status
        ORDER BY hour DESC
      `,
      
      // Top campagne per numero di job
      prisma.jobLog.groupBy({
        by: ['campaignId'],
        where: { startedAt: { gte: last24h } },
        _count: true,
        orderBy: { _count: { campaignId: 'desc' } },
        take: 5,
      }),
      
      // Errori recenti
      prisma.jobLog.findMany({
        where: {
          status: JobStatus.FAILED,
          error: { not: null },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          campaign: { select: { name: true } },
        },
      }),
    ]);

    // Processa stats 24h
    const stats24h = {
      total: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    };
    
    for (const row of jobs24h) {
      stats24h.total += row._count;
      if (row.status === JobStatus.SUCCESS) stats24h.succeeded = row._count;
      if (row.status === JobStatus.FAILED) stats24h.failed = row._count;
      if (row.status === JobStatus.CANCELLED) stats24h.cancelled = row._count;
    }

    // Processa stats ultima ora
    const statsHour = {
      total: 0,
      succeeded: 0,
      failed: 0,
    };
    
    for (const row of jobsHour) {
      statsHour.total += row._count;
      if (row.status === JobStatus.SUCCESS) statsHour.succeeded = row._count;
      if (row.status === JobStatus.FAILED) statsHour.failed = row._count;
    }

    // Processa hourly stats
    const hourlyMap = new Map<string, { total: number; succeeded: number; failed: number }>();
    
    for (const row of hourlyJobsRaw) {
      const existing = hourlyMap.get(row.hour) || { total: 0, succeeded: 0, failed: 0 };
      const count = Number(row.count);
      existing.total += count;
      if (row.status === 'SUCCESS') existing.succeeded += count;
      if (row.status === 'FAILED') existing.failed += count;
      hourlyMap.set(row.hour, existing);
    }
    
    const hourlyStats = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Processa top campagne con nomi
    const campaignIds = topCampaignsRaw.map(c => c.campaignId);
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, name: true },
    });
    const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));
    
    // Calcola success rate per ogni top campaign
    const topCampaignsWithStats = await Promise.all(
      topCampaignsRaw.map(async (c) => {
        const successCount = await prisma.jobLog.count({
          where: {
            campaignId: c.campaignId,
            startedAt: { gte: last24h },
            status: JobStatus.SUCCESS,
          },
        });
        
        return {
          id: c.campaignId,
          name: campaignMap.get(c.campaignId) || 'Unknown',
          jobCount: c._count,
          successRate: c._count > 0 
            ? ((successCount / c._count) * 100).toFixed(1) 
            : '0.0',
        };
      })
    );

    const metrics: JobMetrics = {
      last24h: {
        ...stats24h,
        avgDuration: Math.round(avgDurationResult._avg.durationMs || 0),
        errorRate: stats24h.total > 0 
          ? ((stats24h.failed / stats24h.total) * 100).toFixed(2) 
          : '0.00',
      },
      lastHour: statsHour,
      hourlyStats,
      topCampaigns: topCampaignsWithStats,
      recentErrors: recentErrors.map(e => ({
        id: e.id,
        campaignId: e.campaignId,
        campaignName: e.campaign.name,
        error: e.error || 'Unknown error',
        timestamp: e.startedAt,
      })),
    };

    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Error fetching job metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

