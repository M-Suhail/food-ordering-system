import 'dotenv/config';
import { startTracing } from '@food/observability';
import { createServer} from './app';

startTracing(process.env.SERVICE_NAME!);

const port = Number(process.env.PORT) || 3007;

createServer().then(app => {
  app.listen(port, () =>
    console.log(`notification service running on ${port}`)
  );
});
