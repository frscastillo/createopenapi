import { secureCurlValidation } from '../services/securityService.js';
import { validateJsonString, validateOpenApi } from '../services/validationService.js';

/**
 * POST /api/validate/curl
 */
export function validateCurlController(req, res) {
  const { curl } = req.body;
  const result = secureCurlValidation(curl || '');

  return res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * POST /api/validate/json
 */
export function validateJsonController(req, res) {
  const { json } = req.body;
  const result = validateJsonString(json || '');
  return res.status(200).json({
    success: result.isValid,
    data: result.isValid ? { parsed: result.parsed } : null,
    error: result.isValid
      ? undefined
      : {
          code: 'JSON_INVALID',
          message: result.error
        },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * POST /api/validate/spec
 */
export async function validateSpecController(req, res) {
  const { spec } = req.body;
  if (!spec) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SPEC_REQUIRED',
        message: 'La propiedad "spec" es obligatoria.'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await validateOpenApi(spec);

  if (!result.isValid) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'SPEC_INVALID',
        message: 'La especificación OpenAPI no es válida.',
        details: result.errors
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: { message: 'Especificación válida.' },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

export default {
  validateCurlController,
  validateJsonController,
  validateSpecController
};
