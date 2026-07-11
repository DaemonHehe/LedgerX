import express from 'express';
import { getPublicReceipt } from '../controllers/publicController.js';

const router = express.Router();

router.get('/receipts/:share_token', getPublicReceipt);

export default router;
