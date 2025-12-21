import 'dotenv/config';
import express from 'express';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { connectMongo } from './lib/mongo';
import { assignDriver } from './assign/assignDriver';

import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  PaymentSucceededV1Schema,
  type PaymentSucceededV1
} from '@food/event-contracts';

export async function createServer() {
  await initRabbitMQ();
  const channel = getChannel();
  const db = await connectMongo();

  const deliveries = db.collection('deliveries');
  const processedEvents = db.collection('processed_events');

  await consumeEvent<PaymentSucceededV1>(
    channel,
    'delivery_service.payment_succeeded',
    PaymentSucceededV1Schema,
    async (data) => {
      const processed = await processedEvents.findOne({
        eventId: data.orderId
      });

      if (processed) return;

      const driverId = assignDriver(data.orderId);

      await deliveries.insertOne({
        orderId: data.orderId,
        driverId,
        status: 'ASSIGNED',
        assignedAt: new Date()
      });

      await processedEvents.insertOne({
        eventId: data.orderId,
        processedAt: new Date()
      });

      await publishEvent(channel, 'delivery.assigned', {
        eventId: `evt-${Date.now()}`,
        eventType: 'delivery.assigned',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: 'delivery-service',
        data: {
          orderId: data.orderId,
          driverId
        }
      });
    }
  );

  const app = express();
  app.get('/health', (_, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_, res) => res.json({ status: 'ready' }));
  return app;
}
