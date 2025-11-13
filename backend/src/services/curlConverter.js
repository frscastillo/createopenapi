import { ValidationUtils } from '../utils/validation.js';
import { SchemaUtils } from '../utils/schema.js';
import { CONSTANTS } from '../utils/constants.js';

/**
 * Convierte un comando CURL en una especificación OpenAPI básica.
 * @param {string} curlCommand Comando CURL a convertir.
 * @param {Array<{code:string|number,description?:string,body?:object|string}>} responseOverrides Respuestas personalizadas.
 * @returns {object} Especificación OpenAPI generada.
 */
export function curlToOpenAPI(curlCommand, responseOverrides = []) {
  const validationResult = ValidationUtils.validateCurlCommand(curlCommand);
  if (!validationResult.isValid) {
    const error = new Error(validationResult.errors.join('\n'));
    error.code = 'CURL_VALIDATION_FAILED';
    error.statusCode = 400;
    throw error;
  }

  const parsed = parseCurlCommand(curlCommand);

  const queryParams = parsed.parameters.filter((p) => p.in === 'query');
  const headerParams = parsed.parameters.filter((p) => p.in === 'header');
  const pathParams = parsed.parameters.filter((p) => p.in === 'path');

  const securityInfo = SchemaUtils.extractSecuritySchemesFromHeaders(headerParams);
  const allParameters = [...queryParams, ...securityInfo.filteredHeaders, ...pathParams];

  const pathSegments = parsed.path.split('/').filter(Boolean);
  const intelligentTag = pathSegments.length > 0 ? capitalize(pathSegments[0]) : 'API';

  const spec = {
    openapi: CONSTANTS.OPENAPI.VERSION,
    info: {
      title: CONSTANTS.OPENAPI.DEFAULT_TITLE,
      version: CONSTANTS.OPENAPI.DEFAULT_VERSION,
      description: CONSTANTS.OPENAPI.DEFAULT_DESCRIPTION
    },
    servers: parsed.server ? [parsed.server] : [],
    paths: {
      [parsed.path]: {
        [parsed.method.toLowerCase()]: {
          summary: `${parsed.method} endpoint`,
          description: 'Generated from CURL command',
          tags: [intelligentTag],
          parameters: allParameters,
          requestBody: buildRequestBody(parsed),
          responses: generateResponsesObject(parsed.method, responseOverrides),
          security: securityInfo.security
        }
      }
    },
    components: {
      schemas: parsed.body
        ? {
            RequestBody: SchemaUtils.generateSchema(parsed.body)
          }
        : undefined,
      securitySchemes: securityInfo.securitySchemes
    }
  };

  return SchemaUtils.processOpenAPISpec(spec);
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generateResponsesObject(method = 'GET', overrides = []) {
  const responses = {};

  const buildResponseEntry = (statusCode, description, exampleBody) => {
    if (!ValidationUtils.isValidStatusCode(statusCode)) {
      return;
    }

    const safeCode = String(statusCode);
    const responseEntry = {
      description: description || `${safeCode} response`
    };

    if (exampleBody !== undefined && exampleBody !== null) {
      let body = exampleBody;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (error) {
          responseEntry.content = {
            [CONSTANTS.CONTENT_TYPES.JSON]: {
              schema: {
                type: 'string',
                example: body
              },
              example: body
            }
          };
          responses[safeCode] = responseEntry;
          return;
        }
      }

      const schema = SchemaUtils.generateSchema(body);
      responseEntry.content = {
        [CONSTANTS.CONTENT_TYPES.JSON]: {
          schema,
          example: body
        }
      };
    }

    responses[safeCode] = responseEntry;
  };

  if (Array.isArray(overrides) && overrides.length > 0) {
    overrides.forEach(({ code, description, body }) => buildResponseEntry(code, description, body));
  }

  if (Object.keys(responses).length === 0) {
    return SchemaUtils.generateDefaultResponses(method);
  }

  return responses;
}

