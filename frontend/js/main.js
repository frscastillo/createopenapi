// Global fetch wrapper: logs all fetch-based backend calls into the persistent serviceCallsList
// Purpose: Transparently intercept window.fetch to append a minimal request/response
// entry to the `#serviceCallsList` DOM container so developers can trace backend
// calls from the UI during debugging. This wrapper is intentionally non-invasive
// (it ignores any errors while logging) and returns the original Response so
// application behavior is unchanged.
try {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const __originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
            const debugEnabled = (typeof window !== 'undefined') && (
                (window.DEBUG_SERVICE_LOGS === true) || (window.CONSTANTS && window.CONSTANTS.DEBUG && window.CONSTANTS.DEBUG.SERVICE_LOGS)
            );
            try {
                if (debugEnabled) {
                    const resource = args[0];
                    const config = args[1] || {};
                    const method = (config.method || 'GET').toUpperCase();
                    const path = (typeof resource === 'string') ? resource : (resource && resource.url) || String(resource);
                    if (typeof document !== 'undefined') {
                        const list = document.getElementById('serviceCallsList');
                        if (list) {
                            const ts = new Date().toISOString();
                            const entry = document.createElement('div');
                            entry.className = 'service-call-entry';
                            entry.style.padding = '4px 0';
                            entry.style.borderBottom = '1px dashed #eee';
                            entry.innerText = `${ts} → ${method} ${path}`;
                            list.appendChild(entry);
                            list.scrollTop = list.scrollHeight;
                        }
                    }
                }
            } catch (e) {
                // ignore logging errors
            }
            const response = await __originalFetch(...args);
            try {
                if (debugEnabled && typeof document !== 'undefined') {
                    const list = document.getElementById('serviceCallsList');
                    if (list) {
                        const ts = new Date().toISOString();
                        const statusEntry = document.createElement('div');
                        statusEntry.className = 'service-call-entry service-call-status';
                        statusEntry.style.padding = '4px 0';
                        statusEntry.style.color = response.ok ? '#006400' : '#b21f2d';
                        statusEntry.innerText = `${ts} ← ${response.status} ${response.statusText || ''}`;
                        list.appendChild(statusEntry);
                        list.scrollTop = list.scrollHeight;
                    }
                }
            } catch (e) {}
            return response;
        };
    }
} catch (e) {}

