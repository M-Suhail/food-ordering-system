import express from 'express';
import routes from './routes';
import { initRabbitMQ, getChannel } from './lib/rabbitmq';
import { consumeEvent } from '@food/shared-types/dist/rabbit/consumer';
import { OrderCreatedV1Schema } from '@food/shared-types';

export async function createServer() {
  await initRabbitMQ();

  const channel = getChannel();
  await consumeEvent(
    channel,
    'order_service.order_created',
    OrderCreatedV1Schema,
    async data => {
      // TODO persist order, idempotency
      console.log('order.created processed', data);
    }
  );

  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

