import express from 'express';
import healthRoutes from './routes/health';
import restaurantRoutes from './routes/restaurants';
import { swaggerSpec, swaggerUi } from './swagger/swagger';

export function createServer() {
  const app = express();
  app.use(express.json());

  app.use(healthRoutes);
  app.use(restaurantRoutes);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  return app;
}

