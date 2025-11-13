import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import conversionRoutes from './conversionRoutes.js';
import validationRoutes from './validationRoutes.js';
import examplesRoutes from './examplesRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/convert', conversionRoutes);
router.use('/validate', validationRoutes);
router.use('/examples', examplesRoutes);

export default router;
