// src/lib/queue.ts - BullMQ Queue Setup
// Timestamp: 2024-12-09

import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from './redis';

// Queue names
export const QUEUE_NAMES = {
  SCRAPER: 'scraper-jobs',
  NOTIFICATIONS: 'notification-jobs',
} as const;

// Job types
export interface ScraperJobData {
  campaignId: string;
  userId: string;
}

export interface NotificationJobData {
  userId: string;
  resultIds: string[];
  campaignName: string;
}

// Create scraper queue
let scraperQueue: Queue<ScraperJobData> | null = null;

export function getScraperQueue(): Queue<ScraperJobData> {
  if (!scraperQueue) {
    scraperQueue = new Queue<ScraperJobData>(QUEUE_NAMES.SCRAPER, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 500, // Keep last 500 failed jobs
        },
        attempts: 3,           // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 5000,         // Start with 5s delay
        },
      },
    });
  }
  return scraperQueue;
}

// Create notification queue
let notificationQueue: Queue<NotificationJobData> | null = null;

export function getNotificationQueue(): Queue<NotificationJobData> {
  if (!notificationQueue) {
    notificationQueue = new Queue<NotificationJobData>(QUEUE_NAMES.NOTIFICATIONS, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
      },
    });
  }
  return notificationQueue;
}

// Add a scraper job
export async function addScraperJob(data: ScraperJobData): Promise<Job<ScraperJobData>> {
  const queue = getScraperQueue();
  
  return queue.add('scrape', data, {
    jobId: `scrape-${data.campaignId}-${Date.now()}`,
  });
}

// Add a notification job
export async function addNotificationJob(data: NotificationJobData): Promise<Job<NotificationJobData>> {
  const queue = getNotificationQueue();
  
  return queue.add('notify', data, {
    jobId: `notify-${data.userId}-${Date.now()}`,
  });
}

// Schedule recurring campaign jobs
export async function scheduleCampaignJob(
  campaignId: string, 
  userId: string, 
  delayMs: number
): Promise<Job<ScraperJobData>> {
  const queue = getScraperQueue();
  
  return queue.add(
    'scrape',
    { campaignId, userId },
    {
      jobId: `scheduled-${campaignId}`,
      delay: delayMs,
      // Remove and replace existing job with same ID
      removeOnComplete: true,
    }
  );
}


