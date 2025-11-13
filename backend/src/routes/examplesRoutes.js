import { Router } from 'express';
import { getDefaultExamples } from '../controllers/examplesController.js';
import { apiKeyGuard, tokenGuard } from '../middleware/auth.js';

const router = Router();

router.get('/defaults', apiKeyGuard, tokenGuard, getDefaultExamples);

export default router;
