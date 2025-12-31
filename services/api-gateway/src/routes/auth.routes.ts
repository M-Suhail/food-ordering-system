import { Router } from 'express';
import { proxy } from '../lib/proxy';

const router = Router();

router.use(
  '/',
  proxy(
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
  )
);

export default router;


