# Pruebas de Servicios Backend

Este documento registra los llamados realizados desde el frontend al backend y las respuestas obtenidas, para verificar el funcionamiento y compararlo con la documentación oficial del backend.

---

## 1. GET /api/health
**Request:**
```http
GET http://localhost:4000/api/health
Headers:
  x-api-key: frontend-app-key-1
```
**Respuesta esperada:**
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

---

## 2. POST /api/auth/token
**Request:**
```http
POST http://localhost:4000/api/auth/token
Headers:
  x-api-key: frontend-app-key-1
Body: (vacío)
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "<JWT>",
    "expiresAt": "2025-11-04T22:00:00.000Z"
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

---

## 3. POST /api/convert/curl
**Request:**
```http
POST http://localhost:4000/api/convert/curl
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "curl": "curl -X GET \"https://api.example.com/users\" -H \"Authorization: Bearer token\"",
  "responses": [
    { "code": "200", "description": "Respuesta exitosa", "body": { "message": "ok" } }
  ]
}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "spec": { ... },
    "sizeBytes": 1234,
    "contentType": "application/json"
  },
  "meta": { ... }
}
```

---

## 4. POST /api/convert/curl/yaml
**Request:**
```http
POST http://localhost:4000/api/convert/curl/yaml
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "curl": "curl -X GET \"https://api.example.com/users\" -H \"Authorization: Bearer token\"",
  "responses": [
    { "code": "200", "description": "Respuesta exitosa", "body": { "message": "ok" } }
  ]
}
```
**Respuesta esperada:**
```yaml
openapi: 3.0.0
info:
  title: API Documentation
  version: 1.0.0
paths:
  /users:
    get:
      summary: GET endpoint
      responses:
        '200':
          description: Respuesta exitosa
...
```

---

## 5. POST /api/convert/json
**Request:**
```http
POST http://localhost:4000/api/convert/json
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "json": { "id": 1, "name": "Sample" }
}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "spec": { ... },
    "sizeBytes": 678,
    "contentType": "application/json"
  },
  "meta": { ... }
}
```

---

## 6. POST /api/validate/curl
**Request:**
```http
POST http://localhost:4000/api/validate/curl
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "curl": "curl -X GET \"https://api.example.com/users\""
}
```
**Respuesta esperada:**
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

## 7. POST /api/validate/json
**Request:**
```http
POST http://localhost:4000/api/validate/json
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "json": "{\"name\":\"John\"}"
}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "parsed": { "name": "John" }
  },
  "meta": { ... }
}
```

---

## 8. POST /api/validate/spec
**Request:**
```http
POST http://localhost:4000/api/validate/spec
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
  Content-Type: application/json
Body:
{
  "spec": { "openapi": "3.0.0", "info": { "title": "Demo", "version": "1.0.0" }, "paths": {} }
}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": { "message": "Especificación válida." },
  "meta": { ... }
}
```

---

## 9. GET /api/examples/defaults
**Request:**
```http
GET http://localhost:4000/api/examples/defaults
Headers:
  x-api-key: frontend-app-key-1
  Authorization: Bearer <JWT>
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "curl": "curl -X GET ...",
    "responses": [ { "code": "200", "description": "Successful response", "body": { "data": [] } } ]
  },
  "meta": { ... }
}
```

---

> Puedes completar este documento con las respuestas reales obtenidas en la pestaña Network del navegador o en la consola, para auditar y comparar con la documentación oficial del backend.
