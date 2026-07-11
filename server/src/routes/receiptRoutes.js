import { Router } from 'express';
import { 
  getReceipts, 
  getReceiptById, 
  createReceipt, 
  updateReceipt, 
  deleteReceipt,
  getReceiptStats,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getTemplatePerformance,
  getDailyAnalytics,
  getTopCustomers,
  generateShareToken,
  updateReceiptStatus
} from '../controllers/receiptController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUuid, validateReceiptBody } from '../middleware/validate.js';

const router = Router();

// Secure all receipt routes
router.use(requireAuth);

router.get('/stats', getReceiptStats);
router.get('/analytics/weekly', getWeeklyAnalytics);
router.get('/analytics/monthly', getMonthlyAnalytics);
router.get('/analytics/daily', getDailyAnalytics);
router.get('/analytics/by-template', getTemplatePerformance);
router.get('/analytics/top-customers', getTopCustomers);
router.post('/:id/share', validateUuid('id'), generateShareToken);
router.put('/:id/status', validateUuid('id'), updateReceiptStatus);

router.get('/', getReceipts);
router.get('/:id', validateUuid('id'), getReceiptById);
router.post('/', validateReceiptBody, createReceipt);
router.put('/:id', validateUuid('id'), validateReceiptBody, updateReceipt);
router.delete('/:id', validateUuid('id'), deleteReceipt);

export default router;
