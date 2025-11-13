import YAML from 'yaml';
import { curlToOpenAPI } from './curlConverter.js';
import { SchemaUtils } from './utils/schema.js';

/**
 * Expone la conversión completa CURL/Respuestas → YAML OpenAPI.
 * @param {string} curlText - Comando CURL de entrada.
 * @param {Array} responses - Definiciones de respuestas opcionales.
 * @returns {string} YAML generado.
 */
export function transform(curlText, responses = []) {
  const spec = curlToOpenAPI(curlText, responses);
  const normalized = SchemaUtils.processOpenAPISpec(spec);
  return YAML.stringify(normalized, { indent: 2, lineWidth: 120 });
}

export default transform;
