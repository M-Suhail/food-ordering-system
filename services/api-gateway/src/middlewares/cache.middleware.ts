import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../lib/cache';
import { CacheOptions } from '../types';

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[cache-middleware] ${msg}`, data),
  info: (msg, data) => console.log(`[cache-middleware] ${msg}`, data),
  error: (msg, data) => console.error(`[cache-middleware] ${msg}`, data),
  warn: (msg, data) => console.warn(`[cache-middleware] ${msg}`, data),
};

/**
 * Cache key generator with optional custom formatter
 */
function generateCacheKey(req: Request, custom?: (req: Request) => string): string {
  if (custom) return custom(req);

  const baseKey = `${req.method}:${req.path}`;
  const queryStr = Object.keys(req.query).length > 0 ? `:${JSON.stringify(req.query)}` : '';
  return baseKey + queryStr;
}

/**
 * Response caching middleware
 * Caches GET requests by default, configurable per route
 */
export function cacheMiddleware(options: Partial<CacheOptions> = {}) {
  const defaultOptions: CacheOptions = {
    ttl: 300,
    methods: ['GET'],
    statusCodes: [200],
    excludeHeaders: ['authorization', 'cookie'],
    keyGenerator: undefined,
    condition: () => true,
    ...options,
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if conditions not met
    if (!defaultOptions.methods.includes(req.method)) {
      return next();
    }

    if (defaultOptions.condition && !defaultOptions.condition(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req, defaultOptions.keyGenerator);

    try {
      // Try to get from cache
      const cachedResponse = await cacheService.get<any>(cacheKey);

      if (cachedResponse) {
        logger.debug('Serving from cache', { key: cacheKey });
        res.set('X-Cache', 'HIT');
        return res.status(cachedResponse.statusCode).json(cachedResponse.data);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      let originalStatusCode = 200;

      res.status = function (code: number) {
        originalStatusCode = code;
        return this;
      };

      res.json = function (data: any) {
        // Cache successful responses only
        if (
          defaultOptions.statusCodes.includes(originalStatusCode) &&
          defaultOptions.condition &&
          defaultOptions.condition(req)
        ) {
          cacheService.set(
            cacheKey,
            { statusCode: originalStatusCode, data },
            defaultOptions.ttl
          );
          logger.debug('Response cached', { key: cacheKey, ttl: defaultOptions.ttl });
        }

        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error, cacheKey });
      next();
    }
  };
}

/**
 * Invalidate cache on mutations
 */
export function invalidateCacheMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!mutationMethods.includes(req.method)) {
      return next();
    }

    // Intercept response to invalidate related caches
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Invalidate GET caches for the same resource
      const resourcePattern = `GET:${req.path.split('/').slice(0, -1).join('/')}/*`;
      cacheService.clearPattern(resourcePattern);
      logger.debug('Cache invalidated for pattern', { pattern: resourcePattern });

      return originalJson(data);
    };

    next();
  };
}
