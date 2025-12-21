import express from 'express';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import restaurantRoutes from './routes/restaurant.routes';
import { apiRateLimit } from './middlewares/rateLimit.middleware';
import { errorHandler } from './middlewares/error.middleware';

export function createServer() {
  const app = express();

  app.use(express.json());
  app.use(apiRateLimit as any);

  app.use('/auth', authRoutes);
  app.use('/orders', orderRoutes);
  app.use('/restaurants', restaurantRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
}


