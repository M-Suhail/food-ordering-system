import { Router } from 'express';
import { health } from './controllers/healthController';
import { publishOrderCreated } from './events/publishOrderCreated';

const router = Router();

router.get('/health', health);
router.post('/orders', async (req, res) => {
  // create order and publish order.created event with uniform schema
  const order = {
    orderId: req.body.orderId || 'order-' + Date.now(),
    items: req.body.items || [],
    total: req.body.total || 0
  };
  try {
    await publishOrderCreated(order);
    res.status(201).json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