// Guardar proyecto desde el botón principal (usa helpers globales del modal)
// NOTE: este bloque configura listeners del UI que permiten guardar el estado
// actual (CURL, YAML/spec, responses) como "proyectos" en localStorage.
// Mantener la lógica lo más simple posible: serializa spec si existe, o guarda
// el CURL como fallback.
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar popup de edición de metadatos al presionar el botón Edit
    const editBtn = document.getElementById('editMetadataBtn');
    const modalOverlay = document.getElementById('metadataModalOverlay');
    if (editBtn && modalOverlay) {
        editBtn.addEventListener('click', () => {
            // Obtener el spec actual
            const spec = (window.getCurrentSpec && window.getCurrentSpec()) || null;
            if (!spec) {
                alert('No hay especificación cargada para editar');
                return;
            }
            // Precargar campos del popup
            try {
                document.getElementById('apiTitle').value = spec.info?.title || '';
                document.getElementById('apiDescription').value = spec.info?.description || '';
                const firstPath = Object.keys(spec.paths || {})[0];
                if (firstPath) {
                    const firstMethod = Object.keys(spec.paths[firstPath])[0];
                    const operation = spec.paths[firstPath][firstMethod];
                    document.getElementById('endpointTag').value = operation?.tags?.[0] || '';
                    document.getElementById('endpointSummary').value = operation?.summary || '';
                    document.getElementById('endpointDescription').value = operation?.description || '';
                }
            } catch {}
            // Mostrar el modal: aplicar clase de bloqueo al body para prevenir scroll
            try {
                document.body.classList.add('modal-open');
            } catch (e) {}
            modalOverlay.style.display = 'flex';
            // focus al primer campo
            try { document.getElementById('apiTitle').focus(); } catch (e) {}
        });
    }
    // Setup modal open/close behavior, save and cancel
    try {
        const closeBtn = document.getElementById('closeMetadataModal');
        const saveBtn = document.getElementById('saveMetadataChanges');
        const cancelBtn = document.getElementById('cancelMetadataEdit');

        function closeMetadataModal() {
            try { document.body.classList.remove('modal-open'); } catch (e) {}
            modalOverlay.style.display = 'none';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeMetadataModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeMetadataModal);

        // close when clicking overlay backdrop
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (ev) => {
                if (ev.target === modalOverlay) closeMetadataModal();
            });
        }

        // close with Escape
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
                closeMetadataModal();
            }
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                try {
                    const spec = getCurrentSpec && getCurrentSpec();
                    if (!spec) {
                        appState.addNotification({ message: 'No hay spec cargada para aplicar los cambios', type: 'warning' });
                        closeMetadataModal();
                        return;
                    }
                    // Apply title/description
                    try {
                        const title = document.getElementById('apiTitle')?.value || '';
                        const description = document.getElementById('apiDescription')?.value || '';
                        spec.info = spec.info || {};
                        spec.info.title = title;
                        spec.info.description = description;
                    } catch (e) {}

                    // Apply first operation metadata (tag/summary/description)
                    try {
                        const firstPath = Object.keys(spec.paths || {})[0];
                        if (firstPath) {
                            const firstMethod = Object.keys(spec.paths[firstPath])[0];
                            if (firstMethod) {
                                const op = spec.paths[firstPath][firstMethod];
                                const tag = document.getElementById('endpointTag')?.value || '';
                                const summary = document.getElementById('endpointSummary')?.value || '';
                                const opDesc = document.getElementById('endpointDescription')?.value || '';
                                if (tag) op.tags = [tag];
                                if (summary) op.summary = summary;
                                if (opDesc) op.description = opDesc;
                            }
                        }
                    } catch (e) {}

                    // TODO: could process query params / responses editing UI here

                    // Update viewer and close
                    try { updateOpenAPISpec(spec); } catch (e) { console.warn('updateOpenAPISpec failed', e); }
                    if (window.appState) window.appState.setCurrentSpec(spec);
                    appState.addNotification({ message: 'Metadatos actualizados', type: 'success' });
                } catch (e) {
                    console.error('Error saving metadata edits', e);
                    appState.addNotification({ message: 'Error al guardar cambios', type: 'error' });
                } finally {
                    closeMetadataModal();
                }
            });
        }
    } catch (e) { console.warn('metadata modal setup failed', e); }
    const saveBtn = document.getElementById('saveProjectBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (!window.readProjects || !window.writeProjects || !window.makeId || !window.nextAutoName) return;
                const list = window.readProjects();
                const id = window.makeId();
                const name = window.nextAutoName(list);
                const now = new Date().toISOString();
                // Obtener CURL
                const textarea = document.getElementById('curlInput');
                const curl = textarea ? textarea.value : '';
                // Obtener YAML generado
                let yaml = '';
                let spec = null;
                if (window.getCurrentSpec) {
                    try {
                        spec = window.getCurrentSpec();
                        if (typeof jsyaml !== 'undefined' && spec) {
                            yaml = jsyaml.dump(spec);
                        } else if (spec) {
                            yaml = JSON.stringify(spec, null, 2);
                        }
                    } catch {}
                }
                // Obtener responses si están en el DOM (ajustar selector si es necesario)
                let responses = [];
                try {
                    const responsesList = document.getElementById('responsesList');
                    if (responsesList) {
                        responses = Array.from(responsesList.querySelectorAll('.response-item')).map(item => {
                            const code = item.querySelector('.status-code-select')?.value || '';
                            const description = item.querySelector('.response-description')?.value || '';
                            const body = item.querySelector('.response-body')?.value || '';
                            return { code, description, body };
                        });
                    }
                } catch {}
                // Guardar el YAML como 'content' principal y type 'yaml' (flujo estándar)
                const project = { id, name, content: yaml, type: 'yaml', yaml, curl, responses, createdAt: now, updatedAt: now };
                list.unshift(project);
                window.writeProjects(list);
                if (window.renderProjects) window.renderProjects();
                if (window.appState) window.appState.addNotification({ message: `Proyecto guardado: ${name}`, type: 'success' });
            });
        }
});
// === Gestión de Historial de Proyectos (modal, menú y acciones) ===
document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const projectsHistoryModal = document.getElementById('projectsHistoryModal');
    const openProjectsHistoryBtn = document.getElementById('menuProjectsHistoryBtn');
    const closeProjectsHistoryBtn = document.getElementById('closeProjectsHistoryModal');
    const projectsListEl = document.getElementById('projectsList');
    const clearAllBtn = document.getElementById('clearAllProjectsBtn');
    const importBtn = document.getElementById('importProjectBtn');
    const importInput = document.getElementById('importProjectInput');

    // Storage helpers (expuestos globalmente)
    const STORAGE_KEY = 'myapp:projects_v1';
    function readProjects() {
        try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
    }
    function writeProjects(list) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { console.error('Failed saving projects', e); }
    }
    function makeId() { return 'p_' + Math.random().toString(36).slice(2,9); }
    function nextAutoName(list) {
        const base = 'Proyecto'; let i = 1;
        const names = new Set(list.map(p=>p.name));
        while (names.has(`${base} ${i}`)) i++;
        return `${base} ${i}`;
    }
    window.readProjects = readProjects;
    window.writeProjects = writeProjects;
    window.makeId = makeId;
    window.nextAutoName = nextAutoName;

    // Renderizar lista
        function renderProjects() {
            if (!projectsListEl) return;
            const list = readProjects();
            projectsListEl.innerHTML = '';
            if (list.length === 0) {
                projectsListEl.innerHTML = '<div class="menu-placeholder">No hay proyectos guardados.</div>';
                return;
            }
            list.slice(0,5).forEach(project => {
                const item = document.createElement('div');
                item.className = 'project-item';
                item.dataset.id = project.id;
                // Resumen YAML (primeras 2 líneas)
                let yamlSummary = '';
                if (project.yaml) {
                    const lines = project.yaml.split('\n').slice(0,2);
                    yamlSummary = lines.map(l => l.trim()).join(' ');
                    if (project.yaml.split('\n').length > 2) yamlSummary += ' ...';
                }
                // Cantidad de responses
                const responsesCount = Array.isArray(project.responses) ? project.responses.length : 0;
                item.innerHTML = `
                    <div class="project-item__info">
                        <div class="project-item__name"><b>${project.name}</b></div>
                        <div class="project-item__date">${new Date(project.updatedAt || project.createdAt).toLocaleString()}</div>
                        <div class="project-item__meta">
                            <span class="project-item__meta-yaml">YAML: <code>${yamlSummary || '—'}</code></span><br>
                            <span class="project-item__meta-curl">CURL: <code>${(project.curl||'').slice(0,40)}${(project.curl||'').length>40?'...':''}</code></span><br>
                            <span class="project-item__meta-resp">Respuestas: <b>${responsesCount}</b></span>
                        </div>
                    </div>
                    <div class="project-item__actions">
                        <button data-action="load">Cargar</button>
                        <button data-action="download">Descargar</button>
                        <button data-action="rename">Renombrar</button>
                        <button data-action="delete">Borrar</button>
                    </div>
                `;
                projectsListEl.appendChild(item);
            });
        }

    // Abrir/cerrar modal
    function openModal() {
        renderProjects();
        projectsHistoryModal.style.display = 'flex';
        projectsHistoryModal.focus();
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        projectsHistoryModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (openProjectsHistoryBtn) openProjectsHistoryBtn.addEventListener('click', openModal);
    if (closeProjectsHistoryBtn) closeProjectsHistoryBtn.addEventListener('click', closeModal);
    if (projectsHistoryModal) {
        projectsHistoryModal.addEventListener('click', (e) => {
            if (e.target === projectsHistoryModal || e.target.classList.contains('modal__backdrop')) closeModal();
        });
        projectsHistoryModal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    // Acciones de la lista
    if (projectsListEl) {
        projectsListEl.addEventListener('click', (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            const item = btn.closest('.project-item');
            const id = item && item.dataset.id;
            const list = readProjects();
            const project = list.find(p => p.id === id);
            if (!project) return;
            if (action === 'load') {
                // Cargar en el editor principal (ajustar según integración)
                if (project.type === 'yaml' || project.type === 'json') {
                    if (typeof jsyaml !== 'undefined' && project.type === 'yaml') {
                        try {
                            const obj = jsyaml.load(project.content);
                            if (window.updateOpenAPISpec) window.updateOpenAPISpec(obj);
                            closeModal();
                            if (window.appState) window.appState.addNotification({ message: `Proyecto cargado: ${project.name}`, type: 'success' });
                            return;
                        } catch (e) {}
                    }
                    if (project.type === 'json') {
                        try {
                            const obj = JSON.parse(project.content);
                            if (window.updateOpenAPISpec) window.updateOpenAPISpec(obj);
                            closeModal();
                            if (window.appState) window.appState.addNotification({ message: `Proyecto cargado: ${project.name}`, type: 'success' });
                            return;
                        } catch (e) {}
                    }
                }
                // Si es CURL o texto plano
                const curlInput = document.getElementById('curlInput');
                if (curlInput) curlInput.value = project.content;
                closeModal();
                if (window.appState) window.appState.addNotification({ message: `Contenido cargado: ${project.name}`, type: 'success' });
            } else if (action === 'download') {
                const blob = new Blob([project.content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = (project.name || 'proyecto') + (project.type === 'json' ? '.json' : project.type === 'yaml' ? '.yaml' : '.txt');
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(a.href);
            } else if (action === 'rename') {
                const newName = prompt('Nuevo nombre', project.name || '');
                if (newName && newName.trim().length > 0) {
                    project.name = newName.trim();
                    project.updatedAt = new Date().toISOString();
                    writeProjects(list);
                    renderProjects();
                    if (window.appState) window.appState.addNotification({ message: 'Nombre actualizado', type: 'success' });
                }
            } else if (action === 'delete') {
                if (confirm('¿Seguro que quieres borrar este proyecto?')) {
                    const remaining = list.filter(p => p.id !== id);
                    writeProjects(remaining);
                    renderProjects();
                    if (window.appState) window.appState.addNotification({ message: 'Proyecto borrado', type: 'success' });
                }
            }
        });
    }

    // Borrar todo
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('¿Seguro que quieres borrar TODOS los proyectos?')) {
                writeProjects([]);
                renderProjects();
                if (window.appState) window.appState.addNotification({ message: 'Todos los proyectos borrados', type: 'success' });
            }
        });
    }

    // Importar archivo
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (ev) => {
            const file = ev.target.files && ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                const list = readProjects();
                const id = makeId();
                const name = file.name || nextAutoName(list);
                const now = new Date().toISOString();
                let type = 'yaml';
                if (file.name && file.name.toLowerCase().endsWith('.json')) type = 'json';
                const project = { id, name, content: text, type, createdAt: now, updatedAt: now };
                list.unshift(project);
                writeProjects(list);
                renderProjects();
                if (window.appState) window.appState.addNotification({ message: 'Proyecto importado: ' + name, type: 'success' });
            };
            reader.readAsText(file);
            importInput.value = '';
        });
    }
});
// Importación de módulos necesarios
import { initOpenAPIViewer, updateOpenAPISpec, getUI, getCurrentSpec } from './openAPIViewer.js';
// ...existing code...
import { initMetadataEditor } from './metadataEditor.js';
import { apiClient } from './services/ApiClient.js';
import { CONSTANTS } from './utils/constants.js';
import { appState } from './services/AppState.js';
import { ErrorHandler } from './services/ErrorHandler.js';

