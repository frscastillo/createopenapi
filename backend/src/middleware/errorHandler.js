import { logger } from '../lib/logger.js';

/**
 * Express error-handling middleware that normaliza las respuestas de error.
 */
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || 'UNEXPECTED_ERROR';
  const message = err.expose === true ? err.message : 'Ha ocurrido un error inesperado.';
  const details = err.details || undefined;

  logger.error('request_failed', {
    requestId: req.requestId,
    statusCode: status,
    code,
    message: err.message,
    stack: err.stack
  });

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });

  next();
}

export default errorHandler;
