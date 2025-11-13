import { issueToken } from '../services/tokenService.js';

/**
 * POST /api/auth/token
 * Emite un JWT para clientes con API key válida.
 */
export function createToken(req, res) {
  const session = req.session;
  if (!session) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_NOT_AVAILABLE',
        message: 'No se pudo inicializar la sesión.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  const clientId = req.clientId;
  session.clientId = clientId;
  session.issuedAt = new Date().toISOString();

  const { token, expiresAt } = issueToken(clientId, session.id);

  return res.status(200).json({
    success: true,
    data: {
      token,
      expiresAt
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

export default { createToken };
