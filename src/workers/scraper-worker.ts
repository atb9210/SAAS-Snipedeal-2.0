// src/workers/scraper-worker.ts - Background worker per job di scraping
// Eseguire con: npm run worker
// Timestamp: 2024-12-12

import { Worker, Job } from 'bullmq';
import { PrismaClient, Platform, JobStatus } from '@prisma/client';
import { getRedis } from '../lib/redis';
import { QUEUE_NAMES, ScraperJobData, scheduleCampaignJob, addScraperJob, getScraperQueue } from '../lib/queue';
import { createScraper, isPlatformSupported } from '../services/scrapers';
import { getProxyManager } from '../services/proxy';
import { sendNewResultsNotification, PushSubscription } from '../lib/web-push';

const prisma = new PrismaClient();
const SCHEDULER_INTERVAL_MS = 60000; // Check ogni 60 secondi
const HEARTBEAT_INTERVAL_MS = 30000; // Heartbeat ogni 30 secondi

// ============================================
// WORKER METRICS - Tracking in-memory
// ============================================
const workerStartTime = Date.now();
let jobsProcessed = 0;
let jobsSucceeded = 0;
let jobsFailed = 0;
let currentJobId: string | null = null;
let lastJobDuration = 0;
let totalJobDuration = 0;

// Redis keys for worker status
const REDIS_KEYS = {
  HEARTBEAT: 'worker:heartbeat',
  METRICS: 'worker:metrics',
  STATUS: 'worker:status',
} as const;

/**
 * Scrive heartbeat e metriche su Redis
 * Chiamato ogni 30 secondi per indicare che il worker è vivo
 */
async function writeHeartbeat(): Promise<void> {
  try {
    const redis = getRedis();
    const now = Date.now();
    const uptime = Math.floor((now - workerStartTime) / 1000);
    const memUsage = process.memoryUsage();
    
    // Heartbeat con timestamp
    await redis.set(REDIS_KEYS.HEARTBEAT, now.toString(), 'EX', 120); // Scade dopo 2 minuti
    
    // Stato corrente
    await redis.set(REDIS_KEYS.STATUS, currentJobId ? 'processing' : 'idle', 'EX', 120);
    
    // Metriche complete
    const metrics = {
      timestamp: now,
      uptime,
      uptimeFormatted: formatUptime(uptime),
      jobsProcessed,
      jobsSucceeded,
      jobsFailed,
      errorRate: jobsProcessed > 0 ? ((jobsFailed / jobsProcessed) * 100).toFixed(2) : '0.00',
      avgJobDuration: jobsProcessed > 0 ? Math.round(totalJobDuration / jobsProcessed) : 0,
      lastJobDuration,
      currentJob: currentJobId,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      },
      pid: process.pid,
    };
    
    await redis.set(REDIS_KEYS.METRICS, JSON.stringify(metrics), 'EX', 120);
    
  } catch (error) {
    console.error('[Heartbeat] Failed to write heartbeat:', error);
  }
}

