import { env } from '../config/env.js';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'createopenapi Backend API',
    version: '1.0.0',
    description:
      'Servicios REST para convertir comandos CURL y JSON en especificaciones OpenAPI, con validaciones y utilidades auxiliares.'
  },
  servers: [
    {
      url: '/api',
      description: 'API base'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      DefaultResponseWrapper: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object', nullable: true },
          error: {
            type: 'object',
            nullable: true,
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: { type: 'string' },
                nullable: true
              }
            }
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['General'],
        responses: {
          '200': {
            description: 'Estado OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    },
    '/auth/token': {
      post: {
        summary: 'Obtener token JWT',
        tags: ['Autenticación'],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Token emitido',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/DefaultResponseWrapper' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string' },
                            expiresAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/convert/curl': {
      post: {
        summary: 'Convertir CURL a OpenAPI (JSON)',
        tags: ['Conversión'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  curl: { type: 'string' },
                  responses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string' },
                        description: { type: 'string' },
                        body: { type: 'object' }
                      }
                    }
                  }
                },
                required: ['curl']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Conversión exitosa',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/DefaultResponseWrapper' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            spec: { type: 'object' },
                            sizeBytes: { type: 'integer' },
                            contentType: { type: 'string' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/convert/curl/yaml': {
      post: {
        summary: 'Convertir CURL a OpenAPI (YAML)',
        tags: ['Conversión'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  curl: { type: 'string' },
                  responses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string' },
                        description: { type: 'string' },
                        body: { type: 'object' }
                      }
                    }
                  }
                },
                required: ['curl']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Retorna YAML',
            content: {
              'application/yaml': {
                schema: { type: 'string' }
              }
            }
          }
        }
      }
    },
    '/convert/json': {
      post: {
        summary: 'Convertir JSON a OpenAPI',
        tags: ['Conversión'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  json: { anyOf: [{ type: 'object' }, { type: 'string' }] }
                },
                required: ['json']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Conversión exitosa',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    },
    '/validate/curl': {
      post: {
        summary: 'Validar comando CURL',
        tags: ['Validación'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  curl: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resultado de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    },
    '/validate/json': {
      post: {
        summary: 'Validar JSON',
        tags: ['Validación'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  json: { type: 'string' }
                },
                required: ['json']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resultado de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    },
    '/validate/spec': {
      post: {
        summary: 'Validar especificación OpenAPI',
        tags: ['Validación'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  spec: { type: 'object' }
                },
                required: ['spec']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Especificación válida',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          },
          '422': {
            description: 'Especificación inválida',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    },
    '/examples/defaults': {
      get: {
        summary: 'Obtener ejemplos por defecto',
        tags: ['Ejemplos'],
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Ejemplos devueltos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DefaultResponseWrapper'
                }
              }
            }
          }
        }
      }
    }
  }
};

if (env.nodeEnv === 'development') {
  openApiSpec.servers.unshift({
    url: `http://localhost:${env.port}/api`,
    description: 'Servidor local'
  });
}

export default openApiSpec;
