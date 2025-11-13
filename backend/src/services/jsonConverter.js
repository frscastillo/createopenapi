import { SchemaUtils } from '../utils/schema.js';

/**
 * Convierte un JSON de ejemplo en una especificación OpenAPI mínima.
 * @param {string|object} jsonInput Cadena JSON o objeto.
 * @returns {object} Especificación OpenAPI.
 */
export function jsonToOpenAPI(jsonInput) {
  let parsed;

  if (typeof jsonInput === 'string') {
    try {
      parsed = JSON.parse(jsonInput);
    } catch (error) {
      const err = new Error('JSON inválido.');
      err.code = 'JSON_PARSE_ERROR';
      err.statusCode = 400;
      throw err;
    }
  } else if (typeof jsonInput === 'object' && jsonInput !== null) {
    parsed = jsonInput;
  } else {
    const err = new Error('Entrada JSON no soportada.');
    err.code = 'JSON_INPUT_INVALID';
    err.statusCode = 400;
    throw err;
  }

  const schema = SchemaUtils.generateSchema(parsed);

  return {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Generated from JSON'
    },
    paths: {
      '/example': {
        get: {
          summary: 'Example endpoint',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Example: schema
      }
    }
  };
}

/**
 * Valida si una cadena es JSON válido.
 * @param {string} jsonString Cadena JSON a validar.
 * @returns {boolean}
 */
export function validateJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

export default jsonToOpenAPI;
