import { Router } from 'express';
import { getHealth, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', getHealth);
router.get('/me', requireAuth, getMe);

export default router;
