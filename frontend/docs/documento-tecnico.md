# Documento tecnico createopenapi

## 1. Objetivo
Proveer una vision tecnica integral de la aplicacion createopenapi, incluyendo arquitectura, flujos de datos, dependencias y backlog de historias (usuario y tecnicas) para orientar mantenimiento y evolucion.

## 2. Resumen arquitectonico

- Aplicación SPA servida mediante `index.html`, construida con JavaScript sin framework pesado.
- Toda la lógica de conversión y validación de comandos CURL y generación de OpenAPI/YAML reside en el backend. El frontend solo gestiona la UI, el estado y la comunicación con el backend.
- Menú superior tipo aplicación, responsivo, con submenús y submenú lateral para idioma. No hay panel lateral ni selector de idioma fuera del menú superior.
- Historial de servicios recientes gestionado desde el menú File, con acciones integradas (cargar, descargar, renombrar, borrar) y UI unificada.
- Adaptación completa a mobile y desktop mediante media queries en CSS.
- Visor y editor basados en Swagger UI (`lib/swagger-ui/`) integrados con scripts personalizados (`js/openAPIViewer.js`, `js/metadataEditor.js`).
- Capa de servicios compartidos (`js/services/`) que manejan estado (`AppState`), errores (`ErrorHandler`) y notificaciones (`NotificationManager`).
- Utilidades de validación y schemas en `js/utils/`.
- Pruebas unitarias (Jest) y end to end (Playwright) que ejercitan circuitos completos.
- Scripts PowerShell para generar reportes en Word y Excel con evidencia.

## 3. Estructura de carpetas relevante
```
css/styles.css              // estilos base de la interfaz y media queries para mobile/desktop
js/main.js                  // bootstrap de la aplicación, lógica de menú, idioma y eventos
js/openAPIViewer.js         // integración con Swagger UI y exposición de estado
js/metadataEditor.js        // lógica del modal de edición
js/security.js              // reglas de seguridad y auth
js/services/AppState.js     // almacenamiento en memoria y eventos
js/services/ErrorHandler.js // manejo centralizado de errores
js/services/NotificationManager.js // notificaciones UI
js/utils/constants.js       // constantes varias
js/utils/schema.js          // definiciones de schema reutilizables
js/i18n.js                  // lógica de internacionalización y carga de idiomas
i18n/                       // archivos de idioma (es.json, en.json, etc.)
reports/validaciones/*.ps1  // scripts de reportes
reports/validaciones/*.png  // capturas automatizadas
tests/*.test.js             // pruebas unitarias
tests/e2e/app-flow.spec.js  // pruebas Playwright
```

## 4. Flujo principal de datos
1. **Selección de idioma y configuración**: El usuario accede al menú Ajustes > Idioma para cambiar el idioma de la interfaz. Todas las configuraciones se gestionan desde el menú superior, sin panel lateral.
2. **Gestión de proyectos y archivos**: Desde el menú File, el usuario puede cargar, descargar, renombrar o borrar proyectos recientes. El historial se muestra como submenú dinámico.
3. **Entrada curl**: El usuario pega el comando en el frontend, que lo envía al backend para conversión y validación.
4. **Conversión y validación**: El backend procesa el comando CURL, genera la especificación OpenAPI/YAML y retorna el resultado al frontend.
5. **Render**: `openAPIViewer` carga la especificación en Swagger UI y guarda referencias globales (`window.__CURRENT_OPENAPI_SPEC`, `window.__CURRENT_OPENAPI_VERSION`).
6. **Edición**: `metadataEditor` abre modal con datos actuales desde `AppState`, aplica validaciones y actualiza el spec al guardar.
7. **Notificaciones**: `NotificationManager` informa resultados; `ErrorHandler` captura excepciones y muestra mensajes.
8. **Reportes**: Playwright registra evidencias en `editing-results.json` y scripts PowerShell generan Word o Excel con imágenes y descripciones.

## 5. Dependencias clave
- Swagger UI bundler (`lib/swagger-ui/swagger-ui-bundle.js`).
- Swagger Parser (`lib/swagger-parser/`) para validar definiciones.
- Playwright 1.48 para pruebas e2e.
- Jest 29 para pruebas unitarias.
- PowerShell con biblioteca COM de Excel para reportes XLSX.

## 6. Configuracion y build
- `package.json` define scripts `test`, `test:e2e`, `serve`.
- Playwright utiliza `npm run test:e2e` que levanta servidor (`http-server`) apuntando a `index.html` y ejecuta las pruebas.
- Pruebas unitarias se ejecutan con `npm run test` basado en Jest.
- No se utiliza bundler; los archivos JS se cargan directamente desde `index.html`.

