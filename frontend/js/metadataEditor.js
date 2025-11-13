// Editor de Metadatos para OpenAPI
import { getUI, updateOpenAPISpec, getCurrentSpec } from './openAPIViewer.js';

let currentSpec = null;
// (Obsolete imports removed)

// Inicializar el editor de metadatos
export function initMetadataEditor() {
    const editBtn = document.getElementById('editMetadataBtn');
    const modalOverlay = document.getElementById('metadataModalOverlay');
    const closeBtn = document.getElementById('closeMetadataModal');
    const saveBtn = document.getElementById('saveMetadataChanges');
    const cancelBtn = document.getElementById('cancelMetadataEdit');

    if (!editBtn || !modalOverlay) {
        console.warn('Elementos del editor de metadatos no encontrados');
        return;
    }

    // Event listeners
    editBtn.addEventListener('click', openMetadataEditor);
    closeBtn.addEventListener('click', closeMetadataEditor);
    cancelBtn.addEventListener('click', closeMetadataEditor);
    saveBtn.addEventListener('click', saveMetadataChanges);
    
    // Cerrar al hacer click en el overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeMetadataEditor();
        }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display !== 'none') {
            closeMetadataEditor();
        }
    });

    // Attach live update and focus/blur highlight handlers to fields
    const liveFields = ['apiTitle','apiDescription','endpointTag','endpointSummary','endpointDescription','requestBodyDescription'];
    const mapping = {
        apiTitle: '#previewApiTitle',
        apiDescription: '#previewApiDescription',
        endpointTag: '#previewEndpointTag',
        endpointSummary: '#previewEndpointSummary',
        endpointDescription: '#previewEndpointSummary',
        requestBodyDescription: null
    };

    liveFields.forEach(id => {
        const el = document.getElementById(id);
        const targetSelector = mapping[id];
        if (!el) return;
        el.addEventListener('input', () => {
            try { updatePreview(); } catch (e) {}
        });
        if (targetSelector) {
            el.addEventListener('focus', () => highlightPreview(targetSelector));
            el.addEventListener('blur', () => removePreviewHighlight(targetSelector));
        }
    });
}

// Abrir el editor de metadatos
function openMetadataEditor() {
    // Obtener el spec actual de la preview
    currentSpec = getCurrentSpec();
    
    if (!currentSpec) {
        alert('No hay especificación cargada para editar');
        return;
    }

    // Llenar el formulario con los valores actuales
    fillEditorWithCurrentValues(currentSpec);
    
    // Mostrar el modal
    const modal = document.getElementById('metadataModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden','false');
        document.body.classList.add('modal-open');
    }
    try { updatePreview(); } catch (e) {}
}

// Cerrar el editor de metadatos
function closeMetadataEditor() {
    const modal = document.getElementById('metadataModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden','true');
    }
    document.body.classList.remove('modal-open');
    currentSpec = null;
}

// Preview functions removed per user request: no-op implementations to avoid errors
function updatePreview() { /* preview removed - no-op */ }
function escapeHtml(str) { return String(str || ''); }
function highlightPreview(selector) { /* no-op */ }
function removePreviewHighlight(selector) { /* no-op */ }

// Llenar el editor con los valores actuales del spec
function fillEditorWithCurrentValues(spec) {
    try {
        // 1. API Information
        document.getElementById('apiTitle').value = spec.info?.title || '';
        document.getElementById('apiDescription').value = spec.info?.description || '';

        // 2. Endpoint Information
        const firstPath = Object.keys(spec.paths || {})[0];
        if (firstPath) {
            const firstMethod = Object.keys(spec.paths[firstPath])[0];
            const operation = spec.paths[firstPath][firstMethod];

            // Tag/Category - primer tag o vacío
            const currentTag = operation?.tags?.[0] || '';
            document.getElementById('endpointTag').value = currentTag;

            document.getElementById('endpointSummary').value = operation?.summary || '';
            document.getElementById('endpointDescription').value = operation?.description || '';

            // 3. Query Parameters
            generateQueryParameterFields(operation);

            // 4. Request Body
            toggleRequestBodySection(operation);

            // 5. Responses
            generateResponseFields(operation);
        } else {
            // Si no hay paths, limpiar las secciones
            document.getElementById('queryParamsContainer').innerHTML = '';
            document.getElementById('responsesContainer').innerHTML = '';
            document.getElementById('requestBodySection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error llenando el editor:', error);
    }
}

// Generar campos para query parameters
function generateQueryParameterFields(operation) {
    const container = document.getElementById('queryParamsContainer');
    container.innerHTML = '';

    if (!operation?.parameters) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No query parameters found</p>';
        return;
    }

    const queryParams = operation.parameters.filter(param => param.in === 'query');
    
    if (queryParams.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No query parameters found</p>';
        return;
    }

    queryParams.forEach(param => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
    // Show the parameter name as the label; only the description is editable
    formGroup.innerHTML = `
        <label for="param_${param.name}_desc">${param.name} <small>(${param.required ? 'required' : 'optional'})</small>:</label>
        <input type="text" id="param_${param.name}_desc" class="field-medium" value="${param.description || ''}" placeholder="Description">
    `;
        
        container.appendChild(formGroup);
    });
}

