# Guía rápida para consumir el backend desde el front-end

Este documento resume la información mínima que tu otra aplicación necesita para consumir los servicios del backend **createopenapi**.

## Levantar el backend localmente

```powershell
# Instalar dependencias (una sola vez)
npm install

# Ejecutar en modo desarrollo (recarga automática)
npm run start:dev

# o modo producción
npm start
```

Por defecto el servicio escucha en `http://localhost:4000`. Todos los endpoints de API están bajo el prefijo `/api`.

## Configuración sugerida para el front-end

```ts
// src/config/api.ts (ejemplo)
export const apiConfig = {
  baseURL: 'http://localhost:4000/api',
  docsURL: 'http://localhost:4000/docs',
  openApiSpecURL: 'http://localhost:4000/openapi.json',
  headers: {
    apiKey: 'x-api-key',
    auth: 'Authorization',
    bearerPrefix: 'Bearer '
  }
};
```

### Variables de entorno recomendadas

| Variable            | Descripción                              | Ejemplo                     |
|---------------------|------------------------------------------|-----------------------------|
| `API_BASE_URL`      | URL base del backend                     | `http://localhost:4000/api` |
| `API_KEY`           | Clave que se enviará en `x-api-key`      | `test-key`                  |
| `API_DOCS_URL`      | Enlace a la documentación swagger        | `http://localhost:4000/docs`|
| `API_OPENAPI_URL`   | Enlace al JSON OpenAPI                   | `http://localhost:4000/openapi.json` |

## Flujo de autenticación

1. **Obtener token**
   ```http
   POST /api/auth/token
   Headers: { 'x-api-key': '<API_KEY>' }
   ```
   Respuesta:
   ```json
   {
     "success": true,
     "data": {
       "token": "<JWT>",
       "expiresAt": "2025-11-04T22:00:00.000Z"
     }
   }
   ```
2. Guardar el token y reutilizarlo en todos los endpoints protegidos. El JWT emitido es único por sesión/usuario e incluye `sub` (identificador del cliente) y `sessionId`, lo que permite correlacionar acciones en los logs del backend:
   ```http
   Authorization: Bearer <JWT>
   x-api-key: <API_KEY>
   ```
3. Mantener la cookie de sesión que envía el backend (se utiliza para correlacionar el token).

## Resumen de endpoints

| Endpoint                     | Método | Descripción                                    | Requires Token |
|------------------------------|--------|------------------------------------------------|----------------|
| `/api/health`                | GET    | Estado del servicio                            | No             |
| `/api/auth/token`            | POST   | Emite JWT                                      | No (solo API key) |
| `/api/convert/curl`          | POST   | Convierte CURL a OpenAPI JSON                  | Sí             |
| `/api/convert/curl/yaml`     | POST   | Convierte CURL a OpenAPI YAML                  | Sí             |
| `/api/convert/json`          | POST   | Convierte JSON de ejemplo a OpenAPI            | Sí             |
| `/api/validate/curl`         | POST   | Valida comando CURL                            | Sí             |
| `/api/validate/json`         | POST   | Valida string JSON                             | Sí             |
| `/api/validate/spec`         | POST   | Valida especificación OpenAPI                  | Sí             |
| `/api/examples/defaults`     | GET    | Obtiene ejemplos por defecto                   | Sí             |

## Firmas y ejemplos

### Conversión CURL → OpenAPI JSON

```ts
async function convertCurl({ curl, responses }) {
  const res = await fetch(`${apiConfig.baseURL}/convert/curl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ curl, responses })
  });
  const payload = await res.json();
  if (!payload.success) throw new Error(payload.error?.message);
  return payload.data.spec;
}
```

### Validar JSON

```ts
async function validateJSON(jsonString) {
  const res = await fetch(`${apiConfig.baseURL}/validate/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ json: jsonString })
  });
  const payload = await res.json();
  return payload.success ? payload.data.parsed : Promise.reject(payload.error);
}
```

## Convención de respuestas

```ts
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

## Manejo de errores comunes en el front-end

| Código             | Acción recomendada                 |
|--------------------|------------------------------------|
| `API_KEY_INVALID`  | Verificar API key configurada      |
| `TOKEN_MISSING`    | Forzar re-login / pedir token      |
| `TOKEN_INVALID`    | Renovar token                      |
| `RATE_LIMIT_EXCEEDED` | Mostrar mensaje y reintentar luego |
| `CURL_REQUIRED`, `JSON_PARSE_ERROR`, etc. | Destacar error de validación al usuario |

## Documentación interactiva

- Swagger UI: `http://localhost:4000/docs`
- Especificación JSON: `http://localhost:4000/openapi.json`

## Trazabilidad y auditoría

- El backend loguea cada petición con `requestId`, `sessionId`, `clientId` y el `authSubject` extraído del JWT.
- Propaga el `requestId` en la respuesta para que el front-end pueda mostrarlo o adjuntarlo en reportes de soporte.
- Si necesitás depurar un flujo, guarda el `requestId` y/o el token actual para buscar las entradas correspondientes en `logs/`.

Con esta información el front-end puede configurar sus env vars, consumir los endpoints de forma consistente y reaccionar a las respuestas del backend.
