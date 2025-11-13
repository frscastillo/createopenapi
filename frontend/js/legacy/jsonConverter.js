// Legacy JSON -> OpenAPI converter (moved to legacy and fixed parsing bug)
// NOTE: This module was moved to /js/legacy because it appears unused in the
// main application. It was repaired to avoid the redeclaration bug.

// Funciones para convertir y validar JSON
export function validateJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (error) {
        return false;
    }
}

// Convertir JSON a formato OpenAPI
export function jsonToOpenAPI(jsonData) {
    try {
        // parse into a new variable to avoid redeclaration and shadowing
        const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        // Crear especificación OpenAPI base
        const openAPISpec = {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'Generated from JSON'
            },
            paths: {},
            components: {
                schemas: {}
            }
        };

        // Generar esquema a partir del JSON
        const schema = generateJsonSchema(parsed);
        
        // Agregar endpoint de ejemplo
        openAPISpec.paths['/example'] = {
            get: {
                summary: 'Example endpoint',
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: schema
                            }
                        }
                    }
                }
            }
        };

        return openAPISpec;
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

function generateJsonSchema(data) {
    if (Array.isArray(data)) {
        return {
            type: 'array',
            items: generateJsonSchema(data[0] || {})
        };
    }

    if (typeof data === 'object' && data !== null) {
        const properties = {};
        Object.keys(data).forEach(key => {
            properties[key] = generateJsonSchema(data[key]);
        });
        return {
            type: 'object',
            properties: properties
        };
    }

    // primitive types
    const type = typeof data;
    // map JS typeof to OpenAPI primitive types if needed
    return {
        type: type === 'number' ? (Number.isInteger(data) ? 'integer' : 'number') : type
    };
}

export default { validateJSON, jsonToOpenAPI };
