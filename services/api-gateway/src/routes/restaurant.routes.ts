import { Router } from 'express';
import { proxy } from '../lib/proxy';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(proxy(process.env.RESTAURANT_SERVICE_URL!));

export default router;
