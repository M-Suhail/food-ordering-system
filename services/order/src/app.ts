import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';
import { logger } from './lib/logger';

import { consumeEvent } from '@food/event-bus';
import {
  OrderCreatedV1Schema,
  DeliveryAssignedV1Schema,
  type OrderCreatedV1,
  type DeliveryAssignedV1
} from '@food/event-contracts';

import { metricsMiddleware } from '@food/observability';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();

  /**
   * order.created
   */
  await consumeEvent<OrderCreatedV1>(
    channel,
    'order_service.order_created',
    OrderCreatedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });

      log.info('Received order.created');

      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: data.orderId }
      });

      if (processed) {
        log.info('order.created already processed');
        return;
      }

      await prisma.order.create({
        data: {
          id: data.orderId,
          restaurantId: data.restaurantId,
          status: 'CREATED',
          total: data.total,
        }
      });

      await prisma.processedEvent.create({
        data: {
          eventId: data.orderId,
        }
      });

      log.info('Order persisted');
    }
  );

  /**
   * delivery.assigned
   */
  await consumeEvent<DeliveryAssignedV1>(
    channel,
    'order_service.delivery_assigned',
    DeliveryAssignedV1Schema,
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });

      const id = `delivery-${data.orderId}`;

      log.info('Received delivery.assigned');

      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: id }
      });

      if (processed) {
        log.info('delivery.assigned already processed');
        return;
      }

      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: 'DELIVERY_ASSIGNED'
        }
      });

      await prisma.processedEvent.create({
        data: {
          eventId: id
        }
      });

      log.info('Order marked DELIVERY_ASSIGNED');
    }
  );

  const app = express();
  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'order-service'));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

  return app;
}





