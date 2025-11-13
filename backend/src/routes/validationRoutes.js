import { Router } from 'express';
import {
  validateCurlController,
  validateJsonController,
  validateSpecController
} from '../controllers/validationController.js';
import { apiKeyGuard, tokenGuard } from '../middleware/auth.js';
import { defaultLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/curl', apiKeyGuard, tokenGuard, defaultLimiter, validateCurlController);
router.post('/json', apiKeyGuard, tokenGuard, defaultLimiter, validateJsonController);
router.post('/spec', apiKeyGuard, tokenGuard, defaultLimiter, validateSpecController);

export default router;
