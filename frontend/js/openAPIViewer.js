// Variable para mantener la instancia del visualizador
let ui;
let currentSpec = null;
// (Obsolete imports removed)

function shareSpecWithWindow(spec, resetVersion = false) {
    if (typeof window === 'undefined') {
        return;
    }

    if (resetVersion || typeof window.__CURRENT_OPENAPI_SPEC_VERSION !== 'number') {
        window.__CURRENT_OPENAPI_SPEC_VERSION = 1;
    } else {
        window.__CURRENT_OPENAPI_SPEC_VERSION += 1;
    }

    window.__CURRENT_OPENAPI_SPEC = spec;
}

// Especificación por defecto que se muestra al inicio
const defaultSpec = {
    openapi: '3.0.0',
    info: {
        title: 'E-commerce API Documentation',
        version: '1.0.0',
        description: 'API para gestión de productos de comercio electrónico.',
        contact: {
            name: 'API Support',
            email: 'support@ecommerce.com'
        }
    },
    servers: [
        {
            url: 'https://api.ecommerce.com/v1',
            description: 'Production server'
        }
    ],
    paths: {
        '/products': {
            get: {
                summary: 'Get Products',
                description: 'Retrieve a list of products with filtering and pagination.',
                tags: ['Products'],
                parameters: [
                    {
                        name: 'category',
                        in: 'query',
                        required: false,
                        schema: {
                            type: 'string',
                            example: 'electronics'
                        },
                        description: 'Filter by product category'
                    },
                    {
                        name: 'brand',
                        in: 'query',
                        required: false,
                        schema: {
                            type: 'string',
                            example: 'apple'
                        },
                        description: 'Filter by brand'
                    },
                    {
                        name: 'page',
                        in: 'query',
                        required: false,
                        schema: {
                            type: 'integer',
                            example: 1
                        },
                        description: 'Page number for pagination'
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        required: false,
                        schema: {
                            type: 'integer',
                            example: 20
                        },
                        description: 'Number of items per page'
                    }
                ],
                responses: {
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
                                                    id: {
                                                        type: 'string',
                                                        example: 'prod_123'
                                                    },
                                                    name: {
                                                        type: 'string',
                                                        example: 'iPhone 15 Pro'
                                                    },
                                                    brand: {
                                                        type: 'string',
                                                        example: 'Apple'
                                                    },
                                                    category: {
                                                        type: 'string',
                                                        example: 'electronics'
                                                    },
                                                    price: {
                                                        type: 'number',
                                                        example: 999.99
                                                    },
                                                    currency: {
                                                        type: 'string',
                                                        example: 'USD'
                                                    },
                                                    inStock: {
                                                        type: 'boolean',
                                                        example: true
                                                    },
                                                    description: {
                                                        type: 'string',
                                                        example: 'Latest iPhone model with advanced features'
                                                    },
                                                    images: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'string'
                                                        },
                                                        example: ['https://example.com/iphone1.jpg']
                                                    },
                                                    ratings: {
                                                        type: 'object',
                                                        properties: {
                                                            average: {
                                                                type: 'number',
                                                                example: 4.8
                                                            },
                                                            count: {
                                                                type: 'integer',
                                                                example: 1247
                                                            }
                                                        }
                                                    },
                                                    createdAt: {
                                                        type: 'string',
                                                        format: 'date-time',
                                                        example: '2023-09-12T10:30:00Z'
                                                    }
                                                }
                                            }
                                        },
                                        pagination: {
                                            type: 'object',
                                            properties: {
                                                page: {
                                                    type: 'integer',
                                                    example: 2
                                                },
                                                limit: {
                                                    type: 'integer',
                                                    example: 20
                                                },
                                                total: {
                                                    type: 'integer',
                                                    example: 150
                                                },
                                                totalPages: {
                                                    type: 'integer',
                                                    example: 8
                                                }
                                            }
                                        },
                                        filters: {
                                            type: 'object',
                                            properties: {
                                                category: {
                                                    type: 'string',
                                                    example: 'electronics'
                                                },
                                                brand: {
                                                    type: 'string',
                                                    example: 'apple'
                                                },
                                                priceRange: {
                                                    type: 'string',
                                                    example: '500-2000'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Bad Request - Invalid query parameters',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: {
                                            type: 'string',
                                            example: 'invalid_parameters'
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Invalid query parameters provided'
                                        },
                                        details: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    parameter: {
                                                        type: 'string',
                                                        example: 'min_price'
                                                    },
                                                    message: {
                                                        type: 'string',
                                                        example: 'Must be a positive number'
                                                    },
                                                    code: {
                                                        type: 'string',
                                                        example: 'INVALID_FORMAT'
                                                    }
                                                }
                                            }
                                        },
                                        timestamp: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2025-10-30T12:00:00Z'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                security: [
                    {
                        bearerAuth: []
                    },
                    {
                        apiKey: []
                    }
                ]
            }
        }
    },
    components: {
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'invalid_parameters'
                    },
                    message: {
                        type: 'string',
                        example: 'Error message'
                    }
                }
            }
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key'
            }
        }
    }
};

