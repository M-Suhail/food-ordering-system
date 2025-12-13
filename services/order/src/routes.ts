import { Router } from 'express';
import { health } from './controllers/healthController';
import { subscribeOrderCreated } from './events/subscribeOrderCreated';

const router = Router();

router.get('/health', health);

// management route to start subscriber during dev
router.post('/start-subscriber', async (_req, res) => {
  try {
    await subscribeOrderCreated();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
