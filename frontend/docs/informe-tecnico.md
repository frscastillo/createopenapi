# Informe técnico — Auditoría de JavaScript (convertidor CURL → OpenAPI)

Fecha: 2025-11-12

Resumen breve
------------
Auditoría rápida del código JavaScript del proyecto `createopenapi-beta`. Se analizaron los módulos principales (`js/`), servicios, utilidades y tests. El objetivo fue identificar acoplamientos DOM/logic, código obsoleto o con bugs, dependencias rotas, y proponer un plan de limpieza priorizado con tiempos estimados.

Hallazgos clave
---------------
- Arquitectura general:
  - Código modularizado en `js/` con utilidades en `js/utils/` y servicios en `js/services/`.
  - Interfaz (UI) manipulada directamente desde varios módulos (no hay separación clara UI ↔ lógica).

- Módulos críticos:
  - `js/main.js` — Orquestador y principal punto de entrada del UI (event handlers, DOM, integración con `apiClient`).
  - `js/curlConverter.js` — Lógica principal de parsing de CURL → OpenAPI (contiene helpers y llamadas a `document.querySelector` como fallback).
  - `js/jsonConverter.js` — Herramientas JSON → OpenAPI (contiene un bug claro: redeclaración de variable y, aparentemente, no usado).
  - `js/transform.js` — Wrapper que produce YAML a partir de `curlToOpenAPI`.
  - `js/openAPIViewer.js` — Inicializa y actualiza Swagger UI (depende del bundle global `SwaggerUIBundle`).
  - `js/utils/schema.js` y `js/utils/validation.js` — Utilidades de generación de schemas y reglas de validación (bien estructuradas y reutilizables).
  - `js/services/ApiClient.js` — Cliente HTTP que también escribe logs al DOM (`#serviceCallsList`).

Problemas detectados
--------------------
1. `js/jsonConverter.js` — Bug
   - Dentro de `jsonToOpenAPI` hay `const jsonData = JSON.parse(jsonData);` (redeclaración): provoca excepción y es un bug obvio.
   - Además, no se detectaron importaciones de `jsonToOpenAPI` ni `validateJSON` en el código del proyecto: probablemente código legacy sin uso.

2. `js/curlConverter.js` — Acoplamiento UI/logic y helpers deprecated
   - Aunque expone `curlToOpenAPI(curl, responseOverrides)`, si `responseOverrides` es vacío entra en una rama que lee elementos `.response-item` del DOM para construir respuestas.
   - Contiene varias funciones marcadas `DEPRECATED` que delegan a `SchemaUtils` o `ValidationUtils` (duplicación y ruido).
   - Este acoplamiento impide testear la lógica en aislamiento y dificulta su reutilización en entorno servidor.

3. Logging duplicado y ruido
   - La librería tiene dos mecanismos que añaden logs visibles en la UI: el `fetch` interposed en `js/main.js` y los logs en `ApiClient.request`.
   - Esto puede producir entradas duplicadas en `#serviceCallsList` y confusión durante el debugging.

4. Dependencias de ejecución en el browser
   - `openAPIViewer.js` espera `SwaggerUIBundle` global; los tests/fases de CI deben mockear o bundlear esto para evitar fallos.

5. Tests y runner
   - El repo incluye `jest.config.js` y `vitest.config.js`. `package.json` usa actualmente `jest` en `npm test`, pero los tests usan imports de `vitest` en varios ficheros (ej.: `tests/*.test.js` usan `vitest`).
   - Resultado: `npm test` daba exit code 1 (config runner incoherente). Recomiendo estandarizar a `vitest` (más ligero y compatible con ESM) o ajustar los tests a `jest`.

Acoplamientos DOM detectados (lista resumida)
---------------------------------------------
- `js/main.js` — múltiples `document.getElementById`, `querySelector`, listeners globales.
- `js/metadataEditor.js` — repinta formularios y lee valores del DOM.
- `js/openAPIViewer.js` — inicializa `SwaggerUIBundle` y manipula `#swagger-ui`.
- `js/services/ApiClient.js` — escribe entradas en `#serviceCallsList`.
- `js/curlConverter.js` — lee `.response-item` cuando no recibe overrides.
- `js/i18n.js` — reemplaza texto en el DOM para internacionalización.

Recomendaciones técnicas (priorizadas)
--------------------------------------
1) Corregir y aislar `jsonConverter.js` (rápido) — PRIORIDAD ALTA
   - Opciones: reparar la función `jsonToOpenAPI` y añadir tests unitarios; o mover el archivo a `legacy/` y marcarlo deprecated si no se usa.
   - Tiempo estimado: 0.5–1.5 horas.

