# Plan de pruebas createopenapi

## 1. Objetivo
Definir el conjunto de pruebas manuales y automatizadas para garantizar que la aplicacion createopenapi convierta comandos curl a especificaciones OpenAPI y permita editar metadatos sin errores.

## 2. Alcance
- Pruebas unitarias sobre conversores y validaciones (Jest).
- Pruebas end to end sobre flujo completo de carga, conversion, edicion, notificaciones y metodos no soportados (Playwright).
- Validacion de evidencia automatica (capturas PNG, archivos JSON y reportes Office).

## 3. Referencias
- Codigo fuente en `js/` y `tests/`.
- Fixtures de casos en `tests/fixtures`.
- Scripts de reporte en `reports/validaciones`.

## 4. Ambiente de pruebas
- Sistema operativo: Windows 10 o superior.
- Node.js segun `package.json` (recomendado 18 LTS).
- Navegador gestionado por Playwright (Chromium).
- Microsoft Excel instalado para generar `informe-validaciones.xlsx`.

## 5. Herramientas
- `npm run test`: ejecuta Jest.
- `npm run test:e2e`: ejecuta Playwright con servidor local.
- `powershell -NoProfile -ExecutionPolicy Bypass -File reports/validaciones/generate-full-report.ps1`.
- `powershell -NoProfile -ExecutionPolicy Bypass -File reports/validaciones/generate-excel-report.ps1`.

## 6. Datos de prueba
Cada carpeta dentro de `tests/fixtures` contiene archivos:
- `curl.txt`: comando de entrada.
- `expected.json`: especificacion esperada.
- `responses.json`: descripciones de respuestas esperadas (cuando aplica).

Casos destacados:
- `01-get-con-query` hasta `12-delete-con-headers`: metodos soportados con edicion exitosa.
- `13-trace-custom-auth`, `14-connect-large-body`: metodos no soportados.

## 7. Planificacion de ejecucion
1. Instalar dependencias: `npm install`.
2. Ejecutar pruebas unitarias: `npm run test`.
3. Ejecutar pruebas e2e: `npm run test:e2e`.
4. Verificar salida:
   - Reporte de consola Playwright (26 pruebas).
   - Archivo `reports/validaciones/editing-results.json` actualizado.
   - Capturas PNG en `reports/validaciones`.
5. Generar reportes:
   - Word: `generate-full-report.ps1`.
   - Excel: `generate-excel-report.ps1`.

## 8. Criterios de aceptacion
- El sistema de botones debe usar clases .btn y modificadores (.btn--primary, .btn--muted, .btn--ghost, .btn--danger) definidos en CSS, sin estilos contradictorios ni overrides innecesarios.
- El textarea CURL debe estar envuelto en .curl-editor, con toolbar y estilos visuales consistentes (borde, foco, fondo).
- Deben realizarse pruebas visuales en distintos anchos de pantalla (mobile/desktop) para verificar responsividad y correcta disposición de menú, botones y textarea.
- El contraste de colores y el foco de teclado deben cumplir criterios de accesibilidad (WCAG AA mínimo).
- Todos los handlers JS deben funcionar correctamente tras cambios en el DOM (menú, historial, botones, edición de metadatos).
- Todas las pruebas Jest y Playwright deben pasar sin fallos.
- `editing-results.json` debe contener 12 entradas exitosas con rutas a las 4 capturas y los campos editados.
- Reportes Word y Excel deben crearse sin errores y contener cada caso documentado.
- No deben aparecer notificaciones de error en el flujo soportado salvo en casos destinados a validar rechazo.
- El menú superior debe permitir acceder a todas las funciones principales (archivo, idioma, ayuda) sin panel lateral.
- La selección de idioma debe persistir y reflejarse instantáneamente en la interfaz.
- El historial de proyectos debe gestionarse desde el menú File y reflejar acciones de abrir, guardar, renombrar y borrar.

## 9. Cobertura
- Conversion curl -> JSON -> OpenAPI.
- Edicion de metadatos (titulo, descripcion, resumen, tag, request body, parametros, responses).
- Manejo de metodos TRACE y CONNECT como no soportados.
- Persistencia temporal del estado en el visor y verificacion de interfaz luego de guardar.

## 10. Gestion de riesgos
- Servidor local no levantado: Playwright fallara al abrir la pagina (se mitiga con script `npm run test:e2e` que inicia servidor).
- Excel no instalado: el reporte XLSX no se podra generar (alternativa Word).
- Cambios en fixtures requieren actualizar criterios de aceptacion y capturas.

## 11. Registro de evidencia
- Consola Playwright almacena inspecciones con rutas de captura.
- JSON de resultados y capturas se almacenan en `reports/validaciones`.
- Reportes finales documentan antes y despues.

## 12. Seguimiento
- Ejecutar suites completas antes de liberar cambios de conversores o UI.
- Integrar comandos en pipeline CI cuando se disponga de infraestructura compatible.

## 13. Flujos de ejecucion
### 13.4 Flujo pruebas visuales y accesibilidad
1. Probar la interfaz en anchos mobile y desktop, verificando que el menú, botones y textarea se adapten correctamente.
2. Usar herramientas de contraste (ej: Chrome DevTools, axe) para validar colores y foco.
3. Navegar la UI solo con teclado, asegurando orden lógico y visibilidad de foco en todos los controles interactivos.
4. Verificar que los botones usen las clases .btn y modificadores, y que no existan overrides contradictorios en CSS.
5. Confirmar que el textarea CURL tenga toolbar y estilos visuales consistentes.
### 13.1 Flujo pruebas unitarias
1. QA o desarrollador ejecuta `npm run test`.
2. Jest compila y corre suites en `tests/*.test.js`.
3. Resultados se muestran en consola con resumen de pases y fallos.
4. Ante fallo se revisa stack trace y se actualiza codigo o fixtures.

### 13.2 Flujo pruebas end to end
1. Se ejecuta `npm run test:e2e`.
2. Script levanta servidor con `http-server` en puerto 4173.
3. Playwright lanza navegador, corre escenarios, toma capturas y actualiza `editing-results.json`.
4. Una vez finalizado cierra servidor y muestra reporte en consola con conteo de casos.

### 13.3 Flujo generacion de reportes
1. Ejecutar script Word, validar mensaje de exito y revisar `informe-validaciones.docx`.
2. Ejecutar script Excel, validar mensaje de exito y revisar `informe-validaciones.xlsx`.
3. Almacenar ambos archivos en repositorio o carpeta compartida de evidencia.