function parseCurlCommand(curl) {
  const result = {
    method: 'GET',
    path: '/',
    server: null,
    parameters: [],
    headers: [],
    body: null,
    formData: null
  };

  let cleaned = String(curl)
    .replace(/\\\s*\n\s*/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned.replace(/^curl\s+/, '');

  const methodMatch = cleaned.match(/-X\s+([A-Z]+)/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  const url = extractUrl(cleaned);
  if (!url) {
    const error = new Error('URL no encontrada en el comando CURL.');
    error.code = 'URL_NOT_FOUND';
    error.statusCode = 400;
    throw error;
  }

  const { normalizedPath, server } = buildPathAndServer(url);
  result.path = normalizedPath;
  result.server = server;

  server.url = server.url.replace(/\/\/$/, '');

  const parsedUrl = new URL(url.replace(/\{([^}]+)\}/g, 'placeholder'));
  parsedUrl.searchParams.forEach((value, key) => {
    result.parameters.push({
      name: key,
      in: 'query',
      required: ValidationUtils.shouldQueryParamBeRequired(key),
      schema: {
        type: 'string',
        example: value
      },
      description: `${key} parameter`
    });
  });

  const placeholderMatches = [...url.matchAll(/\{([^}]+)\}/g)];
  placeholderMatches.forEach((match) => {
    result.parameters.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      },
      description: `${match[1]} path parameter`
    });
  });

  const headerRegex = /-H\s+["']([^"']+?)["']/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cleaned)) !== null) {
    const headerValue = headerMatch[1];
    const colonIndex = headerValue.indexOf(':');
    if (colonIndex === -1) continue;
    const key = headerValue.substring(0, colonIndex).trim();
    const value = headerValue.substring(colonIndex + 1).trim();

    result.parameters.push({
      name: key,
      in: 'header',
      required: ValidationUtils.shouldHeaderBeRequired(key),
      example: value,
      schema: {
        type: 'string',
        example: value
      },
      description: `${key} header parameter`
    });
  }

  const bodyRegex = /-d\s+['"]([\s\S]*?)['"](?:\s|$)/;
  const bodyMatch = cleaned.match(bodyRegex);
  if (bodyMatch) {
    try {
      let bodyContent = bodyMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '')
        .trim();
      result.body = JSON.parse(bodyContent);
      ensureContentTypeHeader(result.parameters, CONSTANTS.CONTENT_TYPES.JSON);
    } catch (error) {
      const err = new Error(`JSON inválido en request body: ${error.message}`);
      err.code = 'BODY_PARSING_FAILED';
      err.statusCode = 400;
      throw err;
    }
  }

  const formMatches = [...cleaned.matchAll(/-F\s+['"]([^'"]+)['"]/g)];
  if (formMatches.length > 0) {
    result.formData = formMatches.map((match) => {
      const [key, value] = match[1].split('=');
      const isFile = value?.trim().startsWith('@');
      return {
        name: key,
        value: isFile ? value.trim().slice(1) : value,
        isFile
      };
    });
    ensureContentTypeHeader(result.parameters, CONSTANTS.CONTENT_TYPES.MULTIPART);
  }

  return result;
}

function ensureContentTypeHeader(parameters, contentType) {
  const hasContentType = parameters.some(
    (param) => param.in === 'header' && param.name.toLowerCase() === 'content-type'
  );

  if (!hasContentType) {
    parameters.push({
      name: 'Content-Type',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        example: contentType
      },
      description: 'Content Type header'
    });
  }
}

function buildRequestBody(parsed) {
  if (parsed.body) {
    return {
      required: true,
      content: {
        [CONSTANTS.CONTENT_TYPES.JSON]: {
          schema: SchemaUtils.generateSchema(parsed.body),
          example: parsed.body
        }
      }
    };
  }

  if (parsed.formData && parsed.formData.length > 0) {
    const properties = {};
    const required = [];

    parsed.formData.forEach((field) => {
      properties[field.name] = field.isFile
        ? { type: 'string', format: 'binary', description: `${field.name} file upload` }
        : { type: 'string', example: field.value };
      required.push(field.name);
    });

    return {
      required: true,
      content: {
        [CONSTANTS.CONTENT_TYPES.MULTIPART]: {
          schema: {
            type: 'object',
            properties,
            required
          }
        }
      }
    };
  }

  return undefined;
}

function extractUrl(curl) {
  const urlFlagMatch = curl.match(/--url\s+['"]?(https?:\/\/[^\s"']+)['"]?/i);
  if (urlFlagMatch) {
    return urlFlagMatch[1];
  }

  const quotedMatch = curl.match(/['"](https?:\/\/[^"']+)['"]/i);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  const bareMatch = curl.match(/https?:\/\/[^\s"']+/i);
  if (bareMatch) {
    return bareMatch[0];
  }

  return null;
}

function buildPathAndServer(url) {
  const placeholderMatches = [...url.matchAll(/\{([^}]+)\}/g)];
  let sanitizedUrl = url;
  placeholderMatches.forEach((match, index) => {
    sanitizedUrl = sanitizedUrl.replace(match[0], `__param_${index}__`);
  });

  const parsedUrl = new URL(sanitizedUrl);

  let pathname = parsedUrl.pathname;
  placeholderMatches.forEach((match, index) => {
    pathname = pathname.replace(`__param_${index}__`, `{${match[1]}}`);
  });

  return {
    normalizedPath: pathname || '/',
    server: {
      url: `${parsedUrl.protocol}//${parsedUrl.host}`,
      description: 'Server extracted from CURL command'
    }
  };
}

export default curlToOpenAPI;
