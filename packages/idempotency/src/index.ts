/**
 * Idempotency Key Manager
 * Prevents duplicate operations using idempotency keys
 * Stores results keyed by idempotency-id to return cached responses for retries
 */

export interface IdempotencyRecord<T> {
  idempotencyKey: string;
  result: T;
  createdAt: Date;
}

/**
 * In-memory idempotency store (for single instance)
 * In production, use Redis or database for distributed idempotency
 */
export class IdempotencyStore<T> {
  private store: Map<string, IdempotencyRecord<T>> = new Map();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    // default: 24 hours
    this.ttlMs = ttlMs;
    this.startCleanupInterval();
  }

  set(key: string, result: T): void {
    this.store.set(key, {
      idempotencyKey: key,
      result,
      createdAt: new Date()
    });
  }

  get(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;

    // Check if expired
    const now = new Date();
    if (now.getTime() - record.createdAt.getTime() > this.ttlMs) {
      this.store.delete(key);
      return undefined;
    }

    return record.result;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every hour
    setInterval(() => {
      const now = new Date();
      for (const [key, record] of this.store.entries()) {
        if (now.getTime() - record.createdAt.getTime() > this.ttlMs) {
          this.store.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }
}

/**
 * Middleware for Express to validate and extract idempotency key
 */
export function extractIdempotencyKey(
  headerValue?: string
): string | undefined {
  if (!headerValue) return undefined;
  // Idempotency key should be a UUID or non-empty string
  if (headerValue.trim().length === 0) return undefined;
  return headerValue;
}

/**
 * Generate a new idempotency key (UUID v4)
 */
export function generateIdempotencyKey(): string {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}
