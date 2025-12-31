import { Router } from 'express';
import { proxy } from '../lib/proxy';

const router = Router();

router.post(
  '/',
  proxy(process.env.ORDER_SERVICE_URL || 'http://localhost:3002')
);

router.get(
  '/',
  proxy(process.env.ORDER_SERVICE_URL || 'http://localhost:3002')
);

export default router;

