import YAML from 'yaml';
/**
 * POST /api/convert/spec/yaml
 * Recibe una especificación OpenAPI en JSON y devuelve el YAML generado
 */
export function convertSpecToYamlController(req, res, next) {
  try {
    const { spec } = req.body;
    if (!spec) {
      const error = new Error('El cuerpo debe incluir la propiedad "spec".');
      error.code = 'SPEC_REQUIRED';
      error.statusCode = 400;
      throw error;
    }
    // Normalizar si es necesario
    // const normalized = SchemaUtils.processOpenAPISpec(spec);
    const yaml = YAML.stringify(spec, { indent: 2, lineWidth: 120 });
    return res.status(200).type('application/yaml').send(yaml);
  } catch (error) {
    return next(error);
  }
}
import { curlToOpenAPI } from '../services/curlConverter.js';
import { transformCurlToYaml } from '../services/transform.js';
import { jsonToOpenAPI } from '../services/jsonConverter.js';
import { SchemaUtils } from '../utils/schema.js';

/**
 * POST /api/convert/curl
 */
export function convertCurl(req, res, next) {
  try {
    const { curl, responses = [] } = req.body;
    if (!curl) {
      const error = new Error('El cuerpo debe incluir la propiedad "curl".');
      error.code = 'CURL_REQUIRED';
      error.statusCode = 400;
      throw error;
    }

    const spec = curlToOpenAPI(curl, responses);
    const normalized = SchemaUtils.processOpenAPISpec(spec);
    return res.status(200).json({
      success: true,
      data: {
        spec: normalized,
        sizeBytes: Buffer.byteLength(JSON.stringify(normalized)),
        contentType: 'application/json'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/convert/curl/yaml
 */
export function convertCurlToYamlController(req, res, next) {
  try {
    const { curl, responses = [] } = req.body;
    if (!curl) {
      const error = new Error('El cuerpo debe incluir la propiedad "curl".');
      error.code = 'CURL_REQUIRED';
      error.statusCode = 400;
      throw error;
    }

    const yaml = transformCurlToYaml(curl, responses);
    return res.status(200).type('application/yaml').send(yaml);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/convert/json
 */
export function convertJson(req, res, next) {
  try {
    const { json } = req.body;
    if (!json) {
      const error = new Error('El cuerpo debe incluir la propiedad "json".');
      error.code = 'JSON_REQUIRED';
      error.statusCode = 400;
      throw error;
    }

    const spec = jsonToOpenAPI(json);
    const normalized = SchemaUtils.processOpenAPISpec(spec);
    return res.status(200).json({
      success: true,
      data: {
        spec: normalized,
        sizeBytes: Buffer.byteLength(JSON.stringify(normalized)),
        contentType: 'application/json'
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
}

export default { convertCurl, convertCurlToYamlController, convertJson, convertSpecToYamlController };
