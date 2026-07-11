import { Router } from 'express';
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, seedWelcomeTemplate } from '../controllers/templateController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUuid, validateTemplateBody } from '../middleware/validate.js';

const router = Router();

// Secure all template routes
router.use(requireAuth);

router.post('/seed-welcome', seedWelcomeTemplate);
router.get('/', getTemplates);
router.get('/:id', validateUuid('id'), getTemplateById);
router.post('/', validateTemplateBody, createTemplate);
router.put('/:id', validateUuid('id'), validateTemplateBody, updateTemplate);
router.delete('/:id', validateUuid('id'), deleteTemplate);

export default router;
