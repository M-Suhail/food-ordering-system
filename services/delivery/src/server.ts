import 'dotenv/config';
import { startTracing } from '@food/observability';
import { createServer } from './app';

startTracing(process.env.SERVICE_NAME!);

const port = process.env.PORT || 3006;

createServer().then(app => {
  app.listen(port, () => {
    console.log(`delivery service running on port ${port}`);
  });
});