import { Request } from 'express';

/**
 * Cache middleware options
 */
export interface CacheOptions {
  ttl: number; // Time to live in seconds
  methods: string[]; // HTTP methods to cache (default: GET)
  statusCodes: number[]; // Status codes to cache (default: 200)
  excludeHeaders: string[]; // Headers to exclude from cache key
  keyGenerator?: (req: Request) => string; // Custom cache key generator
  condition?: (req: Request) => boolean; // Condition to cache request
}

/**
 * Rate limit configuration
 */
export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  statusCode?: number; // Status code to return
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Webhook event payload
 */
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

/**
 * API versioning options
 */
export interface ApiVersionOptions {
  defaultVersion?: string;
  supportedVersions?: string[];
}

/**
 * User context added by auth middleware
 */
export interface UserContext {
  userId: string;
  email: string;
  roles: string[];
  plan: string;
}
