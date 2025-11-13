
# Documento funcional de la aplicación createopenapi (actualizado 2025-11-07)

## 1. Proposito
Este documento describe la funcionalidad clave de la aplicacion createopenapi, sus objetivos y como los usuarios finales interactuan con cada modulo para construir y revisar especificaciones OpenAPI a partir de entradas curl y edicion guiada.

## 2. Alcance funcional
- Conversión de comandos curl a definiciones OpenAPI normalizadas (toda la lógica de conversión y validación reside en el backend).
- Visualización y edición de especificaciones en la interfaz Swagger UI integrada.
- Edición de metadatos descriptivos para cada endpoint, incluyendo resúmenes, tags, descripciones y request bodies.
- Gestión de errores y notificaciones ante entradas incompletas o métodos no soportados.
- Generación de evidencia automatizada para validaciones, disponible en reportes Excel y Word.
- Menú superior tipo aplicación, responsivo, con opciones File (Nuevo, Exportar YAML, Servicios recientes), Ajustes (incluye submenú lateral de Idioma) y Ayuda.
- Historial de servicios recientes gestionado desde el menú File, con acciones de cargar, descargar, renombrar y borrar, todo integrado al estilo del menú.
- Selección de idioma solo desde Ajustes > Idioma, con submenú lateral y sin selector en panel lateral.
- Adaptación completa a mobile: los paneles se apilan y el menú superior se adapta a pantallas pequeñas.

## 3. Roles implicados
- Usuario analista: usa la interfaz para convertir curl y validar la especificacion resultante.
- Usuario QA: ejecuta el plan de pruebas y recopila evidencia.
- Usuario lider tecnico: revisa los cambios en metadatos y confirma consistencia con la documentacion tecnica.

## 4. Resumen de modulos
### 4.1 Carga de comandos curl
- **Entrada**: texto curl pegado en el textarea principal (panel de entrada).
- **Proceso**: validación y conversión completa delegada al backend; el frontend solo envía el comando y recibe la especificación OpenAPI/YAML.
- **Salida**: especificación generada por el backend y mostrada en la sección preview (Swagger UI).
- **Dependencias**: API backend de conversión, `tests/fixtures/*/curl.txt`.

### 4.2 Conversion a JSON estandar
**Entrada**: resultado del backend.
**Proceso**: el backend normaliza estructuras y genera el schema OpenAPI/YAML; el frontend solo renderiza el resultado.
**Salida**: JSON/YAML OpenAPI listo para renderizar.
**Dependencias**: API backend de conversión, biblioteca `lib/swagger-parser` para validar la especificación.

### 4.3 Visor Swagger UI
- **Entrada**: JSON OpenAPI consolidado.
- **Proceso**: renderizado con `lib/swagger-ui/swagger-ui-bundle.js`, exposición de estado en `js/openAPIViewer.js`.
- **Salida**: interfaz interactiva donde se listan operaciones, parámetros y respuestas.
- **Reglas**: las actualizaciones de metadatos deben reflejarse inmediatamente en el visor y en `window.__CURRENT_OPENAPI_SPEC`.

### 4.4 Editor de metadatos
- **Entrada**: seleccion de endpoint y valores a editar (titulo, descripcion, summary, tag, request body, respuestas, parametros).
- **Proceso**: `js/metadataEditor.js` abre modal, precarga valores actuales mediante `AppState`, permite edicion y valida campos requeridos.
- **Salida**: especificacion actualizada, notificacion de exito y nuevo estado compartido con pruebas.
- **Reglas**: campos opcionales permiten vacio; request body solo aplica a metodos con cuerpo.

### 4.5 Gestión de notificaciones y errores
- **Componentes**: `services/NotificationManager.js`, `services/ErrorHandler.js`.
- **Flujo**: cuando la conversión falla o un método no está soportado (TRACE, CONNECT), se muestra mensaje descriptivo y se registran evidencias de rechazo.

### 4.6 Reportes de validación
- **Entrada**: resultados de pruebas Playwright (`reports/validaciones/editing-results.json`) y capturas PNG.
- **Proceso**: scripts PowerShell generan Word (`generate-full-report.ps1`) y Excel (`generate-excel-report.ps1`).
- **Salida**: reportes con secciones por caso, imágenes antes/después y resumen general.

## 5. Casos de uso clave
1. **Convertir comando curl simple**
   - Paso 1: Usuario pega comando en el textarea de entrada.
   - Paso 2: Presiona Convertir.
   - Paso 3: Previsualiza la especificación en Swagger UI.
2. **Editar metadatos de endpoint**
   - Paso 1: Usuario abre modal Editar desde el botón en la vista Swagger UI.
   - Paso 2: Modifica resumen, tag y descripciones.
   - Paso 3: Guarda cambios y verifica en el preview.
