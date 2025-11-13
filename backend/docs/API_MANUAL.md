# Manual de uso de servicios

Este documento describe los servicios disponibles en el backend `createopenapi`, incluyendo requisitos de autenticación, ejemplos de peticiones y respuestas, así como los errores más frecuentes.

## Autenticación y seguridad

1. **API Key**: toda solicitud a `/api` debe incluir el header `x-api-key` con una clave válida registrada en la variable de entorno `API_KEYS`.
2. **Sesiones**: se mantiene una sesión de Express por cliente. Debe aceptarse la cookie de sesión enviada por el backend (identifica la sesión).
3. **Token JWT**: los servicios (excepto `/auth/token` y `/health`) exigen header `Authorization: Bearer <token>`. El token se obtiene en `/api/auth/token` y se emite **por usuario/sesión**, incluyendo en el payload `sub` (identificador del cliente) y `sessionId`.
4. **HTTPS**: el middleware `httpsGuard` exige HTTPS en entornos que no sean `development` o `test`.
5. **Rate limiting**: se aplica un límite estricto (máx. 30 req/min en producción) para endpoints de conversión y validación; los errores se entregan con código `429`.

### Flujo recomendado para un cliente

1. Realizar `POST /api/auth/token` con `x-api-key` para recibir un JWT.
2. Reutilizar la cookie de sesión y el JWT en el resto de llamadas (`/convert`, `/validate`, `/examples`).

## Convenciones de respuesta

