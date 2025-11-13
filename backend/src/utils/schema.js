import { CONSTANTS } from './constants.js';
import { ValidationUtils } from './validation.js';

export class SchemaUtils {
  static generateSchema(data, title = '') {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: this.generateSchema(data[0] || {}),
        example: data
      };
    }

    if (typeof data === 'object' && data !== null) {
      const properties = {};
      const required = [];

      for (const [key, value] of Object.entries(data)) {
        properties[key] = this.generateSchema(value, key);
        if (ValidationUtils.shouldFieldBeRequired(key, value)) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        title: title || undefined,
        properties,
        required: required.length > 0 ? required : undefined,
        example: data
      };
    }

    const schema = { type: typeof data };

    if (typeof data === 'string') {
      this.addStringFormat(schema, data);
    }

    schema.example = data;
    return schema;
  }

  static addStringFormat(schema, value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      schema.format = 'date';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      schema.format = 'date-time';
    } else if (/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(value)) {
      schema.format = 'email';
    } else if (/^https?:\/\/.+/.test(value)) {
      schema.format = 'uri';
    } else if (/^-?\d+$/.test(value)) {
      schema.type = 'integer';
      delete schema.format;
    }
  }

  static extractSecuritySchemesFromHeaders(headers) {
    const securitySchemes = {};
    const security = [];
    const filteredHeaders = [];

    headers.forEach((header) => {
      const headerName = header.name?.toLowerCase();
      if (headerName === 'authorization') {
        const authInfo = this.analyzeAuthorizationHeader(header.schema?.example || header.example || '');
        securitySchemes[authInfo.name] = authInfo.scheme;
        security.push({ [authInfo.name]: [] });
      } else if (this.isApiKeyHeader(header.name)) {
        const keyName = this.generateApiKeyName(header.name);
        securitySchemes[keyName] = {
          type: 'apiKey',
          in: 'header',
          name: header.name,
          description: `API Key authentication via ${header.name} header`
        };
        security.push({ [keyName]: [] });
      } else {
        filteredHeaders.push(header);
      }
    });

    return {
      securitySchemes: Object.keys(securitySchemes).length > 0 ? securitySchemes : undefined,
      security: security.length > 0 ? security : undefined,
      filteredHeaders
    };
  }

  static analyzeAuthorizationHeader(authValue) {
    const lowerValue = String(authValue).toLowerCase();

    if (lowerValue.startsWith('bearer')) {
      return {
        name: 'bearerAuth',
        scheme: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication'
        }
      };
    }

    if (lowerValue.startsWith('basic')) {
      return {
        name: 'basicAuth',
        scheme: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic HTTP authentication'
        }
      };
    }

    if (lowerValue.startsWith('digest')) {
      return {
        name: 'digestAuth',
        scheme: {
          type: 'http',
          scheme: 'digest',
          description: 'Digest HTTP authentication'
        }
      };
    }

    return {
      name: 'customAuth',
      scheme: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Custom authorization header'
      }
    };
  }

  static isApiKeyHeader(headerName) {
    const lowerName = String(headerName || '').toLowerCase();
    return lowerName.includes('api-key') || lowerName.includes('apikey') || lowerName === 'x-api-key';
  }

  static generateApiKeyName(headerName) {
    const cleanName = String(headerName)
      .toLowerCase()
      .replace(/[-_]/g, '')
      .replace('xapi', 'api');
    return `${cleanName}Auth`;
  }

  static generateDefaultResponses(method = 'GET') {
    const upperMethod = String(method).toUpperCase();

    if (upperMethod === 'GET') {
      return {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '123' },
                        name: { type: 'string', example: 'Sample Item' }
                      }
                    }
                  },
                  total: { type: 'integer', example: 100 },
                  page: { type: 'integer', example: 1 }
                }
              }
            }
          }
        }
      };
    }

    return {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Operation completed successfully' }
              }
            }
          }
        }
      }
    };
  }

  static processOpenAPISpec(spec) {
    const specCopy = JSON.parse(JSON.stringify(spec));

    if (!specCopy.openapi || !specCopy.openapi.startsWith('3.')) {
      specCopy.openapi = CONSTANTS.OPENAPI.VERSION;
    }

    specCopy.info = specCopy.info || {};
    specCopy.info.title = specCopy.info.title || CONSTANTS.OPENAPI.DEFAULT_TITLE;
    specCopy.info.version = specCopy.info.version || CONSTANTS.OPENAPI.DEFAULT_VERSION;
    specCopy.info.description = specCopy.info.description || CONSTANTS.OPENAPI.DEFAULT_DESCRIPTION;

    specCopy.paths = specCopy.paths || {};

    this.normalizeResponseCodes(specCopy);
    this.cleanEmptyComponents(specCopy);

    return this.orderSpecProperties(specCopy);
  }

  static normalizeResponseCodes(spec) {
    for (const pathKey of Object.keys(spec.paths)) {
      const pathItem = spec.paths[pathKey];
      for (const methodKey of Object.keys(pathItem)) {
        const methodObj = pathItem[methodKey];
        if (methodObj.responses) {
          const normalized = {};
          for (const [code, response] of Object.entries(methodObj.responses)) {
            normalized[String(code)] = response;
          }
          methodObj.responses = normalized;
        }
      }
    }
  }

  static cleanEmptyComponents(spec) {
    if (!spec.components) return;

    if (!spec.components.schemas || Object.keys(spec.components.schemas).length === 0) {
      delete spec.components.schemas;
    }

    if (!spec.components.securitySchemes || Object.keys(spec.components.securitySchemes).length === 0) {
      delete spec.components.securitySchemes;
    }

    if (Object.keys(spec.components).length === 0) {
      delete spec.components;
    }
  }

  static orderSpecProperties(spec) {
    const orderedSpec = {};

    CONSTANTS.OPENAPI.PROPERTY_ORDER.forEach((key) => {
      if (spec[key] !== undefined) {
        orderedSpec[key] = spec[key];
      }
    });

    for (const key of Object.keys(spec)) {
      if (!CONSTANTS.OPENAPI.PROPERTY_ORDER.includes(key)) {
        orderedSpec[key] = spec[key];
      }
    }

    return orderedSpec;
  }
}

export default SchemaUtils;
