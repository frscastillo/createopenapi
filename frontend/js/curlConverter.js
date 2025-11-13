// Importaciones de utils centralizados
import { ValidationUtils } from './utils/validation.js';
import { SchemaUtils } from './utils/schema.js';
import { CONSTANTS } from './utils/constants.js';

// Función principal para convertir comandos CURL a formato OpenAPI
export function curlToOpenAPI(curlCommand, responseOverrides = []) {
    try {
        const validationResult = ValidationUtils.validateCurlCommand(curlCommand);
        if (!validationResult.isValid) {
            throw new Error(validationResult.errors.join('\n'));
        }

        const parsed = parseCurlCommand(curlCommand);
        
        // Separar parámetros por tipo
        const queryParams = parsed.parameters.filter(p => p.in === 'query');
        const headerParams = parsed.parameters.filter(p => p.in === 'header');
        const pathParams = parsed.parameters.filter(p => p.in === 'path');
        
        // Detectar esquemas de seguridad usando solo headers
        const securityInfo = SchemaUtils.extractSecuritySchemesFromHeaders(headerParams);
        
        // Combinar query params con headers filtrados (sin autorización)
        const allParameters = [...queryParams, ...securityInfo.filteredHeaders, ...pathParams];
        
        // Generar tag inteligente basado en el path
        const pathSegments = parsed.path.split('/').filter(segment => segment);
        const intelligentTag = pathSegments.length > 0 
            ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1) 
            : 'API';
        
        // Crear especificación OpenAPI 
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
                        parameters: allParameters, // Query params + headers filtrados
                        requestBody: buildRequestBody(parsed),
                        responses: generateResponsesObject(parsed.method, responseOverrides),
                        security: securityInfo.security // Aplicar seguridad al endpoint
                    }
                }
            },
            components: {
                schemas: parsed.body ? {
                    RequestBody: SchemaUtils.generateSchema(parsed.body)
                } : undefined,
                securitySchemes: securityInfo.securitySchemes // Esquemas de seguridad
            }
        };

        // Usar utils para procesar y limpiar el spec
        return SchemaUtils.processOpenAPISpec(spec);
    } catch (error) {
        throw new Error(error.message);
    }
}

// Función para extraer esquemas de seguridad de los parámetros (DEPRECATED - usar SchemaUtils)
function extractSecuritySchemes(parameters) {
    console.warn('extractSecuritySchemes deprecated, usar SchemaUtils.extractSecuritySchemesFromHeaders');
    
    // Filtrar solo headers
    const headers = parameters.filter(p => p.in === 'header');
    return SchemaUtils.extractSecuritySchemesFromHeaders(headers);
}

