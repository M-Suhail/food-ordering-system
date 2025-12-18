import 'dotenv/config';
import { createServer } from './app';

const port = process.env.PORT || 3005;

createServer().then(app => {
  app.listen(port, () => {
    console.log(`payment service running on port ${port}`);
  });
});


