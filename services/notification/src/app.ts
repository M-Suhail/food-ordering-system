import routes from './routes';
import express from 'express';
import { swaggerSpec, swaggerUi } from './swagger';
import { initMongo } from './lib/mongo';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';

import { registerOrderCreatedConsumer } from './consumers/orderCreated.consumer';
import { registerKitchenAcceptedConsumer } from './consumers/kitchenAccepted.consumer';
import { registerKitchenRejectedConsumer } from './consumers/kitchenRejected.consumer';
import { registerPaymentSucceededConsumer } from './consumers/paymentSucceeded.consumer';
import { registerPaymentFailedConsumer } from './consumers/paymentFailed.consumer';
import { registerDeliveryAssignedConsumer } from './consumers/deliveryAssigned.consumer';

import { metricsMiddleware, register } from '@food/observability';

export async function createServer() {
  await initMongo();
  await initRabbitMQ();

  const channel = getChannel();

  await registerOrderCreatedConsumer(channel);
  await registerKitchenAcceptedConsumer(channel);
  await registerKitchenRejectedConsumer(channel);
  await registerPaymentSucceededConsumer(channel);
  await registerPaymentFailedConsumer(channel);
  await registerDeliveryAssignedConsumer(channel);

  const app = express();
    app.use(routes);
  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'notification-service'));
    // Swagger docs
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}

