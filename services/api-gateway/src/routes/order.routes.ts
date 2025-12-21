import { Router } from 'express';
import { proxy } from '../lib/proxy';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(proxy(process.env.ORDER_SERVICE_URL!));

export default router;
