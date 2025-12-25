import express from 'express';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import restaurantRoutes from './routes/restaurant.routes';
import { apiRateLimit } from './middlewares/rateLimit.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { traceMiddleware } from './middlewares/trace.middleware';
import { register } from '@food/observability';

export function createServer() {
  const app = express();

  app.use(express.json());
  app.use(apiRateLimit as any);
  app.use(traceMiddleware);

  app.use('/auth', authRoutes);
  app.use('/orders', orderRoutes);
  app.use('/restaurants', restaurantRoutes);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
}


