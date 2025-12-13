import express from 'express';
import routes from './routes';
import { initRabbitMQ } from './lib/rabbitmq';
import { childLogger } from './lib/logger';

export async function createServer() {
  const logger = childLogger('order');
  await initRabbitMQ(logger);

  const app = express();
  app.use(express.json());
  app.use(routes);

  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}
