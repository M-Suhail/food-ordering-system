import { z } from 'zod';

/**
 * API versioning strategy - all endpoints support versioning via headers or URL
 * Supported: v1, v2
 */

export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
}

// Version-specific schema validators
export const versionSchemas = {
  [ApiVersion.V1]: {
    register: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }),
    login: z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
    createOrder: z.object({
      restaurantId: z.string().uuid(),
      items: z.array(
        z.object({
          itemId: z.string().uuid(),
          quantity: z.number().int().min(1),
        })
      ),
      deliveryAddress: z.string().min(5),
    }),
    cancelOrder: z.object({
      reason: z.string().optional(),
    }),
  },
  [ApiVersion.V2]: {
    register: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      phone: z.string().optional(),
      preferences: z.object({
        notifications: z.boolean().optional(),
        marketing: z.boolean().optional(),
      }).optional(),
    }),
    login: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      rememberMe: z.boolean().optional(),
    }),
    createOrder: z.object({
      restaurantId: z.string().uuid(),
      items: z.array(
        z.object({
          itemId: z.string().uuid(),
          quantity: z.number().int().min(1),
          specialInstructions: z.string().optional(),
        })
      ),
      deliveryAddress: z.string().min(5),
      notes: z.string().optional(),
      promoCode: z.string().optional(),
    }),
    cancelOrder: z.object({
      reason: z.string().optional(),
      refundMethod: z.enum(['original', 'wallet']).optional(),
    }),
  },
};

/**
 * Extract API version from request
 * Priority: header > query parameter > default (v1)
 */
export function extractApiVersion(req: any): ApiVersion {
  const headerVersion = req.headers['api-version'];
  const queryVersion = req.query['api-version'];
  const version = headerVersion || queryVersion || ApiVersion.V1;

  if (Object.values(ApiVersion).includes(version)) {
    return version as ApiVersion;
  }

  return ApiVersion.V1;
}

/**
 * Validate request payload against version-specific schema
 */
export function validateRequestPayload(
  version: ApiVersion,
  endpoint: string,
  payload: any
): { success: boolean; data?: any; error?: string } {
  const schema = (versionSchemas[version] as any)?.[endpoint];

  if (!schema) {
    return {
      success: false,
      error: `No schema found for endpoint: ${endpoint}`,
    };
  }

  try {
    const validated = schema.parse(payload);
    return { success: true, data: validated };
  } catch (error) {
    const zodError = error as z.ZodError;
    return {
      success: false,
      error: zodError.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; '),
    };
  }
}

/**
 * Transform response based on API version
 */
export function transformResponse(version: ApiVersion, endpoint: string, data: any): any {
  // V2 adds additional metadata to responses
  if (version === ApiVersion.V2) {
    return {
      data,
      metadata: {
        version: ApiVersion.V2,
        timestamp: new Date().toISOString(),
        _links: getLinksByEndpoint(endpoint),
      },
    };
  }

  return data;
}

/**
 * HATEOAS links for V2 API
 */
function getLinksByEndpoint(endpoint: string): Record<string, string> {
  const links: Record<string, Record<string, string>> = {
    register: {
      login: '/api/v2/auth/login',
      profile: '/api/v2/auth/profile',
    },
    login: {
      profile: '/api/v2/auth/profile',
      orders: '/api/v2/orders',
      logout: '/api/v2/auth/logout',
    },
    createOrder: {
      orders: '/api/v2/orders',
      restaurants: '/api/v2/restaurants',
    },
    cancelOrder: {
      orders: '/api/v2/orders',
    },
  };

  return links[endpoint] || {};
}
