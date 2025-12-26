import 'dotenv/config';
import { startTracing } from '@food/observability';
import { createServer } from './app';

startTracing(process.env.SERVICE_NAME!);

const port = Number(process.env.PORT || 3000);

const app = createServer();

app.listen(port, () => {
  console.log(`api-gateway running on port ${port}`);
});



