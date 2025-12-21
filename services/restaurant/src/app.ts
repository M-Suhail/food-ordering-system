import express from 'express';
import healthRoutes from './routes/health';
import restaurantRoutes from './routes/restaurants';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/swagger';

export function createServer() {
  const app = express();
  app.use(express.json());

  app.use(healthRoutes);
  app.use(restaurantRoutes);

  app.use('/docs', ...swaggerUi.serve);
  app.use('/docs', swaggerUi.setup(swaggerSpec));

  return app;
}

