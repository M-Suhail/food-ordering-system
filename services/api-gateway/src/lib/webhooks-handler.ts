import { Request, Response, NextFunction } from 'express';
import { webhookRegistry, webhookDispatcher, WebhookEvent } from '../lib/webhooks';

interface Logger {
  debug: (msg: string, data?: any) => void;
  info: (msg: string, data?: any) => void;
  error: (msg: string, data?: any) => void;
  warn: (msg: string, data?: any) => void;
}

const logger: Logger = {
  debug: (msg, data) => console.debug(`[webhooks-handler] ${msg}`, data),
  info: (msg, data) => console.log(`[webhooks-handler] ${msg}`, data),
  error: (msg, data) => console.error(`[webhooks-handler] ${msg}`, data),
  warn: (msg, data) => console.warn(`[webhooks-handler] ${msg}`, data),
};

/**
 * Register a webhook
 * POST /api/webhooks/register
 * Body: { url: string, events: string[], secret: string }
 */
export async function registerWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { url, events, secret } = req.body;

    if (!url || !events || !secret) {
      res.status(400).json({
        error: 'Missing required fields: url, events, secret',
      });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'events must be a non-empty array',
      });
      return;
    }

    // Validate event types
    const validEvents = Object.values(WebhookEvent);
    for (const event of events) {
      if (!validEvents.includes(event as WebhookEvent)) {
        res.status(400).json({
          error: `Invalid event: ${event}`,
          validEvents,
        });
        return;
      }
    }

    const webhook = webhookRegistry.registerWebhook(
      url,
      events as WebhookEvent[],
      secret
    );

    logger.info('Webhook registered', {
      webhookId: webhook.id,
      url,
      eventCount: events.length,
    });

    res.status(201).json({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      createdAt: webhook.createdAt,
    });
  } catch (error) {
    logger.error('Error registering webhook', { error });
    res.status(500).json({
      error: 'Failed to register webhook',
    });
  }
}

/**
 * Unregister a webhook
 * DELETE /api/webhooks/:id
 */
export async function unregisterWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const success = webhookRegistry.unregisterWebhook(id);

    if (!success) {
      res.status(404).json({
        error: 'Webhook not found',
      });
      return;
    }

    logger.info('Webhook unregistered', { webhookId: id });

    res.json({ message: 'Webhook unregistered', id });
  } catch (error) {
    logger.error('Error unregistering webhook', { error });
    res.status(500).json({
      error: 'Failed to unregister webhook',
    });
  }
}

/**
 * List all webhooks
 * GET /api/webhooks
 */
export async function listWebhooks(req: Request, res: Response): Promise<void> {
  try {
    const webhooks = webhookRegistry.listWebhooks();

    res.json({
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        createdAt: w.createdAt,
      })),
      count: webhooks.length,
    });
  } catch (error) {
    logger.error('Error listing webhooks', { error });
    res.status(500).json({
      error: 'Failed to list webhooks',
    });
  }
}

/**
 * Enable/disable a webhook
 * PATCH /api/webhooks/:id
 * Body: { active: boolean }
 */
export async function updateWebhookStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      res.status(400).json({
        error: 'active must be a boolean',
      });
      return;
    }

    const success = webhookRegistry.setWebhookActive(id, active);

    if (!success) {
      res.status(404).json({
        error: 'Webhook not found',
      });
      return;
    }

    res.json({ message: 'Webhook status updated', id, active });
  } catch (error) {
    logger.error('Error updating webhook status', { error });
    res.status(500).json({
      error: 'Failed to update webhook status',
    });
  }
}

/**
 * Test webhook delivery
 * POST /api/webhooks/:id/test
 * Sends a test payload to verify webhook configuration
 */
export async function testWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const webhooks = webhookRegistry.listWebhooks();
    const webhook = webhooks.find((w) => w.id === id);

    if (!webhook) {
      res.status(404).json({
        error: 'Webhook not found',
      });
      return;
    }

    // Send test payload
    await webhookDispatcher.dispatchEvent(WebhookEvent.ORDER_CREATED, {
      orderId: 'test_' + Date.now(),
      customerId: 'test_customer',
      amount: 99.99,
      status: 'CREATED',
    });

    logger.info('Test webhook dispatched', { webhookId: id });

    res.json({
      message: 'Test webhook dispatched',
      id,
      event: WebhookEvent.ORDER_CREATED,
    });
  } catch (error) {
    logger.error('Error testing webhook', { error });
    res.status(500).json({
      error: 'Failed to test webhook',
    });
  }
}

/**
 * Dispatch webhook event (internal use)
 * Should be called after critical events in the system
 */
export async function dispatchWebhookEvent(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    await webhookDispatcher.dispatchEvent(event, data);
    logger.info('Webhook event dispatched', { event, subscribers: 1 });
  } catch (error) {
    logger.error('Error dispatching webhook', { event, error });
  }
}
