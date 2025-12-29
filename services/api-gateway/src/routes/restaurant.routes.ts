import { Router } from 'express';
import { proxy } from '../lib/proxy';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(proxy(process.env.RESTAURANT_SERVICE_URL!));

export default router;
