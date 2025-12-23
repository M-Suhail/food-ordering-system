import express from 'express';
import authRoutes from './routes/auth.routes';

export function createServer() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  app.use('/auth', authRoutes);

  return app;
}

