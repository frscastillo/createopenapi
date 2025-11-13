import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Emite un JWT para el cliente.
 * @param {string} clientId Identificador basado en API key.
 * @param {string} sessionId Identificador de sesión.
 * @returns {{token:string, expiresAt:string}}
 */
export function issueToken(clientId, sessionId) {
  const expiresInMinutes = env.tokenTTLMinutes;
  const expiresInSeconds = expiresInMinutes * 60;

  const payload = {
    sub: clientId,
    sessionId,
    scopes: ['convert:curl', 'convert:json', 'validate:*']
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: expiresInSeconds,
    issuer: 'createopenapi-backend'
  });

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return { token, expiresAt };
}

export default { issueToken };
