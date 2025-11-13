import { Router } from 'express';
import {
  convertCurl,
  convertCurlToYamlController,
  convertJson,
  convertSpecToYamlController
} from '../controllers/conversionController.js';
import { apiKeyGuard, tokenGuard } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimit.js';


const router = Router();

router.post('/curl', apiKeyGuard, tokenGuard, strictLimiter, convertCurl);
router.post('/curl/yaml', apiKeyGuard, tokenGuard, strictLimiter, convertCurlToYamlController);
router.post('/json', apiKeyGuard, tokenGuard, strictLimiter, convertJson);
router.post('/spec/yaml', apiKeyGuard, tokenGuard, strictLimiter, convertSpecToYamlController);

export default router;
