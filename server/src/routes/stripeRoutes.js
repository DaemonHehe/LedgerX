import { Router } from 'express';
import { createCheckoutSession, getSubscriptionStatus, verifySession } from '../controllers/stripeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Secure checkout and status routes
router.use(requireAuth);

router.post('/checkout-session', createCheckoutSession);
router.get('/status', getSubscriptionStatus);
router.post('/verify-session', verifySession);

export default router;
