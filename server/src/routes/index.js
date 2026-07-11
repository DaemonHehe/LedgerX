import { Router } from 'express';
import authRoutes from './authRoutes.js';
import templateRoutes from './templateRoutes.js';
import receiptRoutes from './receiptRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import publicRoutes from './publicRoutes.js';
import customerRoutes from './customerRoutes.js';
import stripeRoutes from './stripeRoutes.js';

const router = Router();

// Mount sub-routers under their respective API prefixes
router.use('/', authRoutes); // /health, /me
router.use('/templates', templateRoutes); // /templates, /templates/:id
router.use('/receipts', receiptRoutes); // /receipts, /receipts/:id
router.use('/', mediaRoutes); // /upload, /receipts/analyze, /templates/analyze
router.use('/public', publicRoutes); // /public/receipts/:share_token
router.use('/customers', customerRoutes); // /customers
router.use('/stripe', stripeRoutes); // /stripe/checkout-session, /stripe/status

export default router;
