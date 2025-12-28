import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';
import { processPayment } from './payment/processPayment';
import { consumeEvent, publishEvent } from '@food/event-bus';
import { logger } from './lib/logger';
import {
  KitchenAcceptedV1Schema,
  type KitchenAcceptedV1
} from '@food/event-contracts';
import { metricsMiddleware } from '@food/observability';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();

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
        await publishEvent(channel, 'payment.succeeded', {
          eventId: `evt-${Date.now()}`,
          eventType: 'payment.succeeded',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'payment-service',
          traceId,
          data: {
            orderId: data.orderId,
            total: data.total
          }
        });
      } else {
        await publishEvent(channel, 'payment.failed', {
          eventId: `evt-${Date.now()}`,
          eventType: 'payment.failed',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'payment-service',
          traceId,
          data: {
            orderId: data.orderId,
            reason: result.reason
          }
        });
      }
    }
  );

  const app = express();
  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'payment-service'));
  const { register } = require('@food/observability');
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));
  return app;
}


