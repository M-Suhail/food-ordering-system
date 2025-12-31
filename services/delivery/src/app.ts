import routes from './routes';
import 'dotenv/config';
import express from 'express';
import { swaggerSpec, swaggerUi } from './swagger';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { connectMongo } from './lib/mongo';
import { assignDriver } from './assign/assignDriver';
import { logger } from './lib/logger';

import { consumeEvent, publishEvent } from '@food/event-bus';
import {
  PaymentSucceededV1Schema,
  type PaymentSucceededV1
} from '@food/event-contracts';

import { metricsMiddleware } from '@food/observability';

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
    async (data, envelope) => {
      const { traceId } = envelope;
      const log = logger.child({ traceId });

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
        traceId,
        data: {
          orderId: data.orderId,
          driverId
        }
      });
    }
  );

  const app = express();
  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'delivery-service'));
    app.use(routes);
    // Swagger docs
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  const { register } = require('@food/observability');
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.get('/health', (_, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_, res) => res.json({ status: 'ready' }));
  return app;
}