import { Router } from 'express';
import { health } from './controllers/healthController';
import { cancelOrder } from './controllers/cancelOrder';
import { subscribeOrderCreated } from './events/subscribeOrderCreated';

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

/**
 * @openapi
 * /orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order (triggers compensation workflow)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: idempotency-key
 *         description: Unique key for idempotency (UUID recommended)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: ['customer_requested']
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Cancellation initiated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
router.post('/orders/:orderId/cancel', cancelOrder);

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
