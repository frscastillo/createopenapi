# Solución de problemas de autenticación con API Key y JWT

## 1. Error típico

Cuando el frontend recibe respuestas `401 Unauthorized` en todos los servicios (excepto `/api/health`), el backend no reconoce la API key enviada.

## 2. Causa principal

El backend espera que la variable de entorno `API_KEYS` contenga la clave que el frontend está usando (por ejemplo, `test-key`). Si no coincide, rechaza la petición.

## 3. Pasos para solucionar

### a) Configurar la API key en el backend

1. Abrí el archivo `.env` en la carpeta del backend y agregá (o corregí) la línea:
   ```env
   API_KEYS=test-key
   ```
   (Podés poner varias separadas por coma si querés más de una clave).

2. Guardá el archivo y reiniciá el backend:
   ```powershell
   npm run start:dev
   ```

### b) Verificar el header en el frontend

Asegurate de que el frontend esté enviando el header:
   ```http
   x-api-key: test-key
   ```
en todos los requests (especialmente en `/api/auth/token`).

### c) Flujo correcto de autenticación

1. El frontend llama a `/api/auth/token` con la API key:
   ```js
   await apiClient.request('/auth/token', { method: 'POST' });
   // o con fetch
   fetch('http://localhost:4000/api/auth/token', {
     method: 'POST',
     headers: { 'x-api-key': 'test-key' }
   })
   ```
2. El backend responde con el JWT:
   ```json
   {
     "success": true,
     "data": {
       "token": "<JWT>",
       "expiresAt": "2025-11-04T22:00:00.000Z"
     }
   }
   ```
3. El frontend guarda el token y lo envía en el header `Authorization` en cada request:
   ```http
   Authorization: Bearer <JWT>
   x-api-key: test-key
   ```

### d) Probar manualmente con CURL

1. Obtener token:
   ```sh
   curl -X POST "http://localhost:4000/api/auth/token" -H "x-api-key: test-key"
   ```
2. Usar el token en otros endpoints:
   ```sh
   curl -X POST "http://localhost:4000/api/convert/curl" \
     -H "x-api-key: test-key" \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{"curl":"curl ...", "responses":[...]}'
   ```

## 4. Si sigue el problema

- Verificá el valor actual de `API_KEYS` en el backend.
- Revisá el header que está enviando el frontend.
- Reiniciá el backend tras cualquier cambio en `.env`.
- Consultá los logs del backend para ver el motivo exacto del rechazo.

## 5. Buenas prácticas

- Mantén la API key sincronizada entre backend y frontend.
- Usa siempre HTTPS en producción.
- Guarda y reutiliza el JWT hasta que expire; renueva con `/auth/token` cuando sea necesario.
- Propaga la cookie de sesión si el backend la requiere (usa `credentials: 'include'` en fetch).
- Maneja los errores de autenticación en el frontend mostrando mensajes claros al usuario.

---

Si seguís estos pasos y ajustás la configuración, la autenticación debería funcionar correctamente y todos los servicios del backend responderán como se espera. Si encontrás un error específico, compartí el CURL, la respuesta y el log del backend para un diagnóstico más preciso.
