import 'dotenv/config';
import { createServer } from './app';

const port = process.env.PORT || 3004;

createServer().then(app => {
  app.listen(port, () => {
    console.log(`kitchen service running on port ${port}`);
  });
});
