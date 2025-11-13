# Informe de error: Descarga de YAML desde el frontend

## Descripción del problema
Al intentar descargar el archivo YAML generado desde el frontend, se produce el siguiente error en la consola del navegador:

```
POST http://localhost:4000/api/convert/spec/yaml 404 (Not Found)
```

Esto ocurre cuando el usuario presiona el botón de descarga, después de haber generado una especificación OpenAPI desde un comando CURL.

## Flujo de la solicitud
1. El frontend genera la especificación OpenAPI y la muestra correctamente.
2. Al presionar el botón "Descargar YAML", el frontend realiza una solicitud POST a:
   - URL: `http://localhost:4000/api/convert/spec/yaml`
   - Método: POST
   - Body: `{ spec: <objeto OpenAPI> }`
   - Headers: `x-api-key` y `Authorization: Bearer <token>`
3. El backend responde con un error 404 (Not Found).

## Detalles técnicos
- El frontend espera que el backend tenga implementado el endpoint `/api/convert/spec/yaml` para recibir una especificación OpenAPI en formato JSON y devolver el YAML generado.
- El error 404 indica que el backend no reconoce esa ruta o no está implementada.

## Recomendaciones para el backend
- Verificar si el endpoint `/api/convert/spec/yaml` está implementado y correctamente registrado en las rutas del backend.
- Si la funcionalidad existe bajo otra ruta (por ejemplo, `/api/convert/yaml` o `/api/convert/curl/yaml`), informar al frontend para ajustar la URL.
- Si la funcionalidad no existe, considerar implementarla para recibir una especificación OpenAPI y devolver el YAML correspondiente.
- Revisar los logs del backend para obtener más detalles sobre la solicitud recibida y el motivo del error 404.

## Ejemplo de solicitud enviada por el frontend
```http
POST /api/convert/spec/yaml HTTP/1.1
Host: localhost:4000
Content-Type: application/json
x-api-key: frontend-app-key-1
Authorization: Bearer <token>

{
  "spec": { ... } // Especificación OpenAPI en formato JSON
}
```

## Resumen
El frontend requiere un endpoint en el backend que reciba una especificación OpenAPI y devuelva el YAML generado. Actualmente, la ruta `/api/convert/spec/yaml` no está disponible, lo que impide la descarga. Se recomienda revisar e implementar la ruta correspondiente.
