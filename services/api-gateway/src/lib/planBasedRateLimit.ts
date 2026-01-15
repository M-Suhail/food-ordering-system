// Create a simple logger interface
interface LoggerInstance {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: LoggerInstance = {
  debug: (msg, data) => console.debug(`[rate-limit] ${msg}`, data),
  info: (msg, data) => console.log(`[rate-limit] ${msg}`, data),
  error: (msg, data) => console.error(`[rate-limit] ${msg}`, data),
  warn: (msg, data) => console.warn(`[rate-limit] ${msg}`, data),
};

export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface PlanLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  maxBurstSize: number;
  concurrentRequests: number;
}

export type RateLimitConfig = Record<UserPlan, PlanLimits>;

/**
 * Plan-based rate limiting configuration
 * Different tiers with progressively higher limits
 */
export const PLAN_LIMITS: RateLimitConfig = {
  [UserPlan.FREE]: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    maxBurstSize: 5,
    concurrentRequests: 2,
  },
  [UserPlan.STARTER]: {
    requestsPerMinute: 50,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    maxBurstSize: 20,
    concurrentRequests: 10,
  },
  [UserPlan.PROFESSIONAL]: {
    requestsPerMinute: 200,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    maxBurstSize: 100,
    concurrentRequests: 50,
  },
  [UserPlan.ENTERPRISE]: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    maxBurstSize: 500,
    concurrentRequests: 200,
  },
};

interface RateLimitBucket {
  tokens: number;
  lastRefillTime: number;
  concurrentCount: number;
  minuteBucket: number[];
  hourBucket: number[];
  dayBucket: number[];
}

/**
 * TokenBucket-based rate limiter with plan-based configuration
 */
export class PlanBasedRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Clean up old buckets every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /**
   * Check if request is allowed for a user
   */
  isRequestAllowed(
    userId: string,
    plan: UserPlan,
    weight: number = 1
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    reason?: string;
  } {
    const limits = PLAN_LIMITS[plan as UserPlan];
    const bucket = this.getOrCreateBucket(userId);
    const now = Date.now();

    // Check concurrent requests
    if (bucket.concurrentCount >= limits.concurrentRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + 1000,
        reason: 'Concurrent request limit exceeded',
      };
    }

    // Refill tokens based on elapsed time (token bucket algorithm)
    const elapsedSeconds = (now - bucket.lastRefillTime) / 1000;
    const tokensToAdd = (limits.requestsPerMinute / 60) * elapsedSeconds;
    bucket.tokens = Math.min(limits.requestsPerMinute, bucket.tokens + tokensToAdd);
    bucket.lastRefillTime = now;

    // Check per-minute limit
    const minuteKey = Math.floor(now / 60000);
    if (bucket.minuteBucket[0] !== minuteKey) {
      bucket.minuteBucket = [minuteKey, 0];
    }
    bucket.minuteBucket[1] += weight;

    if (bucket.minuteBucket[1] > limits.requestsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (60000 - (now % 60000)),
        reason: 'Per-minute limit exceeded',
      };
    }

    // Check per-hour limit
    const hourKey = Math.floor(now / 3600000);
    if (bucket.hourBucket[0] !== hourKey) {
      bucket.hourBucket = [hourKey, 0];
    }
    bucket.hourBucket[1] += weight;

    if (bucket.hourBucket[1] > limits.requestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (3600000 - (now % 3600000)),
        reason: 'Per-hour limit exceeded',
      };
    }

    // Check per-day limit
    const dayKey = Math.floor(now / 86400000);
    if (bucket.dayBucket[0] !== dayKey) {
      bucket.dayBucket = [dayKey, 0];
    }
    bucket.dayBucket[1] += weight;

    if (bucket.dayBucket[1] > limits.requestsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (86400000 - (now % 86400000)),
        reason: 'Per-day limit exceeded',
      };
    }

    // Consume tokens
    if (bucket.tokens >= weight) {
      bucket.tokens -= weight;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + 60000,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: now + ((weight - bucket.tokens) / (limits.requestsPerMinute / 60)) * 1000,
      reason: 'Token limit exceeded',
    };
  }

  /**
   * Increment concurrent request counter
   */
  incrementConcurrent(userId: string): void {
    const bucket = this.getOrCreateBucket(userId);
    bucket.concurrentCount++;
  }

  /**
   * Decrement concurrent request counter
   */
  decrementConcurrent(userId: string): void {
    const bucket = this.buckets.get(userId);
    if (bucket && bucket.concurrentCount > 0) {
      bucket.concurrentCount--;
    }
  }

  /**
   * Get rate limit stats for a user
   */
  getStats(userId: string, plan: UserPlan): Record<string, any> {
    const bucket = this.buckets.get(userId);
    const limits = PLAN_LIMITS[plan as UserPlan];
    const now = Date.now();

    return {
      plan,
      limits,
      currentTokens: bucket?.tokens ?? limits.requestsPerMinute,
      concurrentRequests: bucket?.concurrentCount ?? 0,
      minuteUsage: bucket?.minuteBucket[1] ?? 0,
      hourUsage: bucket?.hourBucket[1] ?? 0,
      dayUsage: bucket?.dayBucket[1] ?? 0,
      timestamp: now,
    };
  }

  /**
   * Reset user limits (admin operation)
   */
  resetLimits(userId: string): void {
    this.buckets.delete(userId);
    logger.info('Rate limit reset for user', { userId });
  }

  /**
   * Get or create a bucket for a user
   */
  private getOrCreateBucket(userId: string): RateLimitBucket {
    if (!this.buckets.has(userId)) {
      const now = Date.now();
      this.buckets.set(userId, {
        tokens: PLAN_LIMITS[UserPlan.FREE as UserPlan].requestsPerMinute,
        lastRefillTime: now,
        concurrentCount: 0,
        minuteBucket: [Math.floor(now / 60000), 0],
        hourBucket: [Math.floor(now / 3600000), 0],
        dayBucket: [Math.floor(now / 86400000), 0],
      });
    }
    return this.buckets.get(userId)!;
  }

  /**
   * Clean up old buckets to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefillTime > maxAge && bucket.concurrentCount === 0) {
        this.buckets.delete(userId);
      }
    }

    logger.debug('Rate limit cleanup completed', { bucketsRemaining: this.buckets.size });
  }

  /**
   * Shutdown the rate limiter
   */
  shutdown(): void {
    clearInterval(this.cleanupInterval);
    logger.info('Rate limiter shutdown');
  }
}

export const rateLimiter = new PlanBasedRateLimiter();
