let axiosClient: any;
let AxiosErrorClass: any;

try {
  const axiosModule = require('axios');
  axiosClient = axiosModule.default || axiosModule;
  AxiosErrorClass = axiosModule.AxiosError;
} catch (e) {
  // axios not installed
  axiosClient = null;
  AxiosErrorClass = Error;
}

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[webhooks] ${msg}`, data),
  info: (msg, data) => console.log(`[webhooks] ${msg}`, data),
  error: (msg, data) => console.error(`[webhooks] ${msg}`, data),
  warn: (msg, data) => console.warn(`[webhooks] ${msg}`, data),
};

export enum WebhookEvent {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  DELIVERY_ASSIGNED = 'delivery.assigned',
  DELIVERY_COMPLETED = 'delivery.completed',
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

export interface RegisteredWebhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: Date;
}

/**
 * WebhookRegistry manages webhook subscriptions
 */
export class WebhookRegistry {
  private webhooks: Map<string, RegisteredWebhook> = new Map();
  private eventSubscribers: Map<WebhookEvent, Set<string>> = new Map();

  /**
   * Register a webhook endpoint
   */
  registerWebhook(
    url: string,
    events: WebhookEvent[],
    secret: string
  ): RegisteredWebhook {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhook: RegisteredWebhook = {
      id,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date(),
    };

    this.webhooks.set(id, webhook);

    // Register subscribers
    events.forEach((event) => {
      if (!this.eventSubscribers.has(event)) {
        this.eventSubscribers.set(event, new Set());
      }
      this.eventSubscribers.get(event)!.add(id);
    });

    logger.info('Webhook registered', { id, url, events: events.length });
    return webhook;
  }

  /**
   * Unregister a webhook
   */
  unregisterWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    webhook.events.forEach((event) => {
      const subscribers = this.eventSubscribers.get(event);
      if (subscribers) {
        subscribers.delete(webhookId);
      }
    });

    this.webhooks.delete(webhookId);
    logger.info('Webhook unregistered', { webhookId });
    return true;
  }

  /**
   * Get all webhooks for an event
   */
  getWebhooksForEvent(event: WebhookEvent): RegisteredWebhook[] {
    const webhookIds = this.eventSubscribers.get(event) || new Set();
    return Array.from(webhookIds)
      .map((id) => this.webhooks.get(id))
      .filter((w): w is RegisteredWebhook => w !== undefined && w.active);
  }

  /**
   * List all registered webhooks
   */
  listWebhooks(): RegisteredWebhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Enable/disable a webhook
   */
  setWebhookActive(webhookId: string, active: boolean): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    webhook.active = active;
    logger.info('Webhook status changed', { webhookId, active });
    return true;
  }
}

/**
 * WebhookDispatcher sends webhook payloads
 */
export class WebhookDispatcher {
  private registry: WebhookRegistry;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(registry: WebhookRegistry) {
    this.registry = registry;
  }

  /**
   * Dispatch webhook event to all registered subscribers
   */
  async dispatchEvent(event: WebhookEvent, data: Record<string, any>): Promise<void> {
    const webhooks = this.registry.getWebhooksForEvent(event);

    if (webhooks.length === 0) {
      logger.debug('No webhooks registered for event', { event });
      return;
    }

    logger.info('Dispatching webhooks', { event, count: webhooks.length });

    await Promise.all(
      webhooks.map((webhook) => this.sendWebhook(webhook, event, data))
    );
  }

  /**
   * Send webhook to a single endpoint with retry logic
   */
  private async sendWebhook(
    webhook: RegisteredWebhook,
    event: WebhookEvent,
    data: Record<string, any>,
    attempt: number = 1
  ): Promise<void> {
    try {
      if (!axiosClient) {
        logger.error('Axios not available', { webhookId: webhook.id });
        return;
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        signature: '', // Will be computed below
      };

      // Compute HMAC signature
      payload.signature = this.computeSignature(payload, webhook.secret);

      const response = await axiosClient.post(webhook.url, payload, {
        timeout: 5000,
        headers: {
          'X-Webhook-Event': event,
          'X-Webhook-Signature': payload.signature,
          'X-Webhook-Id': webhook.id,
          'Content-Type': 'application/json',
        },
      });

      logger.info('Webhook delivered', {
        webhookId: webhook.id,
        event,
        statusCode: response.status,
      });
    } catch (error) {
      const axiosError = error as any;

      if (attempt < this.maxRetries) {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        logger.warn('Webhook failed, retrying', {
          webhookId: webhook.id,
          event,
          attempt,
          delay,
          error: axiosError.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendWebhook(webhook, event, data, attempt + 1);
      }

      logger.error('Webhook delivery failed after retries', {
        webhookId: webhook.id,
        event,
        attempts: this.maxRetries,
        error: axiosError.message,
      });
    }
  }

  /**
   * Compute HMAC-SHA256 signature for webhook payload
   */
  private computeSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const message = JSON.stringify({
      event: payload.event,
      timestamp: payload.timestamp,
      data: payload.data,
    });

    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }
}

export const webhookRegistry = new WebhookRegistry();
export const webhookDispatcher = new WebhookDispatcher(webhookRegistry);
