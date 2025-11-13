import { v4 as uuid } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  const headerId = req.headers['x-request-id'];
  req.requestId = headerId || uuid();
  res.setHeader('x-request-id', req.requestId);
  next();
}

export default requestIdMiddleware;
