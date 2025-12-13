import express from 'express';
import routes from './routes';
import { initRabbitMQ } from './lib/rabbitmq';
import { childLogger } from './lib/logger';

export async function createServer() {
  const logger = childLogger('auth');
  await initRabbitMQ(logger); // establish connection pool early

  const app = express();
  app.use(express.json());
  app.use(routes);

  // health
  app.get('/ready', (_, res) => res.json({ status: 'ready' }));
  app.get('/health', (_, res) => res.json({ status: 'ok' }));

  return app;
}
