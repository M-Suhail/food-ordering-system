import 'dotenv/config';
import { startTracing } from '@food/observability';
import { createServer } from './app';

startTracing(process.env.SERVICE_NAME!);

const port = process.env.PORT ? Number(process.env.PORT) : 3002;

createServer()
  .then(app => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`order service listening on ${port}`);
    });
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error('Failed to start order service', err);
    process.exit(1);
  });
