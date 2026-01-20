import Redis from 'ioredis';

// Redis is optional - app works without it (no caching/queues)
let redis: Redis | null = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis unavailable, running without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      if (redisAvailable) {
        console.error('Redis connection error:', err.message);
      }
      redisAvailable = false;
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
      redisAvailable = true;
    });
  } catch (err) {
    console.warn('Redis not configured, running without cache');
  }
} else {
  console.log('REDIS_URL not set, running without cache (this is fine for development)');
}

export { redis };

// Cache helpers - gracefully handle missing Redis
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || !redisAvailable) return null;
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Ignore cache errors
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    await redis.del(key);
  } catch {
    // Ignore cache errors
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Ignore cache errors
  }
}
