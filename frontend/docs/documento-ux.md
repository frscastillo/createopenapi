# Documento UX createopenapi

## 1. Objetivos de experiencia
- Facilitar la transformacion rapida de comandos curl en documentacion visual.
- Reducir friccion para editar metadatos clave sin conocimiento profundo de OpenAPI.
- Ofrecer retroalimentacion clara y inmediata ante errores o acciones exitosas.
- Permitir captura de evidencia visual con el minimo esfuerzo manual.

## 2. Publico principal
- Analistas y redactores de documentacion tecnica.
- QAs que validan cambios y necesitan capturar pantallas.
- Lideres tecnicos responsables de revisar consistencia y normas internas.

## 3. Principios de diseno
- **Claridad**: estructura centrada en menú superior tipo aplicación, sin paneles laterales. El usuario accede a todas las acciones principales (archivo, idioma, ayuda) desde el menú superior.
- **Consistencia**: colores, tipografía y estilos definidos en `css/styles.css` mantienen apariencia uniforme y responsiva, adaptándose a mobile y desktop.
- **Retroalimentación inmediata**: notificaciones arriba a la derecha indican éxito o fallo; modales muestran campos obligatorios.
- **Progresión guiada**: botones destacados dirigen el flujo (Convertir, Editar metadatos, Guardar cambios). El historial y la selección de idioma están integrados en el menú.

## 4. Arquitectura de informacion
1. Menú superior: acceso a File (historial, abrir, guardar), Ajustes (idioma), y Ayuda. No hay panel lateral.
2. Área principal: entrada curl, preview JSON y Swagger UI se disponen en una sola columna en mobile y en filas en desktop.
3. Modal de edición: campos agrupados por tipo (resumen, descripción, respuestas, parámetros).

## 5. Flujos clave
- **Selección de idioma**: el usuario accede a Ajustes > Idioma en el menú superior y elige el idioma de la interfaz. La selección se guarda y aplica instantáneamente.
- **Gestión de proyectos**: desde el menú File, el usuario puede abrir, guardar, renombrar o borrar proyectos recientes. El historial se muestra como submenú dinámico.
- **Conversión**: ingresar texto -> validar -> mostrar preview -> habilitar edición.
- **Edición**: seleccionar endpoint -> abrir modal -> modificar campos -> confirmar -> ver preview actualizado.
- **Evidencia**: Playwright automatiza apertura, captura de estados y guardado; usuario solo revisa reportes.
- **Error**: si método no soportado, modal no se habilita y se muestra mensaje de rechazo con tono preventivo.

### 5.1 Pasos detallados conversion
1. Usuario enfoca el textarea de comando.
2. Pega o escribe el curl.
3. Boton Convertir se habilita cuando existe texto.
4. Al hacer clic se muestra indicador de progreso breve.
5. Panel de preview se actualiza con estructura expandida.

### 5.2 Pasos detallados edicion
1. Usuario expande la operacion deseada en Swagger UI.
2. Hace clic en Editar metadatos.
3. Modal muestra pestañas para resumen, request, responses, parametros.
4. Campos con cambio pendiente se resaltan.
5. Boton Guardar valida y cierra modal con feedback.
6. Preview resalta en color suave la operacion actualizada durante algunos segundos.

### 5.3 Pasos detallados captura automatica
1. Playwright navega a la vista y asegura estado inicial.
2. Ejecuta `page.screenshot` del preview antes.
3. Registra modal antes y despues de editar.
4. Captura preview final con cambios.
5. Loguea nombres de archivos y metadatos en JSON para reportes.

## 6. Componentes UI
- Campos de texto multilinea para descripciones largas.
- Lista de parametros y respuestas en formato tabla dentro del modal.
- Botones primarios (`Guardar cambios`) con color de accion principal definido en CSS.
- Notificaciones flotantes con codigos de color (verde exito, rojo error).

## 7. Estados y mensajes
- **Exito**: mensaje "Cambios guardados" y highlight temporal en tarjetas de operaciones.
- **Error de validacion**: mensajes explicitando campos vacios o metodos no soportados.
- **Carga**: indicador spinner cuando Swagger UI recarga la especificacion.

## 8. Accesibilidad
- Colores con contraste suficiente (verificar con herramientas WCAG).
- Campos etiquetados mediante `label` y `aria` para compatibilidad con lectores de pantalla.
- Navegacion con teclado soportada en modal (tab order lineal).
- Alternativas de texto para imagenes en reportes generados manualmente si se integran a herramientas de documentacion.

## 9. Consideraciones para nuevas iteraciones
- Incorporar tour interactivo para usuarios nuevos.
- Permitir modo oscuro ajustando `styles.css`.
- Agregar validacion inline en campos de parametros y responses.
- Sincronizar cambios con auto guardado opcional para evitar perdida de informacion.