// Mostrar/ocultar sección de request body
function toggleRequestBodySection(operation) {
    const section = document.getElementById('requestBodySection');
    const field = document.getElementById('requestBodyDescription');
    
    if (operation?.requestBody) {
        section.style.display = 'block';
        field.value = operation.requestBody.description || '';
    } else {
        section.style.display = 'none';
        field.value = '';
    }
}

// Generar campos para responses
function generateResponseFields(operation) {
    const container = document.getElementById('responsesContainer');
    container.innerHTML = '';

    if (!operation?.responses) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No responses found</p>';
        return;
    }

    Object.entries(operation.responses).forEach(([statusCode, response]) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        // Response descriptions are short one-line notes: use a single-line input instead of a wide textarea
        formGroup.innerHTML = `
            <label for="response_${statusCode}">${statusCode} Response:</label>
            <input type="text" id="response_${statusCode}" class="field-medium" value="${response.description || ''}" placeholder="One-line note for ${statusCode} response">
        `;

        container.appendChild(formGroup);
    });
}

// Guardar los cambios de metadatos
function saveMetadataChanges() {
    try {
        console.log('Iniciando guardado de metadatos...');
        
        if (!currentSpec) {
            console.error('No hay especificación para actualizar');
            alert('No hay especificación para actualizar');
            return;
        }

        console.log('Spec actual:', currentSpec);

        // Crear una copia del spec actual
        const updatedSpec = JSON.parse(JSON.stringify(currentSpec));

        // 1. Actualizar información de la API
        const apiTitle = document.getElementById('apiTitle').value.trim();
        const apiDescription = document.getElementById('apiDescription').value.trim();

        console.log('Actualizando API info:', { apiTitle, apiDescription });

        if (apiTitle) updatedSpec.info.title = apiTitle;
        if (apiDescription) updatedSpec.info.description = apiDescription;

        // 2. Actualizar información del endpoint
        const firstPath = Object.keys(updatedSpec.paths || {})[0];
        if (firstPath) {
            const firstMethod = Object.keys(updatedSpec.paths[firstPath])[0];
            const operation = updatedSpec.paths[firstPath][firstMethod];

            const endpointTag = document.getElementById('endpointTag').value.trim();
            const endpointSummary = document.getElementById('endpointSummary').value.trim();
            const endpointDescription = document.getElementById('endpointDescription').value.trim();

            console.log('Actualizando endpoint info:', { endpointTag, endpointSummary, endpointDescription });

            // Actualizar tag/categoría
            if (endpointTag) {
                operation.tags = [endpointTag];
            } else {
                // Si está vacío, usar un tag por defecto o eliminar
                operation.tags = ['API'];
            }

            if (endpointSummary) operation.summary = endpointSummary;
            if (endpointDescription) operation.description = endpointDescription;

            // 3. Actualizar query parameters
            if (operation.parameters) {
                operation.parameters.forEach(param => {
                        if (param.in === 'query') {
                            // description now comes from the dedicated description input
                            const descField = document.getElementById(`param_${param.name}_desc`);
                            if (descField) {
                                const description = descField.value.trim();
                                console.log(`Actualizando parámetro ${param.name}:`, description);
                                if (description) {
                                    param.description = description;
                                } else {
                                    // Si está vacío, eliminar la descripción
                                    delete param.description;
                                }
                            }
                        }
                });
            }

            // 4. Actualizar request body
            if (operation.requestBody) {
                const requestBodyDesc = document.getElementById('requestBodyDescription').value.trim();
                console.log('Actualizando request body:', requestBodyDesc);
                if (requestBodyDesc) {
                    operation.requestBody.description = requestBodyDesc;
                } else {
                    delete operation.requestBody.description;
                }
            }

            // 5. Actualizar responses
            if (operation.responses) {
                Object.keys(operation.responses).forEach(statusCode => {
                    const field = document.getElementById(`response_${statusCode}`);
                    if (field) {
                        const description = field.value.trim();
                        console.log(`Actualizando respuesta ${statusCode}:`, description);
                        if (description) {
                            operation.responses[statusCode].description = description;
                        } else {
                            // Si está vacío, usar descripción por defecto
                            operation.responses[statusCode].description = `${statusCode} response`;
                        }
                    }
                });
            }
        }

        console.log('Spec actualizado:', updatedSpec);

        // Actualizar la preview con el spec modificado
        const updateResult = updateOpenAPISpec(updatedSpec);
        console.log('Resultado de actualización:', updateResult);
        
        if (!updateResult) {
            throw new Error('No se pudo actualizar la especificación en la preview');
        }
        
        // Cerrar el modal
        closeMetadataEditor();

        // Mostrar mensaje de éxito
        console.log('Metadatos actualizados correctamente');
        
        // Opcional: Mostrar notificación al usuario
        setTimeout(() => {
            alert('Metadatos actualizados correctamente');
        }, 100);
        
    } catch (error) {
        console.error('Error detallado guardando los cambios:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al guardar los cambios: ' + error.message);
    }
}

// Exportar funciones principales
export { openMetadataEditor, closeMetadataEditor };

// Exponer funciones en window para debugging / llamadas directas desde consola
if (typeof window !== 'undefined') {
    window.openMetadataEditor = openMetadataEditor;
    window.closeMetadataEditor = closeMetadataEditor;
}