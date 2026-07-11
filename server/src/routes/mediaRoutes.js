import { Router } from 'express';
import multer from 'multer';
import { uploadMedia, analyzeReceiptN8n, analyzeTemplateOpenAI } from '../controllers/mediaController.js';
import { requireAuth } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import { validateImageUpload } from '../middleware/validate.js';

const router = Router();

// Multer memory storage configuration with 5MB size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Secure all media routes
router.use(requireAuth);

// Apply strict rate limiting for computationally and financially expensive API routes
router.use(strictLimiter);

router.post('/upload', upload.single('file'), validateImageUpload, uploadMedia);
router.post('/receipts/analyze', upload.single('image'), validateImageUpload, analyzeReceiptN8n);
router.post('/templates/analyze', upload.single('image'), validateImageUpload, analyzeTemplateOpenAI);

export default router;
