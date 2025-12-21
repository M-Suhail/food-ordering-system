import 'dotenv/config';
import { createApp } from './app';

const port = Number(process.env.PORT) || 3007;

createApp().then(app => {
  app.listen(port, () =>
    console.log(`notification service running on ${port}`)
  );
});
