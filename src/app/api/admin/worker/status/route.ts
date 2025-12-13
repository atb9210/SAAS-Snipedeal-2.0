// src/app/api/admin/worker/status/route.ts - API stato worker
// Legge le metriche del worker da Redis
// Timestamp: 2024-12-12

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRedis } from '@/lib/redis';

// Redis keys (devono corrispondere a quelli del worker)
const REDIS_KEYS = {
  HEARTBEAT: 'worker:heartbeat',
  METRICS: 'worker:metrics',
  STATUS: 'worker:status',
} as const;

export interface WorkerStatus {
  online: boolean;
  status: 'running' | 'idle' | 'processing' | 'offline' | 'unknown';
  lastHeartbeat: number | null;
  lastHeartbeatAgo: string | null;
  metrics: WorkerMetrics | null;
}

export interface WorkerMetrics {
  timestamp: number;
  uptime: number;
  uptimeFormatted: string;
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  errorRate: string;
  avgJobDuration: number;
  lastJobDuration: number;
  currentJob: string | null;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  pid: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redis = getRedis();
    
    // Leggi tutte le chiavi del worker
    const [heartbeatStr, statusStr, metricsStr] = await Promise.all([
      redis.get(REDIS_KEYS.HEARTBEAT),
      redis.get(REDIS_KEYS.STATUS),
      redis.get(REDIS_KEYS.METRICS),
    ]);
    
    const now = Date.now();
    const heartbeat = heartbeatStr ? parseInt(heartbeatStr, 10) : null;
    const status = statusStr || 'unknown';
    
    // Worker considerato online se heartbeat è entro 90 secondi
    const isOnline = heartbeat !== null && (now - heartbeat) < 90000;
    
    // Calcola quanto tempo fa è stato l'ultimo heartbeat
    let lastHeartbeatAgo: string | null = null;
    if (heartbeat) {
      const diffSecs = Math.floor((now - heartbeat) / 1000);
      if (diffSecs < 60) {
        lastHeartbeatAgo = `${diffSecs}s fa`;
      } else if (diffSecs < 3600) {
        lastHeartbeatAgo = `${Math.floor(diffSecs / 60)}m fa`;
      } else {
        lastHeartbeatAgo = `${Math.floor(diffSecs / 3600)}h fa`;
      }
    }
    
    // Parse metriche
    let metrics: WorkerMetrics | null = null;
    if (metricsStr) {
      try {
        metrics = JSON.parse(metricsStr);
      } catch {
        console.error('[Worker Status] Failed to parse metrics JSON');
      }
    }
    
    const response: WorkerStatus = {
      online: isOnline,
      status: isOnline ? (status as WorkerStatus['status']) : 'offline',
      lastHeartbeat: heartbeat,
      lastHeartbeatAgo,
      metrics,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching worker status:', error);
    return NextResponse.json(
      { 
        online: false, 
        status: 'unknown' as const,
        lastHeartbeat: null,
        lastHeartbeatAgo: null,
        metrics: null,
        error: 'Failed to fetch worker status' 
      },
      { status: 500 }
    );
  }
}

