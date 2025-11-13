import { logger } from '../lib/logger.js';

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = durationNs / 1e6;
    const logPayload = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(3)),
      clientIp: req.ip,
      sessionId: req.sessionID || req.session?.id,
      clientId: req.clientId,
      authSubject: req.auth?.sub,
      authSessionId: req.auth?.sessionId,
      scopes: Array.isArray(req.auth?.scopes) ? req.auth.scopes : undefined,
      requestBody: req.body,
      responseSummary: res.locals && res.locals.responseSummary ? res.locals.responseSummary : undefined
    };
    logger.info('request_completed', logPayload);
  });
  next();
}

export default requestLogger;