2) Refactorizar `curlConverter.js` para ser *puro* (sin DOM) — PRIORIDAD ALTA
   - Hacer que la función `curlToOpenAPI(curl, responseOverrides)` requiera explícitamente `responseOverrides` (array) y eliminar la rama que lee del DOM.
   - Mover cualquier adaptador DOM a `js/main.js` (o a un módulo `uiAdapter`) que convierta `.response-item` → `responseOverrides` y llame a la función pura.
   - Eliminar o mover a `legacy/` las funciones `DEPRECATED` que duplican `SchemaUtils`/`ValidationUtils`.
   - Añadir tests unitarios para: cuerpos JSON multilínea, multipart/form-data (-F), placeholders en path y query params.
   - Tiempo estimado: 4–8 horas con tests.

3) Centralizar logging de llamadas a servicios y añadir flag DEBUG — PRIORIDAD MEDIA
   - Introducir `CONSTANTS.DEBUG.SERVICE_LOGS` o similar y respetarlo en `ApiClient` y en el fetch-interceptor de `main.js` para evitar duplicado.
   - Mejor: un único punto de logging (ApiClient) y que el `fetch` global no escriba si `ApiClient` ya lo hace.
   - Tiempo estimado: 30–60 minutos.

4) Estandarizar runner de tests (mover a `vitest`) — PRIORIDAD ALTA para refactors
   - Actualizar `package.json` scripts: `test: 'vitest'` y ajustar mocks/bundles necesarios (mock de `SwaggerUIBundle` o tests que no dependan del DOM).
   - Ejecutar y arreglar tests que fallen.
   - Tiempo estimado: 1–3 horas dependiendo del número de fallos.

5) Separar UI y lógica (mayor refactor) — PRIORIDAD MEDIA/ALTA
   - Extraer funciones puras de parsing y schema generation a `js/core/` o `js/lib/`.
   - Mantener `js/ui/` con adaptadores que traduzcan DOM ↔ pure API.
   - Facilita reutilización server-side y pruebas de integración.
   - Tiempo estimado: 1–2 días para una extracción segura y con tests.

6) Añadir linting y formateo (ESLint + Prettier) — PRIORIDAD MEDIA
   - Facilita refactor y reduce diffs triviales.
   - Tiempo estimado: 1–2 horas.

Cambios de bajo riesgo que puedo aplicar ahora
--------------------------------------------
- Arreglar `js/jsonConverter.js` y añadir un test mínimo. (Puedo hacerlo ahora y ejecutar tests unitarios.)
- Añadir `CONSTANTS.DEBUG` y hacer que `ApiClient` respete ese flag para habilitar/deshabilitar logs en UI.
- Crear un adaptador DOM pequeño en `js/main.js` que construya `responseOverrides` y pasar siempre ese array a `curlToOpenAPI`, evitando que `curlConverter` lea el DOM.

Checklist rápido para la PR inicial sugerida
--------------------------------------------
- [ ] Fix `js/jsonConverter.js` bug + unit test
- [ ] Add `CONSTANTS.DEBUG.SERVICE_LOGS` and toggle in `ApiClient` and fetch wrapper
- [ ] Add unit test for `transform` happy path
- [ ] Run test suite (prefer to migrate to `vitest` before larger refactors)

Próximos pasos recomendados (mi propuesta para avanzar)
------------------------------------------------------
1. Aprobá que aplique las correcciones de bajo riesgo (jsonConverter fix + DEBUG flag). Aplico los cambios y ejecuto los tests. (Puedo hacerlo ahora.)
2. Si los tests pasan o tras acordar runner, hago la primera refactorización de `curlConverter` para que sea puro y añado tests de parsing.
3. Finalmente, modularizo la UI (mover DOM adaptors fuera de la lógica) y agrego ESLint/Prettier.

Anexos — puntos técnicos concretos
----------------------------------
- Endpoints backend usados (detectados en `js/services/ApiClient.js` y `js/main.js`):
  - POST /api/auth/token
  - GET /api/examples/defaults
  - POST /api/convert/curl
  - POST /api/convert/spec/yaml
  - GET /api/health

- Observación sobre tests: varios ficheros de tests importan `vitest`. El `package.json` usa `jest` por defecto. Recomiendo sustituir `npm test` con `vitest` en `package.json` y eliminar la invocación manual de `jest`.

Fin del informe técnico.

( Puedo convertir este MD a .docx si querés; confirmá y genero también el `.docx` ).
