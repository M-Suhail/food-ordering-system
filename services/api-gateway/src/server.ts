import 'dotenv/config';
import { createServer } from './app';

const port = Number(process.env.PORT || 3000);

const app = createServer();

app.listen(port, () => {
  console.log(`api-gateway running on port ${port}`);
});