export function initOpenAPIViewer() {
    if (typeof SwaggerUIBundle === 'undefined') {
        console.error('UI components are not loaded');
        return null;
    }

    try {
        const container = document.getElementById('swagger-ui');
        if (!container) {
            console.error('UI element not found');
            return null;
        }

        ui = SwaggerUIBundle({
            dom_id: '#swagger-ui',  // Cambiar esto de '#openapi-ui' a '#swagger-ui'
            layout: 'BaseLayout',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            defaultModelsExpandDepth: -1,
            displayRequestDuration: true,
            spec: defaultSpec, // Usar el spec por defecto
            docExpansion: 'list',
            filter: false,  // Cambiado de true a false
            tryItOutEnabled: true
        });

        // Inicializar el spec actual
        currentSpec = defaultSpec;
    shareSpecWithWindow(currentSpec, true);

        console.log('OpenAPI UI initialized successfully');
        return ui;
    } catch (error) {
        console.error('Error initializing UI:', error);
        return null;
    }
}

export function updateOpenAPISpec(spec) {
    try {
        if (!ui) {
            console.error('OpenAPI UI has not been initialized');
            return false;
        }

        if (!spec || typeof spec !== 'object') {
            console.error('Invalid spec:', spec);
            return false;
        }

        // No sobrescribir todo el spec, solo actualizar las partes necesarias
        const completeSpec = {
            openapi: '3.0.0',
            info: {
                ...defaultSpec.info,
                ...spec.info
            },
            paths: {
                ...spec.paths
            },
            components: {
                ...defaultSpec.components,
                ...spec.components
            },
            servers: spec.servers && spec.servers.length > 0 ? spec.servers : defaultSpec.servers
        };

        // Validar que las respuestas estén presentes
        if (completeSpec.paths) {
            Object.values(completeSpec.paths).forEach(path => {
                Object.values(path).forEach(method => {
                    if (!method.responses) {
                        console.warn('Método sin respuestas definidas');
                    }
                });
            });
        }

        ui.specActions.updateSpec(JSON.stringify(completeSpec));
        
        // Guardar el spec actual para el editor
        currentSpec = completeSpec;
    shareSpecWithWindow(currentSpec);
        
        return true;
    } catch (error) {
        console.error('Error updating specification:', error);
        return false;
    }
}

export function getUI() {
    return ui;
}

export function getCurrentSpec() {
    return currentSpec;
}

export function getDefaultSpec() {
    return {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Ingrese un comando CURL para comenzar'
        },
        paths: {}
    };
}

// Exponer helpers globales para integración con el UI y módulos que usan window.
if (typeof window !== 'undefined') {
    window.getCurrentSpec = () => currentSpec;
    window.updateOpenAPISpec = (spec) => updateOpenAPISpec(spec);
    window.getDefaultSpec = getDefaultSpec;
}