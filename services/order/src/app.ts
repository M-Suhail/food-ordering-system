import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { prisma } from './lib/db';

import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  OrderCreatedV1Schema,
  DeliveryAssignedV1Schema,
  type OrderCreatedV1,
  type DeliveryAssignedV1
} from '@food/event-contracts';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();

  await consumeEvent<OrderCreatedV1>(
    channel,
    'order_service.order_created',
    OrderCreatedV1Schema,
    async (data) => {
      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: data.orderId }
      });
      if (processed) return;

      await prisma.order.create({
        data: {
          id: data.orderId,
          restaurantId: data.restaurantId,
          status: 'CREATED',
          total: data.total
        }
      });

      await prisma.processedEvent.create({
        data: { eventId: data.orderId }
      });
    }
  );

  await consumeEvent<DeliveryAssignedV1>(
    channel,
    'order_service.delivery_assigned',
    DeliveryAssignedV1Schema,
    async (data) => {
      const id = `delivery-${data.orderId}`;

      const processed = await prisma.processedEvent.findUnique({
        where: { eventId: id }
      });
      if (processed) return;

      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'DELIVERY_ASSIGNED' }
      });

      await prisma.processedEvent.create({
        data: { eventId: id }
      });
    }
  );

  const app = express();
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));
  return app;
}




