import 'dotenv/config';
import { createServer } from './app';

const port = process.env.PORT || 3006;

createServer().then(app => {
  app.listen(port, () => {
    console.log(`delivery service running on port ${port}`);
  });
});