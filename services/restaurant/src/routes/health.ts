import { Router } from 'express';

const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/ready', (_req, res) => res.json({ status: 'ready' }));

export default router;
