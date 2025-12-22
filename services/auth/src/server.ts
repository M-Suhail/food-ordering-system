// import 'dotenv/config';
// import { createServer } from './app';
// const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// createServer()
//   .then(app => {
//     app.listen(port, () => {
//       // eslint-disable-next-line no-console
//       console.log(`auth service listening on ${port}`);
//     });
//   })
//   .catch(err => {
//     // eslint-disable-next-line no-console
//     console.error('Failed to start auth service', err);
//     process.exit(1);
//   });

import 'dotenv/config';
import { createServer } from './app';

const port = Number(process.env.PORT || 3001);

const app = createServer();

app.listen(port, () => {
  console.log(`auth-service running on port ${port}`);
});
