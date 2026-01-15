import { Request, Response, NextFunction } from 'express';
import { extractApiVersion, validateRequestPayload, ApiVersion } from '../lib/versioning';

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[versioning] ${msg}`, data),
  info: (msg, data) => console.log(`[versioning] ${msg}`, data),
  error: (msg, data) => console.error(`[versioning] ${msg}`, data),
  warn: (msg, data) => console.warn(`[versioning] ${msg}`, data),
};

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

/**
 * API versioning middleware
 * Extracts version from header or query parameter
 */
export function apiVersionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = extractApiVersion(req);
    req.apiVersion = version;

    res.set('API-Version', version);

    logger.debug('API version extracted', { version, path: req.path });
    next();
  };
}

/**
 * Request validation middleware for API endpoints
 * Validates request body against version-specific schema
 */
export function validateRequestMiddleware(endpoint: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req.apiVersion as ApiVersion) || ApiVersion.V1;

    // Skip validation for GET requests without body
    if (req.method === 'GET') {
      return next();
    }

    const validation = validateRequestPayload(version, endpoint, req.body);

    if (!validation.success) {
      logger.warn('Request validation failed', {
        version,
        endpoint,
        error: validation.error,
        path: req.path,
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error,
        version,
        endpoint,
      });
    }

    // Replace body with validated data
    req.body = validation.data;

    logger.debug('Request validation passed', { version, endpoint });
    next();
  };
}

/**
 * Response transformation middleware
 * Transforms response based on API version
 */
export function responseTransformMiddleware(endpoint?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req.apiVersion as ApiVersion) || ApiVersion.V1;
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Transform based on version if endpoint provided
      let responseData = data;

      if (endpoint && version === 'v2') {
        responseData = {
          data,
          metadata: {
            version,
            timestamp: new Date().toISOString(),
            _links: generateHATEOASLinks(req.path, req.method),
          },
        };
      }

      return originalJson(responseData);
    };

    next();
  };
}

/**
 * Generate HATEOAS links for responses
 */
function generateHATEOASLinks(path: string, method: string): Record<string, string> {
  const links: Record<string, Record<string, string | undefined>> = {
    '/api/v2/auth/register': {
      self: '/api/v2/auth/register',
      login: '/api/v2/auth/login',
      profile: '/api/v2/auth/profile',
    },
    '/api/v2/auth/login': {
      self: '/api/v2/auth/login',
      register: '/api/v2/auth/register',
      profile: '/api/v2/auth/profile',
      logout: '/api/v2/auth/logout',
      refresh: '/api/v2/auth/refresh',
    },
    '/api/v2/orders': {
      self: '/api/v2/orders',
      create: method === 'POST' ? undefined : '/api/v2/orders',
      list: method === 'GET' ? undefined : '/api/v2/orders',
    },
    '/api/v2/restaurants': {
      self: '/api/v2/restaurants',
      list: '/api/v2/restaurants',
    },
  };

  // Return base path links, filtering out undefined values
  const basePath = path.split('?')[0]; // Remove query params
  return Object.fromEntries(
    Object.entries(links[basePath] || {}).filter(([_, v]) => v !== undefined) as Array<[string, string]>
  ) || {};
}

/**
 * Version deprecation warning middleware
 */
export function versionDeprecationMiddleware(deprecatedVersions: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version: string = (req.apiVersion as string) ?? 'v1';

    if (deprecatedVersions.includes(version)) {
      res.set('Deprecation', 'true');
      res.set('Sunset', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString());
      res.set('Warning', `299 - "API version ${version} is deprecated"`);

      logger.warn('Deprecated API version used', { version, path: req.path });
    }

    next();
  };
}
