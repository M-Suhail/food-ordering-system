import { Router } from 'express';
import { health } from './controllers/healthController';
import { publishOrderCreated } from './events/publishOrderCreated';

const router = Router();

router.get('/health', health);

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

