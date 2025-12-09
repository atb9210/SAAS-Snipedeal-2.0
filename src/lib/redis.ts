// src/lib/redis.ts - Redis connection
// Timestamp: 2024-12-09

import Redis from 'ioredis';

const getRedisUrl = () => {
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

// Singleton Redis connection
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}


