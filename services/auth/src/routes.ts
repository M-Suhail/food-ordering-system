import { Router } from 'express';
import { health } from './controllers/healthController';
import { publishOrderCreated } from './events/publishOrderCreated';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for auth service
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
 * /orders:
 *   post:
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     qty:
 *                       type: number
 *               total:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/orders', async (req, res) => {
  try {
    const {
      orderId = `order-${Date.now()}`,
      restaurantId,
      items = [],
      total = 0
    } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        ok: false,
        error: 'restaurantId is required'
      });
    }

    const order = {
      orderId,
      restaurantId,
      items: items.map((item: any) => ({
        id: item.id,
        qty: item.qty
      })),
      total
    };

    await publishOrderCreated(order);

    res.status(201).json({
      ok: true,
      order
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err)
    });
  }
});

export default router;

