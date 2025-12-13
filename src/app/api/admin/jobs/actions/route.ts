// src/app/api/admin/jobs/actions/route.ts - API azioni sui job
// Retry, remove, pause/resume queue
// Timestamp: 2024-12-12

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScraperQueue } from '@/lib/queue';

type JobAction = 'retry' | 'remove' | 'pause' | 'resume' | 'clean';

interface ActionRequest {
  action: JobAction;
  jobId?: string;
  state?: 'completed' | 'failed' | 'delayed' | 'waiting';
  grace?: number; // Per clean: job più vecchi di X ms
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ActionRequest = await request.json();
    const { action, jobId, state, grace } = body;

    const queue = getScraperQueue();

    switch (action) {
      case 'retry': {
        if (!jobId) {
          return NextResponse.json({ error: 'jobId required for retry' }, { status: 400 });
        }
        
        const job = await queue.getJob(jobId);
        if (!job) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        
        // Retry muove il job da failed a waiting
        await job.retry();
        
        return NextResponse.json({ 
          success: true, 
          message: `Job ${jobId} queued for retry` 
        });
      }

      case 'remove': {
        if (!jobId) {
          return NextResponse.json({ error: 'jobId required for remove' }, { status: 400 });
        }
        
        const job = await queue.getJob(jobId);
        if (!job) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        
        await job.remove();
        
        return NextResponse.json({ 
          success: true, 
          message: `Job ${jobId} removed` 
        });
      }

      case 'pause': {
        await queue.pause();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Queue paused' 
        });
      }

      case 'resume': {
        await queue.resume();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Queue resumed' 
        });
      }

      case 'clean': {
        // Pulisce i job in base allo stato
        const cleanState = state || 'completed';
        const cleanGrace = grace || 3600000; // Default: 1 ora
        
        let cleanedCount = 0;
        
        if (cleanState === 'completed') {
          const removed = await queue.clean(cleanGrace, 1000, 'completed');
          cleanedCount = removed.length;
        } else if (cleanState === 'failed') {
          const removed = await queue.clean(cleanGrace, 1000, 'failed');
          cleanedCount = removed.length;
        } else if (cleanState === 'delayed') {
          const removed = await queue.clean(cleanGrace, 1000, 'delayed');
          cleanedCount = removed.length;
        } else if (cleanState === 'waiting') {
          const removed = await queue.clean(cleanGrace, 1000, 'wait');
          cleanedCount = removed.length;
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned ${cleanedCount} ${cleanState} jobs` 
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error executing job action:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET per ottenere lo stato della queue (paused/active)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getScraperQueue();
    const isPaused = await queue.isPaused();
    
    return NextResponse.json({ 
      isPaused,
      name: queue.name,
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

