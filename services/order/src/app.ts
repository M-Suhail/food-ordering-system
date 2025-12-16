import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';

import {
  consumeEvent,
  publishEvent,
  OrderCreatedV1Schema,
  type OrderCreatedV1
} from '@food/shared-types';
import { swaggerSpec, swaggerUi } from './swagger';

export async function createServer() {
  /**
   * Initialise RabbitMQ
   */
  await initRabbitMQ();
  const channel = getChannel();

  /**
   * Consume order.created events
   */
  await consumeEvent<OrderCreatedV1>(
    channel,
    'order_service.order_created',
    OrderCreatedV1Schema,
    async (data) => {
      /**
       * Idempotency check
       */
      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: data.orderId }
      });

      if (processed) {
        return;
      }

      /**
       * Persist order
       */
      await prisma.order.create({
        data: {
          id: data.orderId,
          restaurantId: data.restaurantId,
          status: 'CREATED',
          total: data.total
        }
      });

      /**
       * Mark event as processed
       */
      await prisma.processedEvent.create({
        data: {
          eventId: data.orderId
        }
      });

      /**
       * Emit follow-up event
       */
      publishEvent(channel, 'order.persisted', {
        eventId: `evt-${Date.now()}`,
        eventType: 'order.persisted',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'order-service',
        data: {
          orderId: data.orderId
        }
      });
    }
  );

  /**
   * HTTP server (health + readiness only)
   */
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  return app;
}



