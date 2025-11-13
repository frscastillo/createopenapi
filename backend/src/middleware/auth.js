import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function apiKeyGuard(req, res, next) {
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || !env.apiKeys.includes(providedKey)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'API_KEY_INVALID',
        message: 'API key inválida o ausente.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  req.clientId = providedKey;
  next();
}

export function tokenGuard(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_MISSING',
        message: 'Token de autenticación faltante.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Token inválido o expirado.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export function httpsGuard(req, res, next) {
  if (
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    env.nodeEnv === 'development' ||
    env.nodeEnv === 'test'
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'HTTPS_REQUIRED',
      message: 'Se requiere HTTPS para acceder a este recurso.'
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

export default { apiKeyGuard, tokenGuard, httpsGuard };
