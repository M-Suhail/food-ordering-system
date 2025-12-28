import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';
import { decideKitchen } from './decision/decideKitchen';
import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  OrderCreatedV1Schema,
  type OrderCreatedV1
} from '@food/event-contracts';
import { logger } from './lib/logger';
import { metricsMiddleware } from '@food/observability';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();

  await consumeEvent<OrderCreatedV1>(
    channel,
    'kitchen_service.order_created',
    OrderCreatedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });

      // Idempotency
      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: data.orderId }
      });
      if (processed) return;

      const decision = decideKitchen(data);

      await prisma.kitchenOrder.create({
        data: {
          orderId: data.orderId,
          status: decision.status,
          reason: decision.reason
        }
      });

      await prisma.processedEvent.create({
        data: { eventId: data.orderId }
      });

      if (decision.status === 'ACCEPTED') {
        await publishEvent(channel, 'kitchen.accepted', {
          eventId: `evt-${Date.now()}`,
          eventType: 'kitchen.accepted',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'kitchen-service',
          traceId,
          data: { orderId: data.orderId }
        });
      } else {
        await publishEvent(channel, 'kitchen.rejected', {
          eventId: `evt-${Date.now()}`,
          eventType: 'kitchen.rejected',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'kitchen-service',
          traceId,
          data: {
            orderId: data.orderId,
            reason: decision.reason
          }
        });
      }
    }
  );

  const app = express();
    const { register } = require('@food/observability');
    app.use(metricsMiddleware(process.env.SERVICE_NAME || 'kitchen-service'));
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

  return app;
}
