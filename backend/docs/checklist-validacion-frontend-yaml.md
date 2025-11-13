# Checklist para validar la integración del frontend con el endpoint de descarga YAML

## 1. Endpoint correcto
- [ ] El frontend realiza la solicitud a `http://localhost:4000/api/convert/spec/yaml`
- [ ] El método HTTP es `POST`

## 2. Headers
- [ ] Se envía `Content-Type: application/json`
- [ ] Se envía `x-api-key` con el valor correspondiente
- [ ] Se envía `Authorization: Bearer <token>` si es requerido

## 3. Body de la solicitud
- [ ] El body contiene la propiedad `spec` con la especificación OpenAPI en formato JSON

```json
{
  "spec": { ... } // Especificación OpenAPI
}
```

## 4. Manejo de la respuesta
- [ ] El frontend espera una respuesta con `Content-Type: application/yaml`
- [ ] El frontend descarga el YAML recibido correctamente
- [ ] Se maneja el error si el backend responde con status 400 o 404

## 5. Ejemplo de código (fetch)

```js
fetch('http://localhost:4000/api/convert/spec/yaml', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'frontend-app-key-1',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ spec: openApiSpec })
})
  .then(response => {
    if (!response.ok) throw new Error('Error al descargar YAML');
    return response.text();
  })
  .then(yaml => {
    // Descargar el archivo YAML en el navegador
    const blob = new Blob([yaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spec.yaml';
    a.click();
    URL.revokeObjectURL(url);
  })
  .catch(err => alert(err.message));
```

## 6. Validación final
- [ ] El YAML descargado es el esperado y se puede abrir correctamente
- [ ] El flujo funciona en todos los navegadores soportados

---

Si algún paso falla, revisa los logs del backend y la consola del navegador para identificar el problema.