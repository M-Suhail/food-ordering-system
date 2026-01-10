import routes from './routes';
import express from 'express';
import { swaggerSpec, swaggerUi } from './swagger';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';
import { processPayment } from './payment/processPayment';
import { consumeEvent, publishEvent } from '@food/event-bus';
import { logger } from './lib/logger';
import {
  KitchenAcceptedV1Schema,
  type KitchenAcceptedV1,
  OrderCancelledV1Schema,
  type OrderCancelledV1
} from '@food/event-contracts';
import { metricsMiddleware, register } from '@food/observability';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();

  /**
   * kitchen.accepted -> Process Payment
   */
  await consumeEvent<KitchenAcceptedV1>(
    channel,
    'payment_service.kitchen_accepted',
    KitchenAcceptedV1Schema,
    async (data, envelope) => {

      const { traceId } = envelope;
      const log = logger.child({ traceId });
      // Idempotency
      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: data.orderId }
      });
      if (processed) return;

      const result = processPayment(data.orderId, data.total ?? 0);

      await prisma.payment.create({
        data: {
          orderId: data.orderId,
          status: result.status,
          amount: data.total ?? 0,
          reason: result.reason
        }
      });

      await prisma.processedEvent.create({
        data: { eventId: data.orderId }
      });

      if (result.status === 'SUCCEEDED') {
        await publishEvent(
          channel,
          'payment_service.payment_succeeded',
          {
            eventId: `pay-${data.orderId}`,
            eventType: 'payment.succeeded',
            eventVersion: 1,
            occurredAt: new Date().toISOString(),
            producer: 'payment-service',
            traceId,
            data: {
              orderId: data.orderId,
              amount: data.total ?? 0,
              succeededAt: new Date().toISOString()
            }
          }
        );
      } else {
        // Payment failed - trigger compensation
        await publishEvent(
          channel,
          'payment_service.payment_failed',
          {
            eventId: `pay-failed-${data.orderId}`,
            eventType: 'payment.failed',
            eventVersion: 1,
            occurredAt: new Date().toISOString(),
            producer: 'payment-service',
            traceId,
            data: {
              orderId: data.orderId,
              reason: result.reason,
              failedAt: new Date().toISOString()
            }
          }
        );

        // Also publish refund event to trigger order cancellation compensation
        await publishEvent(
          channel,
          'payment_service.payment_refund',
          {
            eventId: `refund-${data.orderId}`,
            eventType: 'payment.refund',
            eventVersion: 1,
            occurredAt: new Date().toISOString(),
            producer: 'payment-service',
            traceId,
            data: {
              paymentId: `pay-${data.orderId}`,
              orderId: data.orderId,
              amount: data.total ?? 0,
              reason: 'customer_cancellation' as const,
              initiatedAt: new Date().toISOString()
            }
          }
        );

        log.warn('Payment failed, compensation triggered');
      }
    }
  );

  /**
   * order.cancelled -> Process Refund
   * When order is cancelled by customer, process refund
   */
  await consumeEvent<OrderCancelledV1>(
    channel,
    'payment_service.order_cancelled',
    OrderCancelledV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId, orderId: data.orderId });

      // Prevent duplicate refunds
      const refundEventId = `refund-${data.orderId}`;
      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: refundEventId }
      });

      if (processed) {
        log.info('Refund already processed');
        return;
      }

      // Find the payment record
      const payment = await prisma.payment.findFirst({
        where: { orderId: data.orderId }
      });

      if (!payment) {
        log.warn('No payment found for refund');
        // Mark as processed anyway
        await prisma.processedEvent.create({
          data: { eventId: refundEventId }
        });
        return;
      }

      // Mark payment as refunded
      await prisma.payment.update({
        where: { orderId: payment.orderId },
        data: {
          status: 'REFUNDED',
          reason: `Refunded due to: ${data.reason}`
        }
      });

      // Publish refund event
      await publishEvent(
        channel,
        'payment_service.payment_refund',
        {
          eventId: refundEventId,
          eventType: 'payment.refund',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'payment-service',
          traceId,
          data: {
            paymentId: payment.orderId,
            orderId: data.orderId,
            amount: data.refundAmount || payment.amount,
            reason: 'customer_cancellation' as const,
            initiatedAt: new Date().toISOString()
          }
        }
      );

      await prisma.processedEvent.create({
        data: { eventId: refundEventId }
      });

      log.info('Order cancellation refund processed');
    }
  );

  const app = express();
    app.use(routes);
    // Swagger docs
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'payment-service'));

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));
  return app;
}


