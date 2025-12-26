import 'dotenv/config';
import { startTracing } from '@food/observability';
import { createServer } from './app';

startTracing(process.env.SERVICE_NAME!);

const port = process.env.PORT || 3003;
const app = createServer();

app.listen(port, () => {
  console.log(`restaurant service running on port ${port}`);
});