## 7. Observabilidad y trazabilidad
- Los resultados de edición se registran en `reports/validaciones/editing-results.json` con campos editados y rutas de capturas.
- Cada caso de prueba tiene carpeta propia en `tests/fixtures` con datos de referencia.
- El historial de proyectos y acciones queda registrado en localStorage y es accesible desde el menú File.
- La selección de idioma queda persistida y es auditable desde el menú Ajustes > Idioma.
- Reportes generados permiten auditar cambios antes y después.

## 8. Historias de usuario
1. **Como analista quiero convertir un comando curl a OpenAPI para documentar rapidamente mis servicios.**
   - Criterios: al pegar un curl valido se visualiza la especificacion; se muestran errores claros si faltan datos obligatorios.
2. **Como analista quiero editar metadatos de un endpoint para reflejar la descripcion comercial aprobada.**
   - Criterios: el modal precarga valores, permite guardar cambios y la vista previa se actualiza en vivo.
3. **Como QA quiero generar evidencia automatica de cada edicion para adjuntarla al informe de validacion.**
   - Criterios: el flujo Playwright captura cuatro imagenes por caso y produce reportes.
4. **Como lider tecnico quiero asegurar que metodos no soportados sean rechazados con mensajes claros.**
   - Criterios: TRACE y CONNECT muestran notificacion de rechazo y no generan especificacion.

## 9. Historias tecnicas
1. **Exponer el spec actual al contexto global.**
   - Objetivo: `openAPIViewer` debe sincronizar `window.__CURRENT_OPENAPI_SPEC` tras cada carga o edicion para habilitar verificaciones automaticas.
   - Verificacion: pruebas e2e confirman que el estado refleja los cambios guardados.
2. **Persistir resultados de edicion para reportes.**
   - Objetivo: `tests/e2e/app-flow.spec.js` debe escribir `editing-results.json` con metadatos y rutas de capturas.
   - Verificacion: script `generate-excel-report.ps1` falla si faltan campos, asegurando consistencia.
3. **Centralizar manejo de errores.**
   - Objetivo: `ErrorHandler` debe capturar fallos de conversion y comunicar a `NotificationManager` para UI coherente.
   - Verificacion: pruebas unitarias de curl converter disparan errores controlados.
4. **Soportar nuevos metodos extendiendo configuracion unica.**
   - Objetivo: al agregar un metodo se actualizan constantes, validaciones y fixtures en un solo punto (`js/utils/constants.js`).
   - Verificacion: pruebas deben pasar y reportes deben generar capturas.
5. **Automatizar generacion de reportes multiplataforma.**
   - Objetivo: scripts PowerShell deben crear Word y Excel usando el mismo JSON de evidencia para evitar divergencias.
   - Verificacion: ejecucion secuencial produce ambos archivos sin editar manualmente contenidos.

## 10. Consideraciones de seguridad
- El visor bloquea ejecucion de scripts externos al renderizar especificaciones.
- `security.js` define politicas basicas y placeholders para auth, listo para extender con tokens o headers firmados.
- No se almacenan credenciales; los comandos curl se procesan localmente en memoria.

## 11. Puntos de extension futuros
- Integrar autenticacion para cargar specs protegidas.
- Agregar exportacion directa a repositorios Git.
- Implementar validacion en tiempo real mientras se escribe el curl.
- Incorporar pipeline CI que ejecute pruebas y genere reportes automaticamente.

## 12. Recomendaciones de mantenimiento
- Ejecutar suites de pruebas antes de liberar cambios.
- Mantener versiones de Swagger UI y Playwright alineadas con las documentadas.
- Actualizar fixtures y reportes al agregar nuevos endpoints o campos de metadatos.

## 13. Flujos tecnicos
### 13.1 Pipeline de conversion
1. `main.js` escucha el evento del boton Convertir.
2. `curlConverter.parseCommand` transforma el texto curl a objeto estructurado.
3. `jsonConverter.buildOpenAPISpec` genera paths y componentes con apoyo de `schema.js`.
4. `AppState.updateSpec` guarda el resultado temporal y notifica a suscriptores.
5. `openAPIViewer.render` carga la especificacion en Swagger UI y actualiza referencias globales.

### 13.2 Pipeline de edicion automatizada
1. `tests/e2e/app-flow.spec.js` levanta servidor local y navega al index.
2. Se cargan fixtures para comparar resultados (`expected.json` y `responses.json`).
3. Playwright interactua con la UI para abrir modal, modificar campos y guardar.
4. Se evalua `window.__CURRENT_OPENAPI_SPEC` para confirmar cambios y `NotificationManager` para mensajes.
5. Se registran capturas en cuatro pasos y se agregan entradas a `editing-results.json`.

### 13.3 Pipeline de reportes
1. PowerShell lee `editing-results.json` y valida estructura.
2. `generate-full-report.ps1` crea docx, incrusta imagenes y textos usando Open XML empaquetado.
3. `generate-excel-report.ps1` instancia Excel via COM, crea hojas por caso y posiciona imagenes escaladas.
4. Ambos scripts muestran mensaje final con la ruta del archivo generado.
