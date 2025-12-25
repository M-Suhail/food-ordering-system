import express from 'express';
import healthRoutes from './routes/health';
import restaurantRoutes from './routes/restaurants';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/swagger';
import { traceMiddleware } from './middlewares/trace.middleware';
import { register } from '@food/observability';

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(traceMiddleware);

  app.use(healthRoutes);
  app.use(restaurantRoutes);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/docs', ...swaggerUi.serve);
  app.use('/docs', swaggerUi.setup(swaggerSpec));

  return app;
}

