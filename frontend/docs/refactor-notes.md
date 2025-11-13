# Refactor notes

Acción realizada: 2025-11-12

- `js/jsonConverter.js` ha sido corregido y movido a `js/legacy/jsonConverter.js`.
  - Se arregló la redeclaración dentro de `jsonToOpenAPI` (ahora usa `const parsed = JSON.parse(...)`).
  - Para mantener compatibilidad con cualquier import existente, `js/jsonConverter.js` ahora exporta un shim que re-exporta las funciones desde `js/legacy/jsonConverter.js`.
  - Motivo: el módulo no parecía estar en uso directo en la base de código principal; se preservó compatibilidad mientras se marca como legado.

- Tests añadidos: `tests/unit/jsonConverter.test.js` — prueba mínima que valida la conversión básica de JSON a OpenAPI.

Notas y recomendaciones:
- Si se confirma que `jsonConverter` no es usado, se puede eliminar el shim y mantener solo la versión en `js/legacy/`.
- Próximo paso: refactorizar `js/curlConverter.js` para eliminar acceso al DOM y mover adaptador DOM → responseOverrides a `js/main.js`.

- Se movieron las funciones marcadas como `DEPRECATED` desde `js/curlConverter.js` a `js/legacy/curlConverter_deprecated.js`.
  - Funciones movidas: `extractSecuritySchemes`, `generateJsonSchema`, `shouldHeaderBeRequired`, `shouldQueryParamBeRequired`, `shouldFieldBeRequired`, `validateCurlCommand`.
  - Estas funciones ahora emiten un `console.warn` indicando la deprecación y delegan en `SchemaUtils`/`ValidationUtils`.
  - Motivo: limpiar el módulo principal (`js/curlConverter.js`) y mantener compatibilidad para tests/consumidores antiguos.
