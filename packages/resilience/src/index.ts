/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 * States: CLOSED (working) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing - reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing recovery - allow one request
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from HALF_OPEN
  timeout: number; // Milliseconds before retrying (OPEN -> HALF_OPEN)
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000 // 1 minute
    };
  }

  getState(): CircuitBreakerState {
    // If OPEN and timeout has passed, transition to HALF_OPEN
    if (
      this.state === CircuitBreakerState.OPEN &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime > this.config.timeout
    ) {
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === CircuitBreakerState.OPEN) {
      throw new Error(
        `Circuit breaker is OPEN. Service unavailable. Retry after ${this.config.timeout}ms`
      );
    }

    try {
      const result = await fn();

      if (state === CircuitBreakerState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.reset();
        }
      } else {
        // CLOSED state - reset on success
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
      }

      throw error;
    }
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Retry Logic with Exponential Backoff
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1: fraction of delay to randomize
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = {
    maxRetries: config.maxRetries ?? 3,
    initialDelayMs: config.initialDelayMs ?? 100,
    maxDelayMs: config.maxDelayMs ?? 10000,
    backoffMultiplier: config.backoffMultiplier ?? 2,
    jitterFactor: config.jitterFactor ?? 0.1
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelayMs
      );

      const jitter =
        exponentialDelay * finalConfig.jitterFactor * Math.random();
      const delayMs = exponentialDelay + jitter;

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Timeout utility
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

// Export DLQ utilities
export * from './dlq';
