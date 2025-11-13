import YAML from 'yaml';
import { curlToOpenAPI } from './curlConverter.js';
import { SchemaUtils } from '../utils/schema.js';

/**
 * Genera YAML OpenAPI a partir de un comando CURL.
 * @param {string} curlText Comando CURL.
 * @param {Array} responses Respuestas personalizadas opcionales.
 * @returns {string} Documento YAML.
 */
export function transformCurlToYaml(curlText, responses = []) {
  const spec = curlToOpenAPI(curlText, responses);
  const normalized = SchemaUtils.processOpenAPISpec(spec);
  return YAML.stringify(normalized, { indent: 2, lineWidth: 120 });
}

export default transformCurlToYaml;
