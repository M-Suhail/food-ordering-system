let Redis: any;
try {
  Redis = require('ioredis').default || require('ioredis');
} catch (e) {
  // ioredis not installed, will use fallback
  Redis = null;
}

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[cache] ${msg}`, data),
  info: (msg, data) => console.log(`[cache] ${msg}`, data),
  error: (msg, data) => console.error(`[cache] ${msg}`, data),
  warn: (msg, data) => console.warn(`[cache] ${msg}`, data),
};

export class CacheService {
  private redis: any;
  private ttlMap: Map<string, number> = new Map();

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    if (!Redis) {
      logger.warn('Redis not available, using in-memory cache only');
      return;
    }

    this.redis = new Redis(redisUrl);

    this.redis.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redis) return null;

      const value = await this.redis.get(key);
      if (value) {
        logger.debug('Cache hit', { key });
        return JSON.parse(value) as T;
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.redis) return;

      const ttl = ttlSeconds || this.ttlMap.get(key) || 300; // Default 5 minutes
      await this.redis.setex(key, ttl, JSON.stringify(value));
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.redis) return;

      await this.redis.del(key);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  /**
   * Clear all cache entries matching pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (!this.redis) return;

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug('Cache cleared by pattern', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache clear pattern error', { pattern, error });
    }
  }

  /**
   * Register TTL for a cache key pattern
   */
  setTTL(pattern: string, ttlSeconds: number): void {
    this.ttlMap.set(pattern, ttlSeconds);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis) return false;

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Get all cache stats
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      if (!this.redis) {
        return { status: 'unavailable', message: 'Redis not configured' };
      }

      const info = await this.redis.info('stats');
      return { status: 'healthy', info };
    } catch (error) {
      logger.error('Cache stats error', { error });
      return { status: 'unhealthy', error: (error as Error).message };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (!this.redis) return;

    await this.redis.quit();
    logger.info('Redis connection closed');
  }
}

export const cacheService = new CacheService();
