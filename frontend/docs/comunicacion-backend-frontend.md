# Informe de Comunicación Backend-Frontend
## 5. Pruebas de servicios backend

### 5.1 Pruebas automatizadas
- Verificar que `/api/health` responde 200 OK sin autenticación.
- Probar `/auth/token` con API key válida: debe devolver JWT y fecha de expiración.
- Probar `/auth/token` con API key inválida: debe devolver 401 y mensaje de error.
- Probar `/convert/curl` con JWT y API key válidos: debe devolver 200 y la conversión esperada.
- Probar `/convert/curl` sin JWT o con JWT inválido: debe devolver 401 y mensaje de error.
- Validar que los errores de backend se reflejan correctamente en el front (códigos y mensajes).

### 5.2 Pruebas manuales
- Usar CURL para simular flujos de autenticación y conversión, siguiendo los ejemplos del documento.
- Cambiar la API key en el backend y verificar que el front detecta el error y muestra mensaje adecuado.
- Expirar manualmente el JWT (modificando la fecha en backend o esperando) y verificar que el front solicita uno nuevo.
- Probar el flujo completo desde el front: login, conversión, edición, y manejo de errores.

### 5.3 Criterios de aceptación
- Todos los endpoints protegidos deben rechazar requests sin API key o JWT válido.
- Los mensajes de error deben ser claros y consistentes entre backend y frontend.
- El front debe manejar la expiración del token y renovar automáticamente cuando sea necesario.
- El logueo de errores en backend debe permitir auditar intentos fallidos de autenticación.
# 0. Gestión de idioma y configuración desde frontend

El frontend permite seleccionar el idioma de la interfaz desde el menú Ajustes > Idioma. La selección se guarda en localStorage y se aplica instantáneamente, sin requerir recarga ni intervención del backend. Todas las configuraciones de usuario (idioma, historial de proyectos) se gestionan localmente y no se transmiten al backend.

## 1. Flujo esperado de autenticación

### Configuración previa
- El backend debe tener la variable de entorno `API_KEYS` configurada con la(s) clave(s) permitida(s). Ejemplo:
  ```
  API_KEYS=test-key,otra-key
  ```
- El front debe usar una de esas claves en cada request, por ejemplo en `ApiClient.js`:
  ```js
  export const apiClient = new ApiClient({
      baseURL: 'http://localhost:4000/api',
      apiKey: 'test-key'
  });
  ```

### Llamado esperado para obtener token
- El front realiza:
  ```js
  await apiClient.request('/auth/token', { method: 'POST' });
  ```
- Equivalente en CURL:
  ```sh
  curl -X POST "http://localhost:4000/api/auth/token" -H "x-api-key: test-key"
  ```
- Respuesta esperada:
  ```json
  {
    "success": true,
    "data": {
      "token": "<JWT>",
      "expiresAt": "2025-11-04T22:00:00.000Z"
    }
  }
  ```

### Uso del token en el resto de los servicios
- El front guarda el token y lo envía en el header `Authorization` en cada request:
  ```
  Authorization: Bearer <JWT>
  x-api-key: test-key
  ```
- Ejemplo CURL para convertir CURL a OpenAPI:
  ```sh
  curl -X POST "http://localhost:4000/api/convert/curl" \
    -H "x-api-key: test-key" \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"curl":"curl ...", "responses":[...]}'
  ```

---

## 2. Problema encontrado

- El endpoint `/api/health` responde correctamente (no requiere autenticación).
- Todos los demás endpoints devuelven `401 Unauthorized` y el cuerpo indica:
  ```json
  {
    "success": false,
    "error": {
      "code": "API_KEY_INVALID",
      "message": "API key ausente o inválida"
    }
  }
  ```
- En los logs del backend debería aparecer un mensaje indicando que la API key no es válida.

---

## 3. Diagnóstico y pasos para solucionar

### Verificar la API key
- Asegúrate de que la clave que usas en el front (`test-key`) está incluida en la variable de entorno `API_KEYS` del backend.
- Si la clave es diferente, actualiza el front para usar la correcta.

### Reiniciar el backend
- Si cambiaste la variable de entorno, reinicia el backend para que tome el nuevo valor.

### Probar manualmente con CURL
- Ejecuta en terminal:
  ```sh
  curl -X POST "http://localhost:4000/api/auth/token" -H "x-api-key: test-key"
  ```
- Si la respuesta es exitosa, copia el token y prueba:
  ```sh
  curl -X POST "http://localhost:4000/api/convert/curl" \
    -H "x-api-key: test-key" \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"curl":"curl ...", "responses":[...]}'
  ```
- Si sigue fallando, revisa los logs del backend para ver el motivo exacto.

### Revisar configuración del front
- Verifica que el `baseURL` apunte al backend correcto.
- Verifica que la API key y el token se envíen en todos los requests protegidos.

---

## 4. Resumen de buenas prácticas

- Mantén la API key sincronizada entre backend y front.
- Usa siempre HTTPS en producción.
- Guarda y reutiliza el JWT hasta que expire; renueva con `/auth/token` cuando sea necesario.
- Propaga la cookie de sesión si el backend la requiere (usa `credentials: 'include'` en fetch).
- Maneja los errores de autenticación en el front mostrando mensajes claros al usuario.

---

Si sigues estos pasos y ajustas la configuración, la autenticación debería funcionar correctamente y todos los servicios del backend responderán como se espera. Si encuentras un error específico, comparte el CURL, la respuesta y el log del backend para un diagnóstico más preciso.
