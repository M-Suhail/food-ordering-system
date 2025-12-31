import express from 'express';
import authRoutes from './routes/auth.routes';
import { traceMiddleware } from './middlewares/trace.middleware';
import { metricsMiddleware, register } from '@food/observability';

export function createServer() {
  const app = express();

  app.use(metricsMiddleware(process.env.SERVICE_NAME || 'auth-service'));

  app.use(express.json());
  app.use(traceMiddleware);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  app.use('/', authRoutes);

  return app;
}

