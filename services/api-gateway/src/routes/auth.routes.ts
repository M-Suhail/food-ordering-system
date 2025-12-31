
import { Router } from 'express';
import { proxy } from '../lib/proxy';

const router = Router();

/**
 * @openapi
 * /auth:
 *   post:
 *     summary: Proxy to Auth Service
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  '/',
  proxy(process.env.ORDER_SERVICE_URL || 'http://localhost:3002')
);

/**
 * @openapi
 * /auth:
 *   get:
 *     summary: Proxy to Auth Service
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  proxy(process.env.ORDER_SERVICE_URL || 'http://localhost:3002')
);

export default router;

