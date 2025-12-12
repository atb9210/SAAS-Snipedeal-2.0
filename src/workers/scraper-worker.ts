// src/workers/scraper-worker.ts - Background worker per job di scraping
// Eseguire con: npm run worker
// Timestamp: 2024-12-09

import { Worker, Job } from 'bullmq';
import { PrismaClient, Platform, JobStatus } from '@prisma/client';
import { getRedis } from '../lib/redis';
import { QUEUE_NAMES, ScraperJobData, scheduleCampaignJob, addScraperJob, getScraperQueue } from '../lib/queue';
import { createScraper, isPlatformSupported } from '../services/scrapers';
import { getProxyManager } from '../services/proxy';
import { sendNewResultsNotification, PushSubscription } from '../lib/web-push';

const prisma = new PrismaClient();
const SCHEDULER_INTERVAL_MS = 60000; // Check ogni 60 secondi

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
      // Se è il primo run (lastRunAt null), scrape 3 pagine per popolare
      // Altrimenti solo 1 pagina per prendere i nuovi annunci
      const maxPages = campaign.lastRunAt ? 1 : 3;
      console.log(`[Job ${job.id}] Scraping "${campaign.keyword}" on ${campaign.platform} (${maxPages} pages)`);
      
      const result = await scraper.scrape({
        keyword: campaign.keyword,
        minPrice: campaign.minPrice,
        maxPrice: campaign.maxPrice,
        region: campaign.region,
        maxPages,
      });

      if (!result.success) {
        throw new Error(result.error || 'Scraping failed');
      }

      console.log(`[Job ${job.id}] Found ${result.ads.length} ads`);

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

      console.log(`✅ [Job ${job.id}] Completed successfully`);
      console.log(`   Total ads found: ${result.ads.length}`);
      console.log(`   New results: ${newCount}`);
      console.log(`   Duration: ${Date.now() - startTime}ms`);
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

// Event handlers
worker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully`);
  console.log(`   Campaign ID: ${job.data.campaignId}, User ID: ${job.data.userId}`);
});

worker.on('failed', (job, err) => {
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

function startScheduler() {
  console.log(`📅 [Scheduler] Starting campaign scheduler (interval: ${SCHEDULER_INTERVAL_MS / 1000}s)`);
  
  // Esegui subito al primo avvio
  checkPendingCampaigns();
  
  // Poi esegui periodicamente
  schedulerInterval = setInterval(checkPendingCampaigns, SCHEDULER_INTERVAL_MS);
}

// Avvia lo scheduler dopo l'inizializzazione del proxy
setTimeout(startScheduler, 3000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  if (schedulerInterval) clearInterval(schedulerInterval);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  if (schedulerInterval) clearInterval(schedulerInterval);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('✅ Scraper Worker ready and listening for jobs');

