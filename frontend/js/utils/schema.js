// Utilidades para generación de schemas OpenAPI
import { CONSTANTS } from './constants.js';
import { ValidationUtils } from './validation.js';

export class SchemaUtils {
    
    /**
     * Genera un schema JSON para OpenAPI con campos requeridos inteligentes
     * @param {any} data - Datos para generar el schema
     * @param {string} title - Título opcional del schema
     * @returns {object} - Schema OpenAPI completo
     */
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

            Object.entries(data).forEach(([key, value]) => {
                properties[key] = this.generateSchema(value, key);
                
                // Determinar si el campo es requerido basado en criterios inteligentes
                if (ValidationUtils.shouldFieldBeRequired(key, value)) {
                    required.push(key);
                }
            });

            return {
                type: 'object',
                title: title || undefined,
                properties,
                required: required.length > 0 ? required : undefined,
                example: data
            };
        }

        // Tipos primitivos
        const schema = { type: typeof data };
        
        // Agregar formato para tipos específicos
        if (typeof data === 'string') {
            this.addStringFormat(schema, data);
        }

        // Agregar ejemplo
        schema.example = data;

        return schema;
    }

    /**
     * Agrega formato específico para strings (date, date-time, etc.)
     * @param {object} schema - Schema al que agregar formato
     * @param {string} value - Valor string para detectar formato
     */
    static addStringFormat(schema, value) {
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            schema.format = 'date';
        } else if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            schema.format = 'date-time';
        } else if (value.match(/^[\w\.-]+@[\w\.-]+\.\w+$/)) {
            schema.format = 'email';
        } else if (value.match(/^https?:\/\/.+/)) {
            schema.format = 'uri';
        } else if (value.match(/^\d+$/)) {
            schema.type = 'integer';
            delete schema.format;
        }
    }

    /**
     * Extrae esquemas de seguridad de headers
     * @param {Array} headers - Array de headers
     * @returns {object} - Objeto con securitySchemes, security y headers filtrados
     */
    static extractSecuritySchemesFromHeaders(headers) {
        const securitySchemes = {};
        const security = [];
        const filteredHeaders = [];

        headers.forEach(header => {
            if (header.name.toLowerCase() === 'authorization') {
                const authInfo = this.analyzeAuthorizationHeader(header.example || '');
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

    /**
     * Analiza header de Authorization para determinar tipo
     * @param {string} authValue - Valor del header Authorization
     * @returns {object} - Información del esquema de autenticación
     */
    static analyzeAuthorizationHeader(authValue) {
        const lowerValue = authValue.toLowerCase();
        
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
        } else if (lowerValue.startsWith('basic')) {
            return {
                name: 'basicAuth',
                scheme: {
                    type: 'http',
                    scheme: 'basic',
                    description: 'Basic HTTP authentication'
                }
            };
        } else if (lowerValue.startsWith('digest')) {
            return {
                name: 'digestAuth',
                scheme: {
                    type: 'http',
                    scheme: 'digest',
                    description: 'Digest HTTP authentication'
                }
            };
        } else {
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
    }

    /**
     * Determina si un header es de tipo API Key
     * @param {string} headerName - Nombre del header
     * @returns {boolean} - true si es API key
     */
    static isApiKeyHeader(headerName) {
        const lowerName = headerName.toLowerCase();
        return lowerName.includes('api-key') || 
               lowerName.includes('apikey') ||
               lowerName === 'x-api-key';
    }

    /**
     * Genera nombre para esquema de API Key
     * @param {string} headerName - Nombre del header
     * @returns {string} - Nombre del esquema
     */
    static generateApiKeyName(headerName) {
        const cleanName = headerName.toLowerCase()
            .replace(/[-_]/g, '')
            .replace('xapi', 'api');
        return cleanName + 'Auth';
    }

    /**
     * Genera objeto de respuestas por defecto basado en método HTTP
     * @param {string} method - Método HTTP
     * @returns {object} - Objeto responses OpenAPI
     */
    static generateDefaultResponses(method = 'GET') {
        const upperMethod = method.toUpperCase();
        
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
                                        },
                                        example: [
                                            { id: '123', name: 'Sample Item 1' },
                                            { id: '124', name: 'Sample Item 2' }
                                        ]
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
        
        // Para POST, PUT, PATCH, DELETE
        return {
            '200': {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: true
                                },
                                message: {
                                    type: 'string',
                                    example: 'Operation completed successfully'
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Procesa y normaliza especificación OpenAPI
     * @param {object} spec - Especificación OpenAPI cruda
     * @returns {object} - Especificación normalizada y ordenada
     */
    static processOpenAPISpec(spec) {
        // Asegurar versión OpenAPI
        if (!spec.openapi || !spec.openapi.startsWith('3.')) {
            spec.openapi = CONSTANTS.OPENAPI.VERSION;
        }

        // Asegurar información básica requerida
        if (!spec.info) {
            spec.info = {};
        }
        if (!spec.info.title) {
            spec.info.title = CONSTANTS.OPENAPI.DEFAULT_TITLE;
        }
        if (!spec.info.version) {
            spec.info.version = CONSTANTS.OPENAPI.DEFAULT_VERSION;
        }
        if (!spec.info.description) {
            spec.info.description = CONSTANTS.OPENAPI.DEFAULT_DESCRIPTION;
        }

        // Asegurar que paths existe
        if (!spec.paths) {
            spec.paths = {};
        }

        // Normalizar códigos de respuesta como strings
        this.normalizeResponseCodes(spec);

        // Limpiar components vacíos
        this.cleanEmptyComponents(spec);

        // Ordenar según mejores prácticas
        return this.orderSpecProperties(spec);
    }

    /**
     * Normaliza códigos de respuesta a strings
     * @param {object} spec - Especificación OpenAPI
     */
    static normalizeResponseCodes(spec) {
        Object.keys(spec.paths).forEach(path => {
            const pathItem = spec.paths[path];
            Object.keys(pathItem).forEach(method => {
                if (pathItem[method].responses) {
                    const responses = {};
                    Object.entries(pathItem[method].responses).forEach(([code, response]) => {
                        responses[String(code)] = response;
                    });
                    pathItem[method].responses = responses;
                }
            });
        });
    }

    /**
     * Limpia components vacíos
     * @param {object} spec - Especificación OpenAPI
     */
    static cleanEmptyComponents(spec) {
        if (spec.components) {
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
    }

    /**
     * Ordena propiedades según mejores prácticas OpenAPI
     * @param {object} spec - Especificación OpenAPI
     * @returns {object} - Especificación ordenada
     */
    static orderSpecProperties(spec) {
        const orderedSpec = {};
        
        // Ordenar propiedades de nivel superior según PROPERTY_ORDER
        CONSTANTS.OPENAPI.PROPERTY_ORDER.forEach(key => {
            if (spec[key]) {
                orderedSpec[key] = spec[key];
            }
        });
        
        // Agregar cualquier propiedad adicional que no esté en PROPERTY_ORDER
        Object.keys(spec).forEach(key => {
            if (!CONSTANTS.OPENAPI.PROPERTY_ORDER.includes(key)) {
                orderedSpec[key] = spec[key];
            }
        });
        
        return orderedSpec;
    }
}

export default SchemaUtils;