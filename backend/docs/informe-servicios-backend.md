
# Informe de Servicios Backend

Este documento describe todos los endpoints disponibles en el backend, cómo se consumen y ejemplos de respuesta para cada uno.

---

## 1. Autenticación
### POST `/api/auth/token`
**Descripción:** Obtiene un token de autenticación para el frontend.
**Consumo:**
```http
POST http://localhost:4000/api/auth/token
Content-Type: application/json
{
  "apiKey": "frontend-app-key-1"
}
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt-token>"
  },
  "meta": { ... }
}
```

---

## 2. Salud
### GET `/api/health`
**Descripción:** Verifica el estado del backend.
**Consumo:**
```http
GET http://localhost:4000/api/health
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123.45
  },
  "meta": { ... }
}
```

---

## 3. Ejemplos
### GET `/api/examples`
**Descripción:** Devuelve ejemplos de comandos curl y sus respuestas.
**Consumo:**
```http
GET http://localhost:4000/api/examples
```
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ejemplo1",
      "curl": "curl -X GET ...",
      "response": { "status": 200, "body": { ... } }
    }
  ],
  "meta": { ... }
}
```

### GET `/api/examples/defaults`
**Descripción:** Devuelve ejemplos por defecto (requiere API key y token).
**Consumo:**
```http
GET http://localhost:4000/api/examples/defaults
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { ... }
}
```

---

## 4. Conversión
### POST `/api/convert/curl`
**Descripción:** Convierte un comando curl a OpenAPI/JSON.
**Consumo:**
```http
POST http://localhost:4000/api/convert/curl
Content-Type: application/json
{
  "curl": "curl -X POST ..."
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "openapi": { ... },
    "json": { ... }
  },
  "meta": { ... }
}
```

### POST `/api/convert/curl/yaml`
**Descripción:** Convierte un comando curl a YAML.
**Consumo:**
```http
POST http://localhost:4000/api/convert/curl/yaml
Content-Type: application/json
{
  "curl": "curl -X POST ..."
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```yaml
openapi: 3.0.0
info:
  title: ...
  ...
```

### POST `/api/convert/json`
**Descripción:** Convierte curl a JSON.
**Consumo:**
```http
POST http://localhost:4000/api/convert/json
Content-Type: application/json
{
  "curl": "curl -X POST ..."
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### POST `/api/convert/spec/yaml`
**Descripción:** Convierte OpenAPI JSON a YAML.
**Consumo:**
```http
POST http://localhost:4000/api/convert/spec/yaml
Content-Type: application/json
{
  "openapi": { ... }
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```yaml
openapi: 3.0.0
info:
  title: ...
  ...
```

---

## 5. Validación
### POST `/api/validate/curl`
**Descripción:** Valida un comando curl y devuelve errores, advertencias y el comando normalizado.
**Consumo:**
```http
POST http://localhost:4000/api/validate/curl
Content-Type: application/json
{
  "curl": "curl -X POST ..."
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "normalized": "curl ..."
  },
  "meta": { ... }
}
```

### POST `/api/validate/json`
**Descripción:** Valida un JSON y devuelve errores y advertencias.
**Consumo:**
```http
POST http://localhost:4000/api/validate/json
Content-Type: application/json
{
  "json": { ... }
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "meta": { ... }
}
```

### POST `/api/validate/spec`
**Descripción:** Valida un OpenAPI spec y devuelve errores y advertencias.
**Consumo:**
```http
POST http://localhost:4000/api/validate/spec
Content-Type: application/json
{
  "openapi": { ... }
}
Headers: Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "meta": { ... }
}
```

---

## Notas
- Todos los endpoints devuelven un objeto JSON con las claves `success`, `data` y `meta`.
- El backend requiere autenticación por token en la mayoría de los endpoints (excepto `/api/health`).
- Los endpoints pueden cambiar según la configuración y versión del backend.

---

**Consumo recomendado:** Usar `fetch`, `axios`, Postman o cualquier cliente HTTP compatible.

**Contacto:** it197@outlook.com
