import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { publishEvent } from '@food/event-bus';
import { getChannel } from '../lib/rabbitmq';
import { logger } from '../lib/logger';
import { OrderCancelledV1 } from '@food/event-contracts';
import { IdempotencyStore, extractIdempotencyKey } from '@food/idempotency';
import { v4 as uuidv4 } from 'uuid';

// Singleton for tracking idempotency
const idempotencyStore = new IdempotencyStore<{ success: boolean }>();

/**
 * Cancel an order and emit compensation events
 * Idempotent: uses idempotency-key header to prevent duplicates
 *
 * @openapi
 * /orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order (triggers compensation workflow)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: idempotency-key
 *         description: Unique key for idempotency (UUID recommended)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: ['customer_requested']
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Cancellation initiated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
export async function cancelOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  const { reason } = req.body;
  const idempotencyKey = extractIdempotencyKey(
    req.headers['idempotency-key'] as string
  );
  const traceId = uuidv4();

  const log = logger.child({ orderId, traceId });

  try {
    // Check idempotency
    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached) {
        log.info('Cancellation already processed (idempotency hit)');
        return res.status(200).json({
          success: true,
          message: 'Order cancellation already initiated'
        });
      }
    }

    // Validate reason
    const validReasons = [
      'customer_requested',
      'payment_failed',
      'kitchen_rejected',
      'delivery_unavailable'
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
      });
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if already cancelled
    if (order.status === 'CANCELLED') {
      log.warn('Order already cancelled');
      if (idempotencyKey) {
        idempotencyStore.set(idempotencyKey, { success: true });
      }
      return res.status(200).json({
        success: true,
        message: 'Order already cancelled'
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    // Publish cancellation event
    const channel = getChannel();
    const cancelEvent: OrderCancelledV1 = {
      orderId,
      reason,
      cancelledAt: new Date().toISOString(),
      refundAmount: order.total
    };

    await publishEvent(
      channel,
      'order_service.order_cancelled',
      {
        eventId: `cancel-${orderId}`,
        eventType: 'order.cancelled',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'order-service',
        traceId,
        data: cancelEvent
      }
    );

    log.info('Order cancellation initiated', { reason });

    // Store for idempotency
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { success: true });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancellation initiated',
      orderId
    });
  } catch (error) {
    log.error('Error cancelling order', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error)
    });
  }
}