function generateResponsesObject(method = 'GET', overrides = []) {
    const responses = {};

    const buildResponseEntry = (statusCode, description, exampleBody) => {
        if (!ValidationUtils.isValidStatusCode(statusCode)) return;

        const safeCode = String(statusCode);
        const responseEntry = { description: description || `${safeCode} response` };

        if (exampleBody !== undefined && exampleBody !== null) {
            let body = exampleBody;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) { /* keep raw string */ }
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

    // Strictly use provided overrides. No DOM access inside this module.
    if (Array.isArray(overrides) && overrides.length > 0) {
        overrides.forEach(({ code, description, body }) => buildResponseEntry(code, description, body));
    }

    if (Object.keys(responses).length === 0) {
        return SchemaUtils.generateDefaultResponses(method);
    }

    return responses;
}

// Función para generar el schema JSON con campos requeridos inteligentes (DEPRECATED - usar SchemaUtils)
function generateJsonSchema(data, title = '') {
    console.warn('generateJsonSchema deprecated, usar SchemaUtils.generateSchema');
    return SchemaUtils.generateSchema(data, title);
}

// Función para determinar si un header debe ser requerido (DEPRECATED - usar ValidationUtils)
function shouldHeaderBeRequired(headerName) {
    console.warn('shouldHeaderBeRequired deprecated, usar ValidationUtils.shouldHeaderBeRequired');
    return ValidationUtils.shouldHeaderBeRequired(headerName);
}

// Función para determinar si un query parameter debe ser requerido (DEPRECATED - usar ValidationUtils)
function shouldQueryParamBeRequired(paramName) {
    console.warn('shouldQueryParamBeRequired deprecated, usar ValidationUtils.shouldQueryParamBeRequired');
    return ValidationUtils.shouldQueryParamBeRequired(paramName);
}

function shouldFieldBeRequired(fieldName, value) {
    console.warn('shouldFieldBeRequired deprecated, usar ValidationUtils.shouldFieldBeRequired');
    return ValidationUtils.shouldFieldBeRequired(fieldName, value);
}

// Función auxiliar para generar el schema del body
function generateSchemaProperties(body) {
    const properties = {};
    
    Object.entries(body).forEach(([key, value]) => {
        properties[key] = {
            type: typeof value,
            description: `${key} parameter`,
            example: value
        };
    });
    
    return properties;
}

function validateCurlCommand(curl) {
    console.warn('validateCurlCommand deprecated, usar ValidationUtils.validateCurlCommand');
    return ValidationUtils.validateCurlCommand(curl);
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

    // Limpiar el comando - Mejorado para manejar multi-línea
    curl = curl.replace(/\\\s*\n\s*/g, ' ')  // Reemplazar \ + newline + espacios con espacio
             .replace(/\n/g, ' ')            // Reemplazar newlines restantes
             .replace(/\s+/g, ' ')           // Normalizar espacios múltiples
             .replace(/^\s*curl\s+/, '')     // Remover 'curl' inicial
             .trim();

    // Extraer método
    const methodMatch = curl.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) {
        result.method = methodMatch[1].toUpperCase();
    }

    // Extraer URL
    const urlMatch = curl.match(/["']([^"']+)["']/);
    if (urlMatch) {
        try {
            const rawUrl = urlMatch[1];
            const placeholderMatches = [...rawUrl.matchAll(/\{([^}]+)\}/g)];

            let sanitizedUrl = rawUrl;
            placeholderMatches.forEach((match, index) => {
                sanitizedUrl = sanitizedUrl.replace(match[0], `__param_${index}__`);
            });

            const url = new URL(sanitizedUrl);

            let pathname = url.pathname;
            placeholderMatches.forEach((match, index) => {
                pathname = pathname.replace(`__param_${index}__`, `{${match[1]}}`);
            });

            result.path = pathname;
            
            // Extraer información del servidor
            result.server = {
                url: `${url.protocol}//${url.host}`,
                description: `Server extracted from CURL command`
            };
            
            // Query params
            url.searchParams.forEach((value, key) => {
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

            // Path params detectados mediante placeholders {param}
            placeholderMatches.forEach(match => {
                const paramName = match[1];
                result.parameters.push({
                    name: paramName,
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: `${paramName} path parameter`
                });
            });
        } catch (e) {
            throw new Error('URL inválida en el comando CURL');
        }
    } else {
        throw new Error('URL not found in CURL command');
    }

    // Extraer headers con mejor manejo - Mejorado para headers multi-línea
    const headerRegex = /-H\s+["']([^"']+?)["']/g;
    let headerMatch;
    
    while ((headerMatch = headerRegex.exec(curl)) !== null) {
        const headerValue = headerMatch[1];
        const colonIndex = headerValue.indexOf(':');
        
        if (colonIndex !== -1) {
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
    }

    // Mejorar extracción del body - MEJORADO para JSON multi-línea
    const bodyRegex = /-d\s+['"]([\s\S]*?)['"](?:\s|$)/;
    const bodyMatch = curl.match(bodyRegex);
    if (bodyMatch) {
        try {
            let bodyContent = bodyMatch[1];

            bodyContent = bodyContent
                .replace(/\\"/g, '"')
                .replace(/\\\n/g, '')
                .replace(/\n\s*/g, ' ')
                .trim();

            result.body = JSON.parse(bodyContent);

            ensureContentTypeHeader(result.parameters, CONSTANTS.CONTENT_TYPES.JSON);
        } catch (e) {
            console.error('Error parsing JSON body:', e);
            console.error('Body content:', bodyMatch[1]);
            throw new Error('Invalid JSON in request body: ' + e.message);
        }
    }

    // Manejar multipart/form-data con -F
    const formMatches = [...curl.matchAll(/-F\s+['"]([^'"]+)['"]/g)];
    if (formMatches.length > 0) {
        result.formData = formMatches.map(match => {
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
        param => param.in === 'header' && param.name.toLowerCase() === 'content-type'
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

        parsed.formData.forEach(field => {
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