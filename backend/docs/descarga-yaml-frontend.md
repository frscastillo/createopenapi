# Guía para implementar la descarga de YAML desde el backend

## Endpoint disponible

- **URL:** `http://localhost:4000/api/convert/spec/yaml`
- **Método:** `POST`
- **Headers requeridos:**
  - `Content-Type: application/json`
  - `x-api-key: <tu-api-key>`
  - `Authorization: Bearer <token>`

## Body de la solicitud

Envía la especificación OpenAPI en formato JSON bajo la propiedad `spec`:

```json
{
  "spec": { ... } // Especificación OpenAPI en formato JSON
}
```

## Ejemplo de solicitud

```http
POST /api/convert/spec/yaml HTTP/1.1
Host: localhost:4000
Content-Type: application/json
x-api-key: frontend-app-key-1
Authorization: Bearer <token>

{
  "spec": { ... } // Especificación OpenAPI generada en el frontend
}
```

## Respuesta

- **Status:** `200 OK`
- **Content-Type:** `application/yaml`
- **Body:** YAML generado a partir de la especificación OpenAPI enviada.

## Implementación recomendada en el frontend

1. Genera la especificación OpenAPI en formato JSON.
2. Al presionar el botón "Descargar YAML", realiza una solicitud POST al endpoint `/api/convert/spec/yaml` con el body y headers indicados.
3. Recibe el YAML en la respuesta y descarga el archivo en el navegador.

---

¿Necesitas ejemplo de código para React, fetch, o alguna librería específica? Solicítalo y te lo agrego aquí.
