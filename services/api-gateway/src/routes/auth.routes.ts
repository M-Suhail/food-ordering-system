import { Router } from 'express';
import { proxy } from '../lib/proxy';

const router = Router();

/**
 * Forward /auth/* to Auth service
 */
router.use(proxy('http://localhost:3001'));

export default router;

