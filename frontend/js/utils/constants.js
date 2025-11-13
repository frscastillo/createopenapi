// Constantes centralizadas de la aplicación
export const CONSTANTS = {
    // Timeouts y delays
    TIMEOUTS: {
        NOTIFICATION_DISMISS: 3000,
        REQUEST_TIMEOUT: 30000,
        DEBOUNCE_DELAY: 300
    },
    
    // Límites de validación
    LIMITS: {
        MAX_JSON_SIZE: 100000,        // 100KB
        MAX_CURL_LENGTH: 5000,        // 5KB  
        MAX_OBJECT_DEPTH: 20,         // Máxima profundidad de objetos
        MAX_REQUESTS_PER_PERIOD: 30,  // Rate limiting
        RATE_LIMIT_PERIOD: 5 * 60 * 1000 // 5 minutos
    },
    
    // Campos comúnmente requeridos/opcionales
    VALIDATION: {
        REQUIRED_HEADERS: [
            'authorization', 'content-type', 'api-key', 'x-api-key',
            'x-auth-token', 'x-access-token'
        ],
        OPTIONAL_HEADERS: [
            'user-agent', 'accept', 'accept-language', 'accept-encoding',
            'cache-control', 'connection', 'host', 'referer',
            'x-requested-with', 'x-forwarded-for', 'x-real-ip',
            'cookie', 'if-modified-since', 'if-none-match'
        ],
        REQUIRED_FIELDS: [
            'id', 'name', 'email', 'username', 'title', 'status', 
            'type', 'code', 'message', 'data', 'result'
        ],
        OPTIONAL_FIELDS: [
            'description', 'note', 'comment', 'metadata', 'extra',
            'optional', 'additional', 'custom', 'createdAt', 'updatedAt',
            'modifiedAt', 'lastModified', 'timestamp'
        ],
        REQUIRED_PARAMS: [
            'id', 'user_id', 'userId', 'account_id', 'accountId',
            'api_key', 'apiKey', 'token', 'auth', 'key',
            'version', 'v'
        ],
        OPTIONAL_PARAMS: [
            'page', 'limit', 'offset', 'size', 'count', 'per_page', 'perPage',
            'sort', 'order', 'orderBy', 'sortBy', 'direction',
            'filter', 'search', 'query', 'q', 'term',
            'include', 'exclude', 'fields', 'expand',
            'format', 'pretty', 'debug', 'verbose',
            'callback', 'jsonp', 'timestamp', 'cache'
        ]
    },
    
    // Métodos HTTP soportados
    HTTP_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    
    // Tipos de contenido comunes
    CONTENT_TYPES: {
        JSON: 'application/json',
        XML: 'application/xml',
        FORM: 'application/x-www-form-urlencoded',
        MULTIPART: 'multipart/form-data',
        TEXT: 'text/plain',
        HTML: 'text/html'
    },
    
    // Códigos de estado HTTP comunes
    STATUS_CODES: {
        SUCCESS: ['200', '201', '202', '204'],
        CLIENT_ERROR: ['400', '401', '403', '404', '422'],
        SERVER_ERROR: ['500', '502', '503', '504']
    },
    
    // Configuración OpenAPI
    OPENAPI: {
        VERSION: '3.0.0',
        DEFAULT_TITLE: 'API Documentation',
        DEFAULT_VERSION: '1.0.0',
        DEFAULT_DESCRIPTION: 'Generated from CURL command',
        PROPERTY_ORDER: [
            'openapi', 'info', 'servers', 'paths', 
            'components', 'security', 'tags', 'externalDocs'
        ]
    }
    ,
    // Debug flags to control verbose behaviors during development
    DEBUG: {
        SERVICE_LOGS: false
    }
};

export default CONSTANTS;