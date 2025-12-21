import { Router } from 'express';
import { health } from './controllers/healthController';
import { subscribeOrderCreated } from './events/subscribeOrderCreated';

import { getChannel } from './lib/rabbitmq';
import { publishEvent } from '@food/event-bus';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for order service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
router.get('/health', health);

// management route to start subscriber during dev
/**
 * @openapi
 * /start-subscriber:
 *   post:
 *     summary: Start the order event subscriber (dev only)
 *     responses:
 *       200:
 *         description: Subscriber started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       500:
 *         description: Internal server error
 */
router.post('/start-subscriber', async (_req, res) => {
  try {
    await subscribeOrderCreated();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
