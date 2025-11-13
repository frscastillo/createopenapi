export const CONSTANTS = {
  TIMEOUTS: {
    NOTIFICATION_DISMISS: 3000,
    REQUEST_TIMEOUT: 30000,
    DEBOUNCE_DELAY: 300
  },
  LIMITS: {
    MAX_JSON_SIZE: 100000,
    MAX_CURL_LENGTH: 5000,
    MAX_OBJECT_DEPTH: 20,
    MAX_REQUESTS_PER_PERIOD: 30,
    RATE_LIMIT_PERIOD: 5 * 60 * 1000
  },
  VALIDATION: {
    REQUIRED_HEADERS: [
      'authorization',
      'content-type',
      'api-key',
      'x-api-key',
      'x-auth-token',
      'x-access-token'
    ],
    OPTIONAL_HEADERS: [
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding',
      'cache-control',
      'connection',
      'host',
      'referer',
      'x-requested-with',
      'x-forwarded-for',
      'x-real-ip',
      'cookie',
      'if-modified-since',
      'if-none-match'
    ],
    REQUIRED_FIELDS: [
      'id',
      'name',
      'email',
      'username',
      'title',
      'status',
      'type',
      'code',
      'message',
      'data',
      'result'
    ],
    OPTIONAL_FIELDS: [
      'description',
      'note',
      'comment',
      'metadata',
      'extra',
      'optional',
      'additional',
      'custom',
      'createdat',
      'updatedat',
      'modifiedat',
      'lastmodified',
      'timestamp'
    ],
    REQUIRED_PARAMS: [
      'id',
      'user_id',
      'userid',
      'account_id',
      'accountid',
      'api_key',
      'apikey',
      'token',
      'auth',
      'key',
      'version',
      'v'
    ],
    OPTIONAL_PARAMS: [
      'page',
      'limit',
      'offset',
      'size',
      'count',
      'per_page',
      'perpage',
      'sort',
      'order',
      'orderby',
      'sortby',
      'direction',
      'filter',
      'search',
      'query',
      'q',
      'term',
      'include',
      'exclude',
      'fields',
      'expand',
      'format',
      'pretty',
      'debug',
      'verbose',
      'callback',
      'jsonp',
      'timestamp',
      'cache'
    ]
  },
  HTTP_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  CONTENT_TYPES: {
    JSON: 'application/json',
    XML: 'application/xml',
    FORM: 'application/x-www-form-urlencoded',
    MULTIPART: 'multipart/form-data',
    TEXT: 'text/plain',
    HTML: 'text/html'
  },
  STATUS_CODES: {
    SUCCESS: ['200', '201', '202', '204'],
    CLIENT_ERROR: ['400', '401', '403', '404', '422'],
    SERVER_ERROR: ['500', '502', '503', '504']
  },
  OPENAPI: {
    VERSION: '3.0.0',
    DEFAULT_TITLE: 'API Documentation',
    DEFAULT_VERSION: '1.0.0',
    DEFAULT_DESCRIPTION: 'Generated from CURL command',
    PROPERTY_ORDER: [
      'openapi',
      'info',
      'servers',
      'paths',
      'components',
      'security',
      'tags',
      'externalDocs'
    ]
  }
};

export default CONSTANTS;
