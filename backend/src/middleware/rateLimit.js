import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMs = 5 * 60 * 1000;
const maxRequests = 100;

export const defaultLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Inténtalo más tarde.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  },
  keyGenerator: (req) => {
    const clientId = req.clientId || req.ip;
    return `${clientId}-${req.ip}`;
  }
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.nodeEnv === 'development' ? 60 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Has superado el límite de solicitudes permitido.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  },
  keyGenerator: (req) => {
    const clientId = req.clientId || req.ip;
    return `${clientId}-${req.ip}`;
  }
});

export default { defaultLimiter, strictLimiter };
