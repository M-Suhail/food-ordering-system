import { Request, Response, NextFunction } from 'express';
import { rateLimiter, UserPlan, PLAN_LIMITS } from '../lib/planBasedRateLimit';

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[rate-limit-middleware] ${msg}`, data),
  info: (msg, data) => console.log(`[rate-limit-middleware] ${msg}`, data),
  error: (msg, data) => console.error(`[rate-limit-middleware] ${msg}`, data),
  warn: (msg, data) => console.warn(`[rate-limit-middleware] ${msg}`, data),
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userPlan?: UserPlan;
    }
  }
}

/**
 * Plan-based rate limiting middleware
 * Uses user context from auth middleware to determine rate limits
 */
export function planBasedRateLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for health/ready endpoints
    if (req.path === '/health' || req.path === '/ready' || req.path === '/metrics') {
      return next();
    }

    const userId = req.userId || 'anonymous';
    const userPlan = req.userPlan || UserPlan.FREE;

    // Check if request is allowed
    const rateLimitCheck = rateLimiter.isRequestAllowed(userId, userPlan, 1);

    // Set rate limit headers
    const limits = PLAN_LIMITS[userPlan];
    res.set({
      'X-RateLimit-Limit': String(limits.requestsPerMinute),
      'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
      'X-RateLimit-Reset': String(rateLimitCheck.resetAt),
      'X-RateLimit-Plan': userPlan,
    });

    if (!rateLimitCheck.allowed) {
      logger.warn('Rate limit exceeded', {
        userId,
        userPlan,
        reason: rateLimitCheck.reason,
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: rateLimitCheck.reason || 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000),
        plan: userPlan,
      });
    }

    // Track concurrent requests
    rateLimiter.incrementConcurrent(userId);

    // Decrement on response
    res.on('finish', () => {
      rateLimiter.decrementConcurrent(userId);
    });

    res.on('close', () => {
      rateLimiter.decrementConcurrent(userId);
    });

    logger.debug('Rate limit check passed', {
      userId,
      userPlan,
      remaining: rateLimitCheck.remaining,
    });

    next();
  };
}

/**
 * Endpoint-specific rate limiting with custom weights
 * Useful for expensive operations that should count as multiple requests
 */
export function endpointRateLimitMiddleware(weight: number = 1) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId || 'anonymous';
    const userPlan = req.userPlan || UserPlan.FREE;

    const rateLimitCheck = rateLimiter.isRequestAllowed(userId, userPlan, weight);

    res.set({
      'X-RateLimit-Weight': String(weight),
      'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
    });

    if (!rateLimitCheck.allowed) {
      logger.warn('Rate limit exceeded for weighted endpoint', {
        userId,
        userPlan,
        weight,
        reason: rateLimitCheck.reason,
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `This operation requires ${weight} request(s)`,
        retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000),
      });
    }

    rateLimiter.incrementConcurrent(userId);

    res.on('finish', () => {
      rateLimiter.decrementConcurrent(userId);
    });

    res.on('close', () => {
      rateLimiter.decrementConcurrent(userId);
    });

    next();
  };
}

/**
 * Admin endpoint to get rate limit stats
 */
export function getRateLimitStats(req: Request, res: Response): Response {
  const userId = req.userId || req.query.userId || 'anonymous';
  const userPlan = (req.query.plan as UserPlan) || UserPlan.FREE;

  if (!Object.values(UserPlan).includes(userPlan)) {
    return res.status(400).json({
      error: 'Invalid plan',
      validPlans: Object.values(UserPlan),
    });
  }

  const stats = rateLimiter.getStats(userId as string, userPlan);
  return res.json(stats);
}

/**
 * Admin endpoint to reset user limits
 */
export function resetUserRateLimit(req: Request, res: Response): Response {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId parameter required' });
  }

  rateLimiter.resetLimits(userId);
  return res.json({ message: 'Rate limits reset', userId });
}
