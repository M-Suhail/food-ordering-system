import express from 'express';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import restaurantRoutes from './routes/restaurant.routes';
import { apiRateLimit } from './middlewares/rateLimit.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { traceMiddleware } from './middlewares/trace.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { authorize } from './middlewares/authorize.middleware';
import { metricsMiddleware, register } from '@food/observability';

export function createServer() {
  const app = express();

  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'api-gateway'));

  app.use(express.json());
  app.use(apiRateLimit as any);
  app.use(traceMiddleware);

  // Public
  app.use('/auth', authRoutes);

  // Protected
  app.use('/orders', authMiddleware, authorize(['USER', 'ADMIN']), orderRoutes);
  app.use('/restaurants', authMiddleware, authorize(['USER', 'ADMIN']), restaurantRoutes);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
}
