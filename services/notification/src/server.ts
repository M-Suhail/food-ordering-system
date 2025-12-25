import 'dotenv/config';
import { createServer} from './app';

const port = Number(process.env.PORT) || 3007;

createServer().then(app => {
  app.listen(port, () =>
    console.log(`notification service running on ${port}`)
  );
});