/**
 * Formatta uptime in modo leggibile
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

console.log('🚀 Starting Scraper Worker...');

// Inizializza ProxyManager all'avvio
async function initializeProxy() {
  try {
    const proxyManager = getProxyManager();
    await proxyManager.initialize();
    const hasProxy = await proxyManager.hasAvailableProxy();
    
    if (hasProxy) {
      console.log('🔒 Proxy enabled: scraping requests will be proxied');
    } else {
      console.log('⚠️  No proxy configured: scraping without proxy protection');
    }
  } catch (error) {
    console.error('Failed to initialize proxy manager:', error);
  }
}

initializeProxy();

// Create worker
const worker = new Worker<ScraperJobData>(
  QUEUE_NAMES.SCRAPER,
  async (job: Job<ScraperJobData>) => {
    const { campaignId, userId } = job.data;
    const startTime = Date.now();

    console.log(`🔄 [Job ${job.id}] Starting processing for campaign: ${campaignId}`);
    console.log(`   Job data:`, JSON.stringify(job.data));
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Create job log
    const jobLog = await prisma.jobLog.create({
      data: {
        campaignId,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      // Get campaign
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { user: { include: { plan: true } } },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (!campaign.isActive) {
        console.log(`[Job ${job.id}] Campaign is inactive, skipping`);
        await prisma.jobLog.update({
          where: { id: jobLog.id },
          data: {
            status: JobStatus.CANCELLED,
            message: 'Campaign is inactive',
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });
        return;
      }

      // Check platform support
      if (!isPlatformSupported(campaign.platform as Platform)) {
        throw new Error(`Platform ${campaign.platform} not supported`);
      }

      // Create scraper
      const scraper = createScraper(campaign.platform as Platform);

      // Run scraping
      // Sempre 1 pagina per consistenza e semplicità
      const maxPages = 1;
      // Type assertion per i nuovi campi
      const campaignWithFilters = campaign as typeof campaign & {
        exactMatch?: boolean;
        includeKeywords?: string | null;
        excludeKeywords?: string | null;
        platformFilters?: Record<string, unknown> | null;
      };
      
      console.log(`[Job ${job.id}] Scraping "${campaign.keyword}" on ${campaign.platform} (${maxPages} page)`);
      console.log(`[Job ${job.id}] Filters: exactMatch=${campaignWithFilters.exactMatch || false}, include="${campaignWithFilters.includeKeywords || ''}", exclude="${campaignWithFilters.excludeKeywords || ''}"`);
      
      // Determina la region da passare allo scraper
      // Per Subito: usa campaign.region
      // Per eBay: usa platformFilters.location
      let scrapeRegion = campaign.region;
      if (campaign.platform === 'EBAY' && campaignWithFilters.platformFilters) {
        const ebayFilters = campaignWithFilters.platformFilters as { location?: string };
        scrapeRegion = ebayFilters.location || null;
        console.log(`[Job ${job.id}] eBay location filter: ${scrapeRegion || 'worldwide'}`);
      }
      
      // Per Facebook: passa platformFilters con city e exactMatch
      if (campaign.platform === 'FACEBOOK' && campaignWithFilters.platformFilters) {
        const fbFilters = campaignWithFilters.platformFilters as { city?: string; exactMatch?: boolean };
        console.log(`[Job ${job.id}] Facebook city filter: ${fbFilters.city || 'Milano'}`);
      }
      
      const result = await scraper.scrape({
        keyword: campaign.keyword,
        minPrice: campaign.minPrice,
        maxPrice: campaign.maxPrice,
        region: scrapeRegion,
        maxPages,
        exactMatch: campaignWithFilters.exactMatch || false,
        platformFilters: campaignWithFilters.platformFilters || undefined,
      });

      // Applica filtri include/exclude sui risultati
      let filteredAds = result.ads;
      
      if (campaignWithFilters.includeKeywords) {
        const includeWords = campaignWithFilters.includeKeywords.split(',').map((w: string) => w.trim().toLowerCase()).filter((w: string) => w);
        if (includeWords.length > 0) {
          filteredAds = filteredAds.filter(ad => {
            const title = ad.title.toLowerCase();
            return includeWords.some((word: string) => title.includes(word));
          });
          console.log(`[Job ${job.id}] After include filter: ${filteredAds.length} ads (was ${result.ads.length})`);
        }
      }
      
      if (campaignWithFilters.excludeKeywords) {
        const excludeWords = campaignWithFilters.excludeKeywords.split(',').map((w: string) => w.trim().toLowerCase()).filter((w: string) => w);
        if (excludeWords.length > 0) {
          const beforeCount = filteredAds.length;
          filteredAds = filteredAds.filter(ad => {
            const title = ad.title.toLowerCase();
            return !excludeWords.some((word: string) => title.includes(word));
          });
          console.log(`[Job ${job.id}] After exclude filter: ${filteredAds.length} ads (was ${beforeCount})`);
        }
      }
      
      // Usa i risultati filtrati
      result.ads = filteredAds;

      if (!result.success) {
        throw new Error(result.error || 'Scraping failed');
      }

      console.log(`[Job ${job.id}] Found ${result.ads.length} ads`);

      // Se è il primo run (lastRunAt null), inverti l'ordine dei risultati
      // così i più recenti vengono salvati per ultimi e appaiono primi nel DB
      if (!campaign.lastRunAt) {
        result.ads.reverse();
      }

      // Process results
      let newCount = 0;
      const newResultIds: string[] = [];

      for (const ad of result.ads) {
        // Skip if no link
        if (!ad.link) continue;

        // Check if already exists
        const existing = await prisma.result.findFirst({
          where: {
            campaignId: campaign.id,
            link: ad.link,
          },
        });

        if (existing) {
          // Update existing
          await prisma.result.update({
            where: { id: existing.id },
            data: {
              price: ad.price,
              status: ad.status,
              hasShipping: ad.hasShipping,
            },
          });
        } else {
          // Create new
          const newResult = await prisma.result.create({
            data: {
              campaignId: campaign.id,
              title: ad.title,
              price: ad.price,
              location: ad.location,
              link: ad.link,
              image: ad.image,
              status: ad.status,
              hasShipping: ad.hasShipping ?? false,
              notified: false,
              isNew: true,
              publishedAt: ad.date || null, // Data pubblicazione dal marketplace
            },
          });
          newCount++;
          newResultIds.push(newResult.id);
        }
      }

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          lastRunAt: new Date(),
          totalResults: { increment: newCount },
          newResults: newCount,
        },
      });

      // Calculate next run time based on user's plan
      const frequencyMins = campaign.user.plan?.frequencyMins || 180;
      const delayMs = frequencyMins * 60 * 1000;
      const nextRunAt = new Date(Date.now() + delayMs);

      console.log(`[Job ${job.id}] Scheduling next run: frequencyMins=${frequencyMins}, delayMs=${delayMs}, nextRunAt=${nextRunAt.toISOString()}`);

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { nextRunAt },
      });

      // Schedule next run - NON usare delay qui, lo scheduler si occuperà di aggiungere il job quando nextRunAt <= now
      // await scheduleCampaignJob(campaignId, userId, delayMs);
      console.log(`[Job ${job.id}] Next run scheduled via database (nextRunAt), scheduler will pick it up automatically`);

      // Update job log
      await prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: JobStatus.SUCCESS,
          totalFound: result.ads.length,
          newFound: newCount,
          message: `Found ${result.ads.length} ads, ${newCount} new`,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        },
      });

      // Track job duration for metrics
      const jobDuration = Date.now() - startTime;
      lastJobDuration = jobDuration;
      totalJobDuration += jobDuration;
      
      console.log(`✅ [Job ${job.id}] Completed successfully`);
      console.log(`   Total ads found: ${result.ads.length}`);
      console.log(`   New results: ${newCount}`);
      console.log(`   Duration: ${jobDuration}ms`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);

      // Send push notifications for new results
      if (newCount > 0 && campaign.user.pushSubscription) {
        try {
          const subscription = JSON.parse(campaign.user.pushSubscription) as PushSubscription;
          const notificationSent = await sendNewResultsNotification(
            subscription,
            campaign.name,
            newCount
          );
          
          if (notificationSent) {
            console.log(`[Job ${job.id}] Push notification sent for ${newCount} new results`);
            
            // Update job log with notification info
            await prisma.jobLog.update({
              where: { id: jobLog.id },
              data: {
                notified: newCount,
              },
            });

            // Mark results as notified
            await prisma.result.updateMany({
              where: { id: { in: newResultIds } },
              data: { notified: true },
            });
          }
        } catch (pushError) {
          console.error(`[Job ${job.id}] Failed to send push notification:`, pushError);
          // Don't throw - push notification failure shouldn't fail the job
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Job ${job.id}] Error:`, errorMessage);

      // Update job log
      await prisma.jobLog.update({
        where: { id: jobLog.id },
        data: {
          status: JobStatus.FAILED,
          error: errorMessage,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        },
      });

      throw error;
    }
  },
  {
    connection: getRedis(),
    concurrency: 3, // Process 3 jobs at a time
    limiter: {
      max: 10,       // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

// Event handlers con tracking metriche
worker.on('completed', (job) => {
  jobsProcessed++;
  jobsSucceeded++;
  currentJobId = null;
  console.log(`✅ [Worker] Job ${job.id} completed successfully`);
  console.log(`   Campaign ID: ${job.data.campaignId}, User ID: ${job.data.userId}`);
});

worker.on('failed', (job, err) => {
  jobsProcessed++;
  jobsFailed++;
  currentJobId = null;
  console.error(`❌ [Worker] Job ${job?.id} failed:`, err.message);
  if (job) {
    console.error(`   Campaign ID: ${job.data.campaignId}, User ID: ${job.data.userId}`);
    console.error(`   Error details:`, err);
  }
});

worker.on('error', (err) => {
  console.error('❌ [Worker] Worker error:', err);
});

worker.on('active', (job) => {
  currentJobId = job.id || null;
  console.log(`🔄 [Worker] Job ${job.id} started processing`);
  console.log(`   Campaign ID: ${job.data.campaignId}`);
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️  [Worker] Job ${jobId} stalled (taking too long)`);
});

// ============================================
// SCHEDULER: Controlla campagne da eseguire
// ============================================

async function checkPendingCampaigns() {
  try {
    const now = new Date();
    
    // Trova campagne attive con nextRunAt <= now
    const pendingCampaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        user: { include: { plan: true } },
      },
    });

    if (pendingCampaigns.length === 0) {
      return;
    }

    console.log(`📅 [Scheduler] Found ${pendingCampaigns.length} campaigns to process`);

    const queue = getScraperQueue();

    for (const campaign of pendingCampaigns) {
      // Controlla se esiste già un job per questa campagna nella coda
      const existingJobs = await queue.getJobs(['waiting', 'active', 'delayed']);
      const hasExistingJob = existingJobs.some(j => 
        j.data.campaignId === campaign.id
      );

      if (hasExistingJob) {
        console.log(`⏭️  [Scheduler] Campaign ${campaign.name} already has a pending job, skipping`);
        continue;
      }

      // Calcola il tempo rimanente fino al nextRunAt
      const timeUntilRun = campaign.nextRunAt ? campaign.nextRunAt.getTime() - now.getTime() : 0;
      const frequencyMins = campaign.user?.plan?.frequencyMins || 180;
      
      console.log(`📅 [Scheduler] Campaign ${campaign.name}: nextRunAt=${campaign.nextRunAt?.toISOString()}, timeUntilRun=${timeUntilRun}ms (${timeUntilRun/1000/60} min), frequencyMins=${frequencyMins}`);

      // Aggiungi job alla coda
      await addScraperJob({
        campaignId: campaign.id,
        userId: campaign.userId,
      });

      console.log(`✅ [Scheduler] Queued job for campaign: ${campaign.name}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error checking pending campaigns:', error);
  }
}

// Avvia scheduler
let schedulerInterval: NodeJS.Timeout;
let heartbeatInterval: NodeJS.Timeout;

function startScheduler() {
  console.log(`📅 [Scheduler] Starting campaign scheduler (interval: ${SCHEDULER_INTERVAL_MS / 1000}s)`);
  
  // Esegui subito al primo avvio
  checkPendingCampaigns();
  
  // Poi esegui periodicamente
  schedulerInterval = setInterval(checkPendingCampaigns, SCHEDULER_INTERVAL_MS);
}

function startHeartbeat() {
  console.log(`💓 [Heartbeat] Starting worker heartbeat (interval: ${HEARTBEAT_INTERVAL_MS / 1000}s)`);
  
  // Scrivi subito il primo heartbeat
  writeHeartbeat();
  
  // Poi scrivi periodicamente
  heartbeatInterval = setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
}

// Avvia scheduler e heartbeat dopo l'inizializzazione del proxy
setTimeout(() => {
  startScheduler();
  startHeartbeat();
}, 3000);

// Graceful shutdown con cleanup Redis
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  
  // Stop intervals
  if (schedulerInterval) clearInterval(schedulerInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Pulisci chiavi Redis per indicare che il worker è offline
  try {
    const redis = getRedis();
    await redis.del(REDIS_KEYS.HEARTBEAT);
    await redis.set(REDIS_KEYS.STATUS, 'offline', 'EX', 300);
    await redis.del(REDIS_KEYS.METRICS);
    console.log('[Heartbeat] Cleaned up Redis keys');
  } catch (error) {
    console.error('[Heartbeat] Failed to cleanup Redis:', error);
  }
  
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

console.log('✅ Scraper Worker ready and listening for jobs');