// Definir la función createResponseItem fuera del DOMContentLoaded
function createResponseItem() {
    const template = `
        <div class="response-item">
            <div class="response-header">
                <div class="status-code-container">
                    <select class="status-code-select">
                        <option value="200">200 OK</option>
                        <option value="201">201 Created</option>
                        <option value="400">400 Bad Request</option>
                        <option value="401">401 Unauthorized</option>
                        <option value="403">403 Forbidden</option>
                        <option value="404">404 Not Found</option>
                        <option value="500">500 Internal Server Error</option>
                        <option value="custom">Custom Status Code</option>
                    </select>
                    <input type="number" class="custom-status-code" placeholder="Code" min="100" max="599" style="display: none;">
                </div>
                <input type="text" class="response-description" placeholder="Enter response description">
                <button class="remove-response-btn btn btn--primary" title="Borrar respuesta" aria-label="Borrar respuesta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                        <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <textarea class="response-body" placeholder="Enter JSON response example"></textarea>
        </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = template;
    
    const responseItem = div.firstElementChild;
    const select = responseItem.querySelector('.status-code-select');
    const customInput = responseItem.querySelector('.custom-status-code');
    
    // When user selects 'custom', show the numeric input for custom status code.
    // This keeps the UI compact while allowing arbitrary HTTP codes when needed.
    select.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customInput.style.display = 'inline-block';
            customInput.focus();
        } else {
            customInput.style.display = 'none';
        }
    });

    return responseItem;
}

// Helpers to inspect the persistent service calls log from the browser console.
// Usage in browser devtools console:
//   window.getServiceCallLogs() -> returns array of log entries (raw text + metadata)
//   window.getLastConvertPayload() -> attempts to parse the last /convert/curl payload (JSON) or returns raw string
//   window.clearServiceCallLogs() -> clears the UI panel
try {
    // These helpers are convenience utilities for developers to quickly inspect
    // the service call log without opening the DOM. They are intentionally
    // defensive: if the page is not loaded or the element is missing, they
    // return safe defaults instead of throwing.
    window.getServiceCallLogs = function() {
        try {
            const list = document.getElementById('serviceCallsList');
            if (!list) return [];
            return Array.from(list.children).map(n => ({
                text: n.innerText,
                className: n.className,
                dataPath: n.getAttribute && n.getAttribute('data-path') || null
            }));
        } catch (e) { return []; }
    };

    window.getLastConvertPayload = function() {
        // Attempt to locate the last debug entry produced for /convert/curl and
        // parse the JSON payload for debugging. If parsing fails, return raw
        // string to avoid losing information.
        try {
            const list = document.getElementById('serviceCallsList');
            if (!list) return null;
            const nodes = Array.from(list.querySelectorAll('.service-call-debug'));
            if (!nodes || nodes.length === 0) return null;
            const last = nodes[nodes.length - 1].innerText || '';
            // Try to locate the JSON body by finding the first '{'
            const idx = last.indexOf('{');
            if (idx === -1) return last;
            const raw = last.slice(idx);
            try { return JSON.parse(raw); } catch (e) { return raw; }
        } catch (e) { return null; }
    };

    window.clearServiceCallLogs = function() {
        // Clears the persistent UI list used for logging service calls. Useful
        // to keep the panel readable during long debugging sessions.
        try {
            const list = document.getElementById('serviceCallsList');
            if (!list) return false;
            list.innerHTML = '';
            return true;
        } catch (e) { return false; }
    };
} catch (e) {
    // ignore if DOM not ready or in non-browser environment
}

// Adapter: construir responseOverrides a partir del DOM
// Retorna un array [{ code, description, body }, ...]
// Expuesto en window para que otros módulos o tests (temporales) puedan
// obtener la representación normalizada sin que el módulo de parsing lea
// el DOM directamente.
try {
    window.getResponseOverridesFromUI = function() {
        try {
            const responsesList = document.getElementById('responsesList');
            if (!responsesList) return [];
            const items = Array.from(responsesList.querySelectorAll('.response-item'));
            return items.map(item => {
                const select = item.querySelector('.status-code-select');
                let code = select?.value || '';
                if (code === 'custom') {
                    const customVal = item.querySelector('.custom-status-code')?.value || '';
                    if (customVal) code = customVal;
                }
                const description = item.querySelector('.response-description')?.value || '';
                const bodyText = item.querySelector('.response-body')?.value || '';
                let body = bodyText;
                try { body = bodyText ? JSON.parse(bodyText) : undefined; } catch (e) { /* leave as string */ }
                return { code: code, description: description, body };
            });
        } catch (e) { return []; }
    };
} catch (e) { /* ignore in non-browser env */ }

// Funciones de utilidad
// Removed local default initializers - the app now relies exclusively on backend-provided examples

// Inicialización principal de la aplicación cuando el DOM está listo.
// Este bloque realiza 3 tareas principales:
// 1) carga token y ejemplos iniciales desde el backend (flujoInicial)
// 2) inicializa el visualizador Swagger/UI y el editor de metadata
// 3) establece handlers UI (convertir CURL, guardar proyectos, feedback, etc.)
// Separé la lógica en funciones internas (flujoInicial, convertAndLoadPreview) para
// mantener el evento DOMContentLoaded legible y fácil de comentar.
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');

    // Sanity entry: confirmar que el panel de logs de servicios está disponible
    try {
        const svcList = document.getElementById('serviceCallsList');
        if (svcList) {
            const ts = new Date().toISOString();
            const entry = document.createElement('div');
            entry.className = 'service-call-entry service-call-ready';
            entry.style.padding = '4px 0';
            entry.style.fontStyle = 'italic';
            entry.innerText = `${ts} · Service log ready`;
            svcList.appendChild(entry);
        }
    } catch (e) { console.warn('No se pudo escribir en serviceCallsList', e); }

    // 1. Solicitar el token JWT y luego cargar CURL y responses
    // flujoInicial: obtiene token, busca ejemplos y dispara la conversión automática
    // - solicita token via apiClient
    // - pide `/examples/defaults` y adapta la respuesta (array|obj|string)
    // - popula campos del UI (curlInput, responsesList)
    // - inicializa el viewer y lanza un intento de conversión automática
    (async function flujoInicial() {
        try {
            const tokenRes = await apiClient.request('/auth/token', { method: 'POST' });
            if (tokenRes.success && tokenRes.data?.token) {
                apiClient.setToken(tokenRes.data.token);
                console.log('Token JWT obtenido y guardado');
                // 2. Intentar cargar datos iniciales CURL y responses desde backend (/examples/defaults)
                try {
                    // Llamada a /examples/defaults — el backend puede devolver
                    // - un array de ejemplos (antes),
                    // - un único objeto (nuevo: ejemplo único), o
                    // - un string con el CURL directo.
                    const examplesRes = await apiClient.request('/examples/defaults');
                    // DEBUG: mostrar payload crudo de /examples/defaults en el panel de logs
                    try {
                        const list = document.getElementById('serviceCallsList');
                        if (list) {
                            const ts = new Date().toISOString();
                            const entry = document.createElement('div');
                            entry.className = 'service-call-entry service-call-debug';
                            entry.style.padding = '6px 0';
                            entry.style.whiteSpace = 'pre-wrap';
                            entry.style.fontFamily = 'monospace';

                            // Build a concise summary that always exposes HTTP codes present
                            let summaryLines = [];
                            try {
                                const data = examplesRes && examplesRes.data;
                                if (!data) {
                                    summaryLines.push('(no data in examplesRes)');
                                } else if (Array.isArray(data)) {
                                    summaryLines.push(`examples: array(${data.length})`);
                                    data.forEach((ex, i) => {
                                        const resp = ex.response || ex.responses || null;
                                        const curl = ex.curl || ex.command || '';
                                        summaryLines.push(`[${i}] curl: ${curl ? '<present>' : '<none>'}`);
                                        if (resp) {
                                            const arr = Array.isArray(resp) ? resp : [resp];
                                            arr.forEach((r, j) => {
                                                const code = r.status || r.code || r.statusCode || '<no-code>';
                                                summaryLines.push(`  - response[${j}]: code=${code} (type=${typeof r.body})`);
                                            });
                                        } else {
                                            summaryLines.push('  - responses: <none>');
                                        }
                                    });
                                } else if (typeof data === 'object') {
                                    summaryLines.push('examples: single object');
                                    const curl = data.curl || data.command || '';
                                    summaryLines.push(`curl: ${curl ? '<present>' : '<none>'}`);
                                    const resp = data.response || data.responses || null;
                                    if (resp) {
                                        const arr = Array.isArray(resp) ? resp : [resp];
                                        arr.forEach((r, j) => {
                                            const code = r.status || r.code || r.statusCode || '<no-code>';
                                            summaryLines.push(`  - response[${j}]: code=${code} (type=${typeof r.body})`);
                                        });
                                    } else {
                                        summaryLines.push('responses: <none>');
                                    }
                                } else if (typeof data === 'string') {
                                    summaryLines.push('examples: raw string (curl)');
                                    summaryLines.push(data.slice(0, 200) + (data.length > 200 ? '... (truncated)' : ''));
                                } else {
                                    summaryLines.push('examples: unknown data type');
                                }
                            } catch (e) {
                                summaryLines.push('error building summary: ' + e.message);
                            }

                            // Also attach a truncated raw JSON (longer than before) in case needed
                            let raw = '';
                            try { raw = JSON.stringify(examplesRes.data, null, 2); } catch (e) { raw = String(examplesRes.data); }
                            const rawDisplay = raw.length > 3000 ? raw.slice(0,3000) + '\n... (raw truncated)' : raw;

                            entry.innerText = `${ts} · /examples/defaults summary:\n${summaryLines.join('\n')}\n\nRAW:\n${rawDisplay}`;
                            list.appendChild(entry);
                            list.scrollTop = list.scrollHeight;
                        }
                    } catch (e) { /* ignore debug logging errors */ }
                    let first = null;
                    if (examplesRes && examplesRes.success) {
                        if (Array.isArray(examplesRes.data) && examplesRes.data.length > 0) {
                            first = examplesRes.data[0];
                        } else if (examplesRes.data && typeof examplesRes.data === 'object') {
                            // backend returned a single example object
                            first = examplesRes.data;
                        } else if (typeof examplesRes.data === 'string' && examplesRes.data.trim().length > 0) {
                            // backend returned a raw curl string
                            const curlInput = document.getElementById('curlInput');
                            if (curlInput) curlInput.value = examplesRes.data;
                        }
                    }

                    if (first) {
                        const curlInput = document.getElementById('curlInput');
                        if (curlInput && first.curl) curlInput.value = first.curl;

                        const responsesList = document.getElementById('responsesList');
                        if (responsesList) {
                            responsesList.innerHTML = '';
                            // si el ejemplo tiene response como objeto o array, adaptarlo
                            const resp = first.response || first.responses || null;
                            if (resp && typeof resp === 'object') {
                                const r = Array.isArray(resp) ? resp : [resp];
                                const seenCodes = new Set();
                                r.forEach(rr => {
                                    // Determine the status code from multiple possible keys
                                    const rawCode = rr.status ?? rr.code ?? rr.statusCode ?? '';
                                    const codeStr = (rawCode === null || typeof rawCode === 'undefined') ? '' : String(rawCode).trim();
                                    if (codeStr && seenCodes.has(codeStr)) {
                                        // skip duplicate HTTP codes, keep only first occurrence
                                        return;
                                    }
                                    if (codeStr) seenCodes.add(codeStr);

                                    const item = createResponseItem();
                                    const select = item.querySelector('.status-code-select');
                                    const customInput = item.querySelector('.custom-status-code');
                                    const description = item.querySelector('.response-description');
                                    const body = item.querySelector('.response-body');

                                    // If the code matches one of the select options, set it.
                                    // Otherwise use the 'custom' option and populate the custom input.
                                    try {
                                        let matched = false;
                                        if (select && codeStr) {
                                            Array.from(select.options).forEach(opt => {
                                                if (opt.value === codeStr) matched = true;
                                            });
                                            if (matched) {
                                                select.value = codeStr;
                                                if (customInput) customInput.style.display = 'none';
                                            } else {
                                                select.value = 'custom';
                                                if (customInput) {
                                                    customInput.style.display = 'inline-block';
                                                    customInput.value = codeStr;
                                                }
                                            }
                                        }
                                    } catch (e) {}

                                    if (description && (rr.description || rr.desc)) description.value = rr.description || rr.desc || '';
                                    if (body) body.value = typeof rr.body === 'string' ? rr.body : JSON.stringify(rr.body || {}, null, 2);
                                    responsesList.appendChild(item);
                                });
                            } else {
                                // No hay respuestas en el ejemplo: dejar la lista vacía
                                responsesList.innerHTML = '';
                                if (window.appState) window.appState.addNotification({ message: 'Ejemplo sin respuestas válidas', type: 'info' });
                            }
                        }
                    } else {
                        // No se encontraron ejemplos en el backend: dejar inputs vacíos y avisar
                        const curlInput = document.getElementById('curlInput');
                        if (curlInput) curlInput.value = '';
                        const responsesList = document.getElementById('responsesList');
                        if (responsesList) responsesList.innerHTML = '';
                        if (window.appState) window.appState.addNotification({ message: 'No se encontraron ejemplos en el backend', type: 'warning' });
                    }
                } catch (err) {
                    console.warn('No se pudieron cargar ejemplos desde backend', err);
                    const curlInput = document.getElementById('curlInput');
                    if (curlInput) curlInput.value = '';
                    const responsesList = document.getElementById('responsesList');
                    if (responsesList) responsesList.innerHTML = '';
                    if (window.appState) window.appState.addNotification({ message: 'Error cargando ejemplos desde backend', type: 'error' });
                }
                console.log('Datos iniciales cargados');
                // 3. Inicializar el visualizador Swagger UI
                const viewerResult = initOpenAPIViewer();
                console.log('Viewer initialization result:', viewerResult);
                            // 3b. Intentar convertir automáticamente el CURL cargado y actualizar la preview
                            try {
                                const curlInputEl = document.getElementById('curlInput');
                                const curlText = curlInputEl ? curlInputEl.value : '';
                                // recoger respuestas desde el DOM
                                const responsesListEl = document.getElementById('responsesList');
                                let responsesForBackend = [];
                                if (responsesListEl) {
                                    responsesForBackend = Array.from(responsesListEl.querySelectorAll('.response-item')).map(item => {
                                            const select = item.querySelector('.status-code-select');
                                            let code = select?.value || '';
                                            if (code === 'custom') {
                                                const customVal = item.querySelector('.custom-status-code')?.value || '';
                                                if (customVal) code = customVal;
                                            }
                                            const body = item.querySelector('.response-body')?.value || '';
                                            let parsedBody = body;
                                            try { parsedBody = JSON.parse(body); } catch (e) { /* leave as string */ }
                                            return { code: code, body: parsedBody };
                                        });
                                }
                                // DEBUG: show the exact payload that will be sent to /convert/curl
                                try {
                                    const list = document.getElementById('serviceCallsList');
                                    if (list) {
                                        const ts = new Date().toISOString();
                                        const entry = document.createElement('div');
                                        entry.className = 'service-call-entry service-call-debug';
                                        entry.style.padding = '6px 0';
                                        entry.style.whiteSpace = 'pre-wrap';
                                        entry.style.fontFamily = 'monospace';
                                                        // If only one response provided, send as `response` (single) to match backend examples;
                                                        // otherwise send `responses` array. Use `code` property for HTTP code (backend expects `code`).
                                                        let payload = (Array.isArray(responsesForBackend) && responsesForBackend.length === 1)
                                                            ? { curl: curlText, response: responsesForBackend[0] }
                                                            : { curl: curlText, responses: responsesForBackend };
                                        let raw = '';
                                        try { raw = JSON.stringify(payload, null, 2); } catch (e) { raw = String(payload); }
                                        const display = raw.length > 2000 ? raw.slice(0,2000) + '\n... (truncated)' : raw;
                                        entry.innerText = `${ts} · /convert/curl (payload auto):\n${display}`;
                                        list.appendChild(entry);
                                        list.scrollTop = list.scrollHeight;
                                    }
                                } catch (e) {}
                                await convertAndLoadPreview(curlText, responsesForBackend, { auto: true });
                            } catch (e) {
                                console.warn('Auto-convert preview failed', e);
                            }
            } else {
                appState.addNotification({
                    message: 'No se pudo obtener el token JWT: ' + (tokenRes.error?.message || 'Desconocido'),
                    type: 'error'
                });
            }
        } catch (error) {
            appState.addNotification({
                message: 'Error al obtener el token JWT: ' + error.message,
                type: 'error'
            });
        }
        // 4. Inicializar el editor de metadatos (solo listeners, no mostrar popup aún)
        initMetadataEditor();
        console.log('Metadata editor initialized');
    })();

    // Helper: call backend /convert/curl and update preview. Reusable for auto and manual conversions.
    // Contract:
    // - sends { curl, response } when a single response is present
    // - sends { curl, responses } when multiple responses
    // - expects the backend to return an OpenAPI spec in result.data
    // This function updates the UI preview (Swagger) and logs outcome to the
    // persistent serviceCallsList. Errors are caught and surfaced as notifications.
    async function convertAndLoadPreview(curlText, responses = [], opts = {}) {
        try {
            if (!curlText || typeof curlText !== 'string') {
                console.warn('No CURL provided to convertAndLoadPreview');
                return null;
            }
            // show transient appState
            if (window.appState) window.appState.setConverting(true);
            // If only one response, send as `response` (single); otherwise `responses` array — backend examples use `code` + `body`.
            const body = (Array.isArray(responses) && responses.length === 1)
                ? { curl: curlText, response: responses[0] }
                : { curl: curlText, responses };
            const result = await apiClient.request('/convert/curl', { method: 'POST', body });
            // normalize payload: backend may return openapi, spec, or json
            const spec = (result && result.data && (result.data.openapi || result.data.spec || result.data.json)) || result?.data || null;
            if (spec) {
                try { updateOpenAPISpec(spec); } catch (e) { console.warn('Error updating OpenAPI spec', e); }
                if (window.appState) window.appState.setCurrentSpec(spec);
                // add a clear persistent note in the service calls log
                try {
                    const list = document.getElementById('serviceCallsList');
                    if (list) {
                        const ts = new Date().toISOString();
                        const entry = document.createElement('div');
                        entry.className = 'service-call-entry service-call-info';
                        entry.style.padding = '4px 0';
                        entry.style.fontWeight = '600';
                        entry.innerText = `${ts} · Preview updated from /convert/curl ${opts.auto ? '(auto)' : '(manual)'}`;
                        list.appendChild(entry);
                        list.scrollTop = list.scrollHeight;
                    }
                } catch (e) {}
                return spec;
            } else {
                // log failure to the panel
                try {
                    const list = document.getElementById('serviceCallsList');
                    if (list) {
                        const ts = new Date().toISOString();
                        const entry = document.createElement('div');
                        entry.className = 'service-call-entry service-call-error';
                        entry.style.color = '#b21f2d';
                        entry.style.padding = '4px 0';
                        entry.innerText = `${ts} · /convert/curl returned no spec`;
                        list.appendChild(entry);
                        list.scrollTop = list.scrollHeight;
                    }
                } catch (e) {}
                return null;
            }
        } catch (err) {
            console.error('convertAndLoadPreview error', err);
            try {
                const list = document.getElementById('serviceCallsList');
                if (list) {
                    const ts = new Date().toISOString();
                    const entry = document.createElement('div');
                    entry.className = 'service-call-entry service-call-error';
                    entry.style.color = '#b21f2d';
                    entry.style.padding = '4px 0';
                    entry.innerText = `${ts} · Error calling /convert/curl: ${err.message}`;
                    list.appendChild(entry);
                    list.scrollTop = list.scrollHeight;
                }
            } catch (e) {}
            return null;
        } finally {
            if (window.appState) window.appState.setConverting(false);
        }
    }

    // Mostrar popup de edición de metadatos al presionar el botón Edit
    const editBtn = document.getElementById('editMetadataBtn');
    const modalOverlay = document.getElementById('metadataModalOverlay');
    if (editBtn && modalOverlay) {
        editBtn.addEventListener('click', () => {
            // Obtener el spec actual
            const spec = getCurrentSpec && getCurrentSpec();
            if (!spec) {
                alert('No hay especificación cargada para editar');
                return;
            }
            // Precargar campos del popup
            try {
                document.getElementById('apiTitle').value = spec.info?.title || '';
                document.getElementById('apiDescription').value = spec.info?.description || '';
                const firstPath = Object.keys(spec.paths || {})[0];
                if (firstPath) {
                    const firstMethod = Object.keys(spec.paths[firstPath])[0];
                    const operation = spec.paths[firstPath][firstMethod];
                    document.getElementById('endpointTag').value = operation?.tags?.[0] || '';
                    document.getElementById('endpointSummary').value = operation?.summary || '';
                    document.getElementById('endpointDescription').value = operation?.description || '';
                }
            } catch {}
            // Mostrar el modal
            modalOverlay.style.display = 'flex';
        });
    }

        // CURL conversion now handled by backend
        document.getElementById('convertCurlBtn').addEventListener('click', async () => {
            console.log('Convert button clicked');
            const curlInput = document.getElementById('curlInput').value;
            console.log('CURL input:', (curlInput || '').substring(0, 100) + '...');
            // collect responses from DOM
            const responsesListEl = document.getElementById('responsesList');
            let responsesForBackend = [];
            if (responsesListEl) {
                        responsesForBackend = Array.from(responsesListEl.querySelectorAll('.response-item')).map(item => {
                    const select = item.querySelector('.status-code-select');
                    let code = select?.value || '';
                    if (code === 'custom') {
                        const customVal = item.querySelector('.custom-status-code')?.value || '';
                        if (customVal) code = customVal;
                    }
                    const body = item.querySelector('.response-body')?.value || '';
                    let parsedBody = body;
                    try { parsedBody = JSON.parse(body); } catch (e) { /* keep string */ }
                    return { code: code, body: parsedBody };
                });
            }
            try {
                const spec = await convertAndLoadPreview(curlInput, responsesForBackend, { auto: false });
                if (spec) {
                    appState.addNotification({ message: 'CURL convertido exitosamente por backend!', type: 'success' });
                } else {
                    appState.addNotification({ message: 'Error al convertir CURL: no se obtuvo spec', type: 'error' });
                }
            } catch (error) {
                appState.addNotification({ message: 'Error al convertir CURL: ' + (error?.message || error), type: 'error' });
            }
        });

    // Clear toolbar for CURL input (copy removed)
    try {
        const clearCurlBtn = document.getElementById('clearCurlBtn');
        const curlInputEl = document.getElementById('curlInput');

        if (clearCurlBtn) {
            clearCurlBtn.addEventListener('click', () => {
                if (curlInputEl) {
                    curlInputEl.value = '';
                    appState.addNotification({ message: 'Entrada CURL limpiada', type: 'success' });
                    curlInputEl.focus();
                }
            });
        }
    } catch (err) {
        console.error('CURL toolbar setup error', err);
    }

    // Funciones de utilidad con manejo mejorado
    function showNotification(message, type = 'success') {
        appState.addNotification({ message, type });
    }

    // Only add a default response item if none exist yet. This prevents a
    // duplicate '200' option appearing when responses are populated from
    // the backend (/examples/defaults) which may already add items.
    // Intent: keep the initial UI useful for users who open the editor with
    // no backend examples available while avoiding duplication when backend
    // populates responses on load.
    try {
        const responsesList = document.getElementById('responsesList');
        if (responsesList && responsesList.querySelectorAll('.response-item').length === 0) {
            responsesList.appendChild(createResponseItem());
        }
    } catch (e) {
        // ignore
    }

    document.getElementById('responsesList').addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-response-btn');
        if (btn) {
            const responseItem = btn.closest('.response-item');
            if (responseItem && document.querySelectorAll('.response-item').length > 1) {
                responseItem.remove();
            }
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 'enter':
                    document.getElementById('convertCurlBtn').click();
                    break;
            }
        }
    });

    // Remove local processOpenAPISpec, now handled by backend

    // Descarga YAML ahora delegada al backend
        document.getElementById('convertCurlBtn').addEventListener('click', async (ev) => {
            const btn = ev.currentTarget;
            try {
                btn.disabled = true;
                btn.classList.add('is-loading');
                console.log('Convert button clicked');
                const curlInput = document.getElementById('curlInput').value;
                console.log('CURL input:', (curlInput || '').substring(0, 100) + '...');

                // collect responses from DOM (respect custom status code field)
                const responsesListEl = document.getElementById('responsesList');
                let responsesForBackend = [];
                if (responsesListEl) {
                    responsesForBackend = Array.from(responsesListEl.querySelectorAll('.response-item')).map(item => {
                        const select = item.querySelector('.status-code-select');
                        let code = select?.value || '';
                        if (code === 'custom') {
                            const customVal = item.querySelector('.custom-status-code')?.value || '';
                            if (customVal) code = customVal;
                        }
                        const body = item.querySelector('.response-body')?.value || '';
                        let parsedBody = body;
                        try { parsedBody = JSON.parse(body); } catch (e) { /* keep string */ }
                        return { code: code, body: parsedBody };
                    });
                }

                // DEBUG: show the exact payload that will be sent to /convert/curl (manual)
                try {
                    const list = document.getElementById('serviceCallsList');
                    if (list) {
                        const ts = new Date().toISOString();
                        const entry = document.createElement('div');
                        entry.className = 'service-call-entry service-call-debug';
                        entry.style.padding = '6px 0';
                        entry.style.whiteSpace = 'pre-wrap';
                        entry.style.fontFamily = 'monospace';
                        // If only one response provided, send as `response` to match backend examples
                        let payload = (Array.isArray(responsesForBackend) && responsesForBackend.length === 1)
                            ? { curl: curlInput, response: responsesForBackend[0] }
                            : { curl: curlInput, responses: responsesForBackend };
                        let raw = '';
                        try { raw = JSON.stringify(payload, null, 2); } catch (e) { raw = String(payload); }
                        const display = raw.length > 2000 ? raw.slice(0,2000) + '\n... (truncated)' : raw;
                        entry.innerText = `${ts} · /convert/curl (payload manual):\n${display}`;
                        list.appendChild(entry);
                        list.scrollTop = list.scrollHeight;
                    }
                } catch (e) {}

                // Call backend to convert and reload preview
                const spec = await convertAndLoadPreview(curlInput, responsesForBackend, { auto: false });
                if (spec) {
                    // Ensure preview shows the returned spec (convertAndLoadPreview already updates, but be explicit)
                    try { updateOpenAPISpec(spec); } catch (e) { console.warn('updateOpenAPISpec failed after convert', e); }
                    if (window.appState) window.appState.setCurrentSpec(spec);
                    appState.addNotification({ message: 'CURL convertido y preview recargada.', type: 'success' });
                } else {
                    appState.addNotification({ message: 'Error al convertir CURL: no se obtuvo spec', type: 'error' });
                }
            } catch (error) {
                appState.addNotification({ message: 'Error al convertir CURL: ' + (error?.message || error), type: 'error' });
            } finally {
                try { btn.disabled = false; btn.classList.remove('is-loading'); } catch (e) {}
            }
        });

    // Descargar YAML ahora delegada al backend
    document.getElementById('downloadYamlBtn').addEventListener('click', async () => {
        try {
            const currentSpecFromPreview = getCurrentSpec();
            if (!currentSpecFromPreview) {
                alert('No hay especificación cargada para exportar');
                return;
            }
            const result = await apiClient.request('/convert/spec/yaml', { method: 'POST', body: { spec: currentSpecFromPreview } });
            let yamlContent = '';
            if (result && typeof result === 'string') {
                yamlContent = result;
            } else if (result && result.success && result.data?.yaml) {
                yamlContent = result.data.yaml;
            } else if (typeof result === 'object' && result !== null && !result.success && typeof result.data === 'undefined') {
                yamlContent = JSON.stringify(result);
            }
            if (yamlContent && typeof yamlContent === 'string' && yamlContent.trim().length > 0) {
                try {
                    const STORAGE_KEY = 'createopenapi:projects_v1';
                    const list = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } })();
                    let name = 'Servicio';
                    if (currentSpecFromPreview && currentSpecFromPreview.info && currentSpecFromPreview.info.title) {
                        name = currentSpecFromPreview.info.title;
                    } else {
                        let i = 1;
                        const base = 'Servicio';
                        const names = new Set(list.map(p => p.name));
                        while (names.has(`${base} ${i}`)) i++;
                        name = `${base} ${i}`;
                    }
                    const now = new Date().toISOString();
                    const project = {
                        id: 'p_' + Math.random().toString(36).slice(2, 9),
                        name,
                        content: yamlContent,
                        type: 'yaml',
                        createdAt: now,
                        updatedAt: now
                    };
                    list.unshift(project);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                    if (typeof renderProjects === 'function') renderProjects();
                } catch (e) { console.warn('No se pudo guardar automáticamente en historial', e); }
                // Descargar YAML
                const blob = new Blob([yamlContent], { type: 'text/yaml' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'openapi.yaml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                appState.addNotification({
                    message: 'Descarga YAML completada y guardada en servicios recientes',
                    type: 'success'
                });
            } else {
                appState.addNotification({
                    message: 'Error al generar YAML: ' + (result.error?.message || 'Desconocido'),
                    type: 'error'
                });
            }
        } catch (error) {
            appState.addNotification({
                message: 'Error en descarga YAML: ' + error.message,
                type: 'error'
            });
        }
    });

    // Remove local convertCurlToOpenAPI, now handled by backend

    // Prueba de comunicación con backend al cargar la app
    (async function testBackendConnection() {
        try {
            const result = await apiClient.request('/health');
            console.log('Backend /api/health response:', result);
            appState.addNotification({
                message: result.success ? 'Backend conectado correctamente' : 'Backend responde pero con error',
                type: result.success ? 'success' : 'warning'
            });
        } catch (error) {
            console.error('Error comunicando con backend:', error);
            appState.addNotification({
                message: 'No se pudo conectar al backend',
                type: 'error'
            });
        }
    })();

    // Sidebar toggle behaviour (collapse/show)
    try {
        const toggleLeft = document.getElementById('toggleLeftPanelBtn');
        const menuPanel = document.getElementById('menuPanel');
        const layout = document.querySelector('.triple-layout');

        function isMobile() { return window.innerWidth <= 900; }

        if (toggleLeft && menuPanel && layout) {
            toggleLeft.addEventListener('click', (e) => {
                if (isMobile()) {
                    // overlay behavior
                    const open = menuPanel.classList.toggle('overlay-open');
                    document.body.classList.toggle('lock-scroll', open);
                    toggleLeft.setAttribute('aria-expanded', open ? 'true' : 'false');
                } else {
                    // desktop collapse: toggle class on layout
                    const hidden = layout.classList.toggle('hide-left');
                    // aria-expanded true means visible
                    toggleLeft.setAttribute('aria-expanded', hidden ? 'false' : 'true');
                }
            });

            // Close overlay with Escape on mobile
            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' && menuPanel.classList.contains('overlay-open')) {
                    menuPanel.classList.remove('overlay-open');
                    document.body.classList.remove('lock-scroll');
                    toggleLeft.setAttribute('aria-expanded', 'false');
                    toggleLeft.focus();
                }
            });

            // Close overlay when clicking outside (mobile)
            document.addEventListener('click', (ev) => {
                if (!isMobile()) return;
                if (menuPanel.classList.contains('overlay-open')) {
                    if (!menuPanel.contains(ev.target) && ev.target !== toggleLeft) {
                        menuPanel.classList.remove('overlay-open');
                        document.body.classList.remove('lock-scroll');
                        toggleLeft.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Ensure state reset on resize
            window.addEventListener('resize', () => {
                if (!isMobile()) {
                    // remove overlay state
                    if (menuPanel.classList.contains('overlay-open')) {
                        menuPanel.classList.remove('overlay-open');
                        document.body.classList.remove('lock-scroll');
                        toggleLeft.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    } catch (err) {
        console.error('Error setting up sidebar toggle:', err);
    }

    // Top info notice: dismiss (no persistence) — it will reappear on page refresh
    try {
        const infoNotice = document.getElementById('topInfoNotice');
        const dismissBtn = document.getElementById('dismissInfoBtn');
        if (infoNotice && dismissBtn) {
            // Hide when clicked; do NOT write to localStorage so refresh shows it again
            dismissBtn.addEventListener('click', () => {
                infoNotice.classList.add('hidden');
            });
        }
    } catch (err) { console.error('Info notice setup error', err); }

    // Feedback FAB and modal behavior
    try {
        const feedbackFab = document.getElementById('feedbackFab');
        const feedbackModal = document.getElementById('feedbackModal');
        const feedbackCloseBtn = document.getElementById('feedbackCloseBtn');
        const feedbackCancelBtn = document.getElementById('feedbackCancelBtn');
        const feedbackSendBtn = document.getElementById('feedbackSendBtn');
        const feedbackForm = document.getElementById('feedbackForm');

        function openFeedback() {
            if (!feedbackModal) return;
            feedbackModal.style.display = 'flex';
            feedbackModal.setAttribute('aria-hidden', 'false');
            const message = document.getElementById('feedbackMessage');
            if (message) message.focus();
        }
        function closeFeedback() {
            if (!feedbackModal) return;
            feedbackModal.style.display = 'none';
            feedbackModal.setAttribute('aria-hidden', 'true');
            feedbackFab.focus();
        }

        if (feedbackFab) feedbackFab.addEventListener('click', openFeedback);
        if (feedbackCloseBtn) feedbackCloseBtn.addEventListener('click', closeFeedback);
        if (feedbackCancelBtn) feedbackCancelBtn.addEventListener('click', closeFeedback);

        // Close on overlay click
        if (feedbackModal) {
            feedbackModal.addEventListener('click', (ev) => {
                if (ev.target === feedbackModal) closeFeedback();
            });
        }

        // ESC to close
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && feedbackModal && feedbackModal.style.display === 'flex') {
                closeFeedback();
            }
        });

        // Send feedback: attempt backend, fallback localStorage
        if (feedbackSendBtn && feedbackForm) {
            feedbackSendBtn.addEventListener('click', async () => {
                const name = document.getElementById('feedbackName').value.trim();
                const email = document.getElementById('feedbackEmail').value.trim();
                const type = document.getElementById('feedbackType').value;
                const message = document.getElementById('feedbackMessage').value.trim();
                if (!message) {
                    appState.addNotification({ message: 'Por favor escribe un mensaje antes de enviar', type: 'warning' });
                    return;
                }

                const payload = { name, email, type, message, timestamp: new Date().toISOString() };

                // Try backend
                try {
                    if (typeof apiClient !== 'undefined') {
                        const res = await apiClient.request('/contact', { method: 'POST', body: payload });
                        if (res && (res.success || res.status === 200 || res.ok)) {
                            appState.addNotification({ message: 'Gracias por tu mensaje. Lo hemos enviado correctamente.', type: 'success' });
                            closeFeedback();
                            return;
                        }
                    }
                } catch (err) {
                    // ignore and fallback
                    console.warn('Contact backend failed, falling back to local save', err);
                }

                // Fallback: save locally
                try {
                    const key = 'createopenapi:feedback_v1';
                    const raw = localStorage.getItem(key);
                    const list = raw ? JSON.parse(raw) : [];
                    list.unshift(payload);
                    localStorage.setItem(key, JSON.stringify(list));
                    appState.addNotification({ message: 'Mensaje guardado localmente. Gracias!', type: 'success' });
                    closeFeedback();
                } catch (err) {
                    console.error('Failed to save feedback locally', err);
                    appState.addNotification({ message: 'No se pudo enviar ni guardar el mensaje.', type: 'error' });
                }
            });
        }
    } catch (err) {
        console.error('Feedback UI error', err);
    }

    // Projects (Historial) - local storage persistence and UI
    try {
        const saveBtn = document.getElementById('saveProjectBtn');
        const importInput = document.getElementById('importProjectInput');
        const projectsListEl = document.getElementById('projectsList');
        const STORAGE_KEY = 'createopenapi:projects_v1';

        function readProjects() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) { return []; }
        }

        function writeProjects(list) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { console.error('Failed saving projects', e); }
        }

        function makeId() { return 'p_' + Math.random().toString(36).slice(2,9); }

        function nextAutoName(list) {
            const base = 'Proyecto';
            let i = 1;
            const names = new Set(list.map(p=>p.name));
            while (names.has(`${base} ${i}`)) i++;
            return `${base} ${i}`;
        }

        function renderProjects() {
            if (!projectsListEl) return;
            const list = readProjects();
            projectsListEl.innerHTML = '';
            if (list.length === 0) {
                projectsListEl.innerHTML = '<div class="menu-placeholder">No hay proyectos guardados.</div>';
                return;
            }
            list.forEach(project => {
                const item = document.createElement('div');
                item.className = 'project-item';
                item.dataset.id = project.id;

                item.innerHTML = `
                    <div class="project-meta">
                        <div class="project-name">${escapeHtml(project.name)}</div>
                        <div class="project-date">${new Date(project.updatedAt || project.createdAt).toLocaleString()}</div>
                    </div>
                    <div class="project-actions">
                            <button class="btn btn--ghost" data-action="load">Cargar</button>
                            <button class="btn btn--ghost" data-action="download">Descargar</button>
                            <button class="btn btn--ghost" data-action="rename">Renombrar</button>
                            <button class="btn btn--danger" data-action="delete">Borrar</button>
                        </div>
                `;

                projectsListEl.appendChild(item);
            });
        }
        // Hacer disponible globalmente para refresco desde otros lugares
        window.renderProjects = renderProjects;

        function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }

        async function saveCurrentProject() {
            const list = readProjects();
            let content = null;
            let type = 'curl';
            try {
                const spec = getCurrentSpec && getCurrentSpec();
                if (spec) {
                    // try to stringify YAML
                    if (typeof jsyaml !== 'undefined') {
                        content = jsyaml.dump(spec);
                        type = 'yaml';
                    } else {
                        content = JSON.stringify(spec, null, 2);
                        type = 'json';
                    }
                }
            } catch (e) { content = null; }
            if (!content) {
                const curlInput = document.getElementById('curlInput');
                content = curlInput ? curlInput.value : '';
                type = 'curl';
            }

            const id = makeId();
            const name = nextAutoName(list);
            const now = new Date().toISOString();
            const project = { id, name, content, type, createdAt: now, updatedAt: now };
            list.unshift(project);
            writeProjects(list);
            renderProjects();
            appState.addNotification({ message: `Proyecto guardado: ${name}`, type: 'success' });
        }

        function downloadProject(project) {
            try {
                const blob = new Blob([project.content], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = (project.name || 'project') + '.yaml';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(a.href);
            } catch (e) { appState.addNotification({ message: 'Error al descargar proyecto', type: 'error' }); }
        }

        async function loadProject(project) {
            try {
                if (project.type === 'yaml' || project.type === 'json') {
                    // try parse to object and update preview
                    if (project.type === 'yaml' && typeof jsyaml !== 'undefined') {
                        const obj = jsyaml.load(project.content);
                        updateOpenAPISpec(obj);
                        appState.setCurrentSpec(obj);
                        appState.addNotification({ message: `Proyecto cargado: ${project.name}`, type: 'success' });
                        return;
                    }
                    if (project.type === 'json') {
                        const obj = JSON.parse(project.content);
                        updateOpenAPISpec(obj);
                        appState.setCurrentSpec(obj);
                        appState.addNotification({ message: `Proyecto cargado: ${project.name}`, type: 'success' });
                        return;
                    }
                }
                // fallback: place content into curl input
                const curlInput = document.getElementById('curlInput');
                if (curlInput) {
                    curlInput.value = project.content;
                    appState.addNotification({ message: `Contenido cargado en entrada: ${project.name}`, type: 'success' });
                }
            } catch (e) {
                appState.addNotification({ message: 'Error cargando proyecto: ' + e.message, type: 'error' });
            }
        }

        // Delegated click on projects list
        if (projectsListEl) {
            projectsListEl.addEventListener('click', (ev) => {
                const btn = ev.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;
                const item = btn.closest('.project-item');
                const id = item && item.dataset.id;
                if (!id) return;
                const list = readProjects();
                const project = list.find(p=>p.id === id);
                if (!project) return;
                if (action === 'load') {
                    loadProject(project);
                } else if (action === 'download') {
                    downloadProject(project);
                } else if (action === 'delete') {
                    const ok = confirm('Borrar proyecto "' + project.name + '"?');
                    if (!ok) return;
                    const remaining = list.filter(p=>p.id !== id);
                    writeProjects(remaining);
                    renderProjects();
                    appState.addNotification({ message: 'Proyecto borrado', type: 'success' });
                } else if (action === 'rename') {
                    const newName = prompt('Nuevo nombre del proyecto', project.name || '');
                    if (newName && newName.trim().length>0) {
                        project.name = newName.trim();
                        project.updatedAt = new Date().toISOString();
                        writeProjects(list);
                        renderProjects();
                        appState.addNotification({ message: 'Nombre actualizado', type: 'success' });
                    }
                }
            });
        }

        // Save current
        if (saveBtn) saveBtn.addEventListener('click', saveCurrentProject);

        // Import file
        if (importInput) {
            importInput.addEventListener('change', (ev) => {
                const file = ev.target.files && ev.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    const text = e.target.result;
                    const list = readProjects();
                    const id = makeId();
                    const name = file.name || nextAutoName(list);
                    const now = new Date().toISOString();
                    // decide type
                    let type = 'yaml';
                    if (file.name && file.name.toLowerCase().endsWith('.json')) type = 'json';
                    const project = { id, name, content: text, type, createdAt: now, updatedAt: now };
                    list.unshift(project);
                    writeProjects(list);
                    renderProjects();
                    appState.addNotification({ message: 'Proyecto importado: ' + name, type: 'success' });
                };
                reader.readAsText(file);
                // reset value so same file can be imported again
                importInput.value = '';
            });
        }

        // initial render
        renderProjects();
    } catch (err) {
        console.error('Projects UI error', err);
    }

});

// ====== Menú tipo aplicación: lógica de submenús y acciones File simplificado ======
document.addEventListener('DOMContentLoaded', () => {
  // Menú tipo aplicación: abrir/cerrar submenús
  function closeAllAppMenus() {
    document.querySelectorAll('.app-menu-item.open').forEach(item => item.classList.remove('open'));
    document.querySelectorAll('.app-menu-btn[aria-expanded]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
    // Cerrar submenú de idioma
    const idiomaBtn = document.getElementById('menuIdiomaBtn');
    const idiomaSubmenu = document.getElementById('menuIdiomaSubmenu');
    if (idiomaBtn && idiomaSubmenu) {
      idiomaSubmenu.style.display = 'none';
      idiomaBtn.setAttribute('aria-expanded', 'false');
    }
  }
  document.querySelectorAll('.app-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const item = btn.closest('.app-menu-item');
      const isOpen = item.classList.contains('open');
      closeAllAppMenus();
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllAppMenus();
        btn.focus();
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.app-menu-item')) {
      closeAllAppMenus();
    }
  });

  // Submenú lateral de idioma: abrir/cerrar correctamente
  const idiomaBtn = document.getElementById('menuIdiomaBtn');
  const idiomaSubmenu = document.getElementById('menuIdiomaSubmenu');
  if (idiomaBtn && idiomaSubmenu) {
    function openIdiomaSubmenu() {
      idiomaSubmenu.style.display = 'block';
      idiomaBtn.setAttribute('aria-expanded', 'true');
    }
    function closeIdiomaSubmenu() {
      idiomaSubmenu.style.display = 'none';
      idiomaBtn.setAttribute('aria-expanded', 'false');
    }
    idiomaBtn.addEventListener('mouseenter', openIdiomaSubmenu);
    idiomaBtn.addEventListener('focus', openIdiomaSubmenu);
    idiomaBtn.parentElement.addEventListener('mouseleave', (e) => {
      if (!idiomaSubmenu.matches(':hover')) closeIdiomaSubmenu();
    });
    idiomaBtn.addEventListener('blur', () => {
      setTimeout(() => {
        if (!idiomaSubmenu.matches(':hover') && !idiomaBtn.matches(':focus')) {
          closeIdiomaSubmenu();
        }
      }, 120);
    });
    idiomaSubmenu.addEventListener('mouseenter', openIdiomaSubmenu);
    idiomaSubmenu.addEventListener('mouseleave', () => {
      if (!idiomaBtn.matches(':hover') && !idiomaBtn.matches(':focus')) closeIdiomaSubmenu();
    });
    // Selección de idioma
    idiomaSubmenu.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('button[data-lang]');
      if (!btn) return;
      const lang = btn.dataset.lang;
      if (!lang) return;
      await setLanguage(lang);
      appState.addNotification({ message: `Idioma cambiado a ${btn.textContent}`, type: 'success' });
      closeIdiomaSubmenu();
      closeAllAppMenus && closeAllAppMenus();
    });
  }

    // Función para cargar el diccionario y actualizar la UI
    async function setLanguage(lang) {
        let dict = {};
        try {
            dict = await fetch(`i18n/${lang}.json`).then(r => r.json());
        } catch (e) { dict = {}; }
        if (window.setAppDictionary) {
            window.setAppDictionary(dict, lang);
        } else if (window.i18n) {
            window.i18n.setDictionary(dict, lang);
        }
        // Actualizar textos visibles si hay función global
        if (window.updateUIText) window.updateUIText();
    }
});