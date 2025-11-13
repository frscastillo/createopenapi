import { Router } from 'express';
import { createToken } from '../controllers/authController.js';
import { apiKeyGuard } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/token', apiKeyGuard, strictLimiter, createToken);

export default router;
