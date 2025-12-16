import { createServer } from './app';

const port = process.env.PORT || 3003;
const app = createServer();

app.listen(port, () => {
  console.log(`restaurant service running on port ${port}`);
});