Todas las respuestas comparten el mismo envoltorio:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "UUID",
    "timestamp": "2025-11-04T15:00:00.000Z"
  }
}
```

Cuando ocurre un error `success` es `false` y el nodo `error` contiene `code`, `message` y opcionalmente `details`.

## Endpoints

### 1. Health Check

- **Ruta**: `GET /api/health`
- **Headers**: ninguno especial
- **Descripción**: verifica disponibilidad del backend.

**Respuesta 200**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123.45
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

### 2. Obtener token JWT

- **Ruta**: `POST /api/auth/token`
- **Headers**: `x-api-key`
- **Body**: vacío
- **Descripción**: emite un JWT asociado a la sesión.

**Respuesta 200**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-11-04T16:00:00.000Z"
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Errores comunes**
- `401 API_KEY_INVALID`: falta o no coincide la API key.
- `429 RATE_LIMIT_EXCEEDED`: demasiadas solicitudes consecutivas.
- `500 SESSION_NOT_AVAILABLE`: no se pudo inicializar la sesión (reintentar).

### 3. Convertir CURL a OpenAPI (JSON)

- **Ruta**: `POST /api/convert/curl`
- **Headers**: `x-api-key`, `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "curl": "curl https://api.example.com/users -H \"Authorization: Bearer token\"",
    "responses": [
      {
        "code": "200",
        "description": "Respuesta exitosa",
        "body": { "message": "ok" }
      }
    ]
  }
  ```
- **Descripción**: genera un documento OpenAPI normalizado.

**Respuesta 200**
```json
{
  "success": true,
  "data": {
    "spec": {
      "openapi": "3.0.0",
      "info": { "title": "API Documentation", "version": "1.0.0" },
      "paths": {
        "/users": {
          "get": {
            "summary": "GET endpoint",
            "responses": { "200": { "description": "Respuesta exitosa" } }
          }
        }
      }
    },
    "sizeBytes": 1234,
    "contentType": "application/json"
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Errores comunes**
- `400 CURL_REQUIRED`: falta la propiedad `curl` en el body.
- `400 CURL_VALIDATION_FAILED`: el comando CURL no pasa la validación (p. ej. URL ausente).
- `400 BODY_PARSING_FAILED`: request body dentro del CURL contiene JSON inválido.
- `401 TOKEN_INVALID` o `TOKEN_MISSING`: token ausente o expirado.
- `429 RATE_LIMIT_EXCEEDED`: se superó el límite de solicitudes.

### 4. Convertir CURL a OpenAPI (YAML)

- **Ruta**: `POST /api/convert/curl/yaml`
- **Headers**: `x-api-key`, `Authorization`
- **Body**: igual al endpoint JSON.
- **Respuesta 200**: devuelve el spec en texto YAML.

**Errores**: mismos que `/api/convert/curl`.

### 5. Convertir JSON a OpenAPI

- **Ruta**: `POST /api/convert/json`
- **Headers**: `x-api-key`, `Authorization`
- **Body**:
  ```json
  {
    "json": {
      "id": 1,
      "name": "Sample"
    }
  }
  ```
- **Descripción**: genera un spec a partir de un ejemplo JSON.

**Respuesta 200**
```json
{
  "success": true,
  "data": {
    "spec": {
      "paths": {
        "/example": {
          "get": {
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": { "type": "object" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "sizeBytes": 678,
    "contentType": "application/json"
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Errores comunes**
- `400 JSON_REQUIRED`: falta el nodo `json`.
- `400 JSON_PARSE_ERROR`: la cadena JSON no se pudo parsear.
- `400 JSON_INPUT_INVALID`: se envió un tipo no soportado.

### 6. Validar comando CURL

- **Ruta**: `POST /api/validate/curl`
- **Headers**: `x-api-key`, `Authorization`
- **Body**:
  ```json
  { "curl": "curl https://api.example.com" }
  ```
- **Respuesta 200**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Errores comunes**
- `200` con `success: false`: cuando `isValid` es `false`, se incluyen errores descriptivos.
- `401 TOKEN_INVALID`: token ausente o inválido.
- `429 RATE_LIMIT_EXCEEDED`: en caso de exceder el límite por defecto (100 req/5 min).

### 7. Validar JSON

- **Ruta**: `POST /api/validate/json`
- **Headers**: `x-api-key`, `Authorization`
- **Body**:
  ```json
  { "json": "{\"name\":\"John\"}" }
  ```
- **Respuesta 200 (válido)**
```json
{
  "success": true,
  "data": {
    "parsed": { "name": "John" }
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Respuesta 200 (inválido)**
```json
{
  "success": false,
  "error": {
    "code": "JSON_INVALID",
    "message": "JSON inválido: Unexpected token ..."
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

### 8. Validar especificación OpenAPI

- **Ruta**: `POST /api/validate/spec`
- **Headers**: `x-api-key`, `Authorization`
- **Body**:
  ```json
  {
    "spec": {
      "openapi": "3.0.0",
      "info": { "title": "Demo", "version": "1.0.0" },
      "paths": {}
    }
  }
  ```

**Respuesta 200**
```json
{
  "success": true,
  "data": { "message": "Especificación válida." },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

**Respuesta 422**
```json
{
  "success": false,
  "error": {
    "code": "SPEC_INVALID",
    "message": "La especificación OpenAPI no es válida.",
    "details": ["... descripción del error ..."]
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

### 9. Ejemplos por defecto

- **Ruta**: `GET /api/examples/defaults`
- **Headers**: `x-api-key`, `Authorization`
- **Descripción**: devuelve un comando CURL y respuestas de ejemplo para usar como plantilla.

**Respuesta 200**
```json
{
  "success": true,
  "data": {
    "curl": "curl -X GET ...",
    "responses": [
      {
        "code": "200",
        "description": "Successful response",
        "body": { "data": [] }
      }
    ]
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

## Errores globales

| Código | HTTP | Descripción | Solución |
|--------|------|-------------|----------|
| `API_KEY_INVALID` | 401 | API key ausente o inválida | Verificar header `x-api-key` |
| `TOKEN_MISSING` | 401 | Falta header `Authorization` | Enviar `Bearer <token>` |
| `TOKEN_INVALID` | 401 | Token expirado o no válido | Regenerar token en `/auth/token` |
| `HTTPS_REQUIRED` | 403 | Llamada sin HTTPS en prod | Usar HTTPS o configurar proxy |
| `RATE_LIMIT_EXCEEDED` | 429 | Se superó el límite de solicitudes | Esperar y reintentar |
| `NOT_FOUND` | 404 | Ruta inexistente | Verificar URL |
| `UNEXPECTED_ERROR` | 500 | Error no controlado | Revisar logs (correlación por `requestId`) |

## Logs y trazabilidad

Todas las respuestas incluyen `requestId`. Ese identificador se puede utilizar en los logs (archivos en `logs/`) para correlacionar eventos. A partir de esta versión el logger también registra `sessionId`, `clientId`, `authSubject` y `authSessionId` (derivados del JWT), lo que permite auditar qué usuario/token realizó cada petición.

## Referencias adicionales

- Documentación interactiva: `GET /docs`
- Especificación OpenAPI en JSON: `GET /openapi.json`