3. **Gestionar método no soportado**
   - Paso 1: Usuario ingresa curl con método TRACE o CONNECT.
   - Paso 2: Sistema rechaza y muestra notificación.
   - Paso 3: Evidencia queda disponible en las pruebas y reportes.
4. **Gestionar servicios recientes**
   - Paso 1: Usuario abre menú File > Servicios recientes.
   - Paso 2: Visualiza la lista, puede cargar, descargar, renombrar o borrar cada servicio.
   - Paso 3: Las acciones se reflejan en la UI y en el almacenamiento local.
5. **Seleccionar idioma**
   - Paso 1: Usuario abre Ajustes > Idioma.
   - Paso 2: Selecciona idioma desde el submenú lateral.
   - Paso 3: La UI se actualiza al idioma elegido (por defecto inglés).

## 6. Reglas de negocio y validaciones
- Los metodos soportados son GET, POST, PUT, PATCH, DELETE.
- Campos vacios en request body solo se aceptan si el metodo no requiere payload.
- Las descripciones editadas se guardan en memoria hasta nueva conversion; al refrescar se requieren datos base.
- La notificacion de exito se muestra solo cuando la actualizacion de la especificacion finaliza sin errores de validacion.

## 7. Requisitos no funcionales relevantes
- Compatibilidad con navegadores Chromium (verificado mediante Playwright).
- Generación de reportes ejecutable en entorno Windows con Excel instalado.
- Ejecución de pruebas unitarias y end to end en menos de 3 minutos en hardware estándar de desarrollo.
- Interfaz completamente responsiva, usable en desktop y mobile.

## 8. Trazabilidad
- Casos funcionales cubiertos por pruebas Playwright en `tests/e2e/app-flow.spec.js`.
- Conversores validados por pruebas Jest en `tests/*.test.js`.
- Reportes vinculados con scripts en `reports/validaciones`.

## 9. Riesgos y consideraciones
- Dependencia de Excel restringe la generacion de reportes a estaciones con Microsoft Office.
- Cambios en Swagger UI upstream pueden requerir ajustes en `openAPIViewer.js`.
- Para soportar nuevos metodos HTTP se deben actualizar conversores, validaciones y suites de pruebas.

## 10. Flujos funcionales detallados
### 10.1 Flujo convertir y visualizar especificación
1. Usuario ingresa a la aplicación y se asegura de que `AppState` se inicializó.
2. Pega el comando curl en el textarea de entrada.
3. Hace clic en Convertir.
4. El frontend envía el comando al backend para conversión y validación.
5. El backend retorna la especificación OpenAPI.
6. `openAPIViewer` actualiza el visor y expone la especificación en `window.__CURRENT_OPENAPI_SPEC`.
7. Notificación de éxito confirma la carga; el usuario puede navegar las operaciones en Swagger UI.

### 10.2 Flujo editar metadatos de endpoint
1. Usuario localiza el endpoint en Swagger UI.
2. Presiona el botón Editar metadatos.
3. `metadataEditor` abre modal y carga datos actuales desde `AppState`.
4. Usuario modifica resumen, tag, descripciones, parámetros y respuestas.
5. Al presionar Guardar, se ejecutan validaciones en `validation.js`.
6. Si todo es válido, `AppState` actualiza el spec y llama a `openAPIViewer`.
7. Se emite notificación de éxito y la vista previa se refresca con los nuevos valores.
8. Playwright registra capturas para evidencia cuando se ejecutan pruebas automatizadas.
### 10.5 Flujo selección de idioma
1. Usuario abre Ajustes > Idioma en el menú superior.
2. Se despliega submenú lateral con los idiomas disponibles.
3. Al seleccionar un idioma, la UI se actualiza y la preferencia se mantiene hasta recargar la página.
4. El idioma por defecto es inglés.

### 10.3 Flujo gestionar metodos no soportados
1. Usuario ingresa un comando curl con metodo TRACE o CONNECT.
2. `curlConverter` detecta metodo y marca estado como no soportado.
3. `ErrorHandler` recibe la excepcion y la envia a `NotificationManager`.
4. Se muestra mensaje informativo indicando rechazo.
5. No se genera especificacion ni se habilita el modal de edicion.
6. Playwright captura la notificacion para documentar el comportamiento.

### 10.4 Flujo generar reportes de validacion
1. QA ejecuta `npm run test:e2e`.
2. Playwright corre los 26 casos, captura cuatro imagenes por caso exitoso y crea `editing-results.json`.
3. QA ejecuta `generate-full-report.ps1` para crear el Word.
4. QA ejecuta `generate-excel-report.ps1` para crear el Excel con pestañas por caso.
5. Ambos archivos se revisan y se adjuntan como evidencia del ciclo de pruebas.
