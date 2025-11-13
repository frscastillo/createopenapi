// Simple i18n loader and manager

const I18N_PATH = './i18n/';
let translations = {};
let currentLang = 'en-US';

function detectLanguage() {
    const navLang = navigator.language || navigator.userLanguage;
    if (navLang.startsWith('en')) return 'en-US';
    if (navLang.startsWith('es')) return 'es-AR';
    if (navLang.startsWith('pt')) return 'pt-BR';
    return 'en-US';
}

async function loadTranslations(lang) {
    try {
        const res = await fetch(`${I18N_PATH}${lang}.json`);
        translations = await res.json();
        // Ensure a minimal set of keys exist so UI always shows readable text.
        const defaults = {
            app_title: 'CreateOpenAPI — CURL to OpenAPI',
            app_description: 'Transform CURL commands into OpenAPI documentation compatible with Swagger UI. Add multiple responses and generate documentation automatically.',
            main_description: 'Transform CURL commands into OpenAPI documentation compatible with Swagger UI. Add multiple responses and generate documentation automatically.',
            edit_api_doc: 'Edit API Documentation',
            edit_metadata: '✏️ Edit',
            save_changes: 'Save Changes',
            cancel: 'Cancel',
            home: 'Home',
            convert_button: 'Generate YAML',
            responses_title: 'API Responses',
            responses_description: 'Define the different responses that your endpoint can return',
            add_response: 'Add Response',
            download_yaml: 'Download YAML',
            openapi_preview_title: 'OpenAPI Preview',
            api_information: 'API Information',
            endpoint_details: 'Endpoint Details',
            query_parameters: 'Query Parameters',
            request_body: 'Request Body',
            request_body_description: 'Description/Notes:',
            response_notes: 'Response Notes',
            api_title: 'API Title',
            api_description: 'API Description',
            category_tag: 'Category/Tag:',
            endpoint_summary: 'Summary:',
            endpoint_description: 'Description:',
            language: 'Language',
            close_modal: 'Close'
        };
        Object.keys(defaults).forEach(k => { if (typeof translations[k] === 'undefined') translations[k] = defaults[k]; });
        currentLang = lang;
        applyTranslations();
    } catch (e) {
        console.error('Error loading translations:', e);
    }
}

function t(key) {
    return translations[key] || key;
}

function applyTranslations() {
    // Navegación y branding
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        // Only set brand text when a non-empty translation exists.
        const brandText = translations['app_title'];
        if (typeof brandText === 'string' && brandText.trim() !== '') {
            navBrand.textContent = brandText;
        } else {
            // keep empty to avoid rendering the key name 'app_title'
            navBrand.textContent = '';
        }
    }
    const navLink = document.querySelector('.nav-link.active');
    if (navLink) navLink.textContent = t('home');
    // Página / top info notice
    // Use app_description or main_description as fallback
    const topInfo = document.getElementById('topInfoNotice');
    const topTextEl = topInfo && topInfo.querySelector('.info-notice-text');
    if (topTextEl) {
        const desc = translations['app_description'] || translations['main_description'] || '';
        topTextEl.textContent = desc || 'Transform CURL commands into OpenAPI documentation compatible with Swagger UI. Add multiple responses and generate documentation automatically.';
    }
    // document title (branding)
    try {
        const title = translations['app_title'] || translations['home'] || document.title;
        if (title) document.title = title;
    } catch (e) {}
    // Panel de entrada CURL
    const convertBtn = document.getElementById('convertCurlBtn');
    if (convertBtn) convertBtn.textContent = t('convert_button');
    const curlInputTitle = document.querySelector('.input-panel h2');
    if (curlInputTitle) curlInputTitle.textContent = t('curl_input_title');
    const curlInput = document.getElementById('curlInput');
    if (curlInput) curlInput.placeholder = t('curl_input_placeholder');
    // Respuestas
    const responsesTitle = document.querySelector('.responses-header h3');
    if (responsesTitle) responsesTitle.textContent = t('responses_title');
    const responsesDesc = document.querySelector('.responses-description');
    if (responsesDesc) responsesDesc.textContent = t('responses_description');
    const addResponseBtn = document.getElementById('addResponseBtn');
    if (addResponseBtn) addResponseBtn.textContent = t('add_response');
    // Panel de salida OpenAPI
    const downloadBtn = document.getElementById('downloadYamlBtn');
    if (downloadBtn) downloadBtn.textContent = t('download_yaml');
    const openapiPreviewTitle = document.querySelector('.output-panel h2');
    if (openapiPreviewTitle) openapiPreviewTitle.textContent = t('openapi_preview_title');
    // Keep potential SVG icon inside the button; update only the label span if present
    const editMetadataBtn = document.getElementById('editMetadataBtn');
    if (editMetadataBtn) {
        const span = editMetadataBtn.querySelector('span');
        if (span) span.textContent = t('edit_metadata');
        else editMetadataBtn.textContent = t('edit_metadata');
    }
    // Modal de metadatos
    const modalHeader = document.querySelector('.modal-header h3');
    if (modalHeader) modalHeader.textContent = t('edit_api_doc');
    const saveMetadataBtn = document.getElementById('saveMetadataChanges');
    if (saveMetadataBtn) saveMetadataBtn.textContent = t('save_changes');
    const cancelMetadataBtn = document.getElementById('cancelMetadataEdit');
    if (cancelMetadataBtn) cancelMetadataBtn.textContent = t('cancel');
    const languageLabel = document.getElementById('languageLabel');
    if (languageLabel) languageLabel.textContent = t('language') + ':';
    // Top notice dismiss button
    const dismissInfoBtn = document.getElementById('dismissInfoBtn');
    if (dismissInfoBtn) dismissInfoBtn.textContent = t('close_modal') || t('cancel');
    // Modal: API Information
    const apiInfoTitle = document.querySelector('.metadata-section[aria-label="API Information"] h4');
    if (apiInfoTitle) apiInfoTitle.textContent = t('api_information');
    const apiTitleLabel = document.querySelector('label[for="apiTitle"]');
    if (apiTitleLabel) apiTitleLabel.textContent = t('api_title');
    const apiTitleInput = document.getElementById('apiTitle');
    if (apiTitleInput) apiTitleInput.placeholder = t('api_title');
    const apiDescLabel = document.querySelector('label[for="apiDescription"]');
    if (apiDescLabel) apiDescLabel.textContent = t('endpoint_description');
    const apiDescInput = document.getElementById('apiDescription');
    if (apiDescInput) apiDescInput.placeholder = t('api_description');
    // Modal: Endpoint Details
    const endpointDetailsTitle = document.querySelector('.metadata-section[aria-label="Endpoint Details"] h4');
    if (endpointDetailsTitle) endpointDetailsTitle.textContent = t('endpoint_details');
    const endpointTagLabel = document.querySelector('label[for="endpointTag"]');
    if (endpointTagLabel) endpointTagLabel.textContent = t('category_tag');
    const endpointTagInput = document.getElementById('endpointTag');
    if (endpointTagInput) endpointTagInput.placeholder = t('category_tag');
    const endpointSummaryLabel = document.querySelector('label[for="endpointSummary"]');
    if (endpointSummaryLabel) endpointSummaryLabel.textContent = t('endpoint_summary');
    const endpointSummaryInput = document.getElementById('endpointSummary');
    if (endpointSummaryInput) endpointSummaryInput.placeholder = t('endpoint_summary');
    const endpointDescLabel = document.querySelector('label[for="endpointDescription"]');
    if (endpointDescLabel) endpointDescLabel.textContent = t('endpoint_description');
    const endpointDescInput = document.getElementById('endpointDescription');
    if (endpointDescInput) endpointDescInput.placeholder = t('endpoint_description');
    // Modal: Query Parameters
    const queryParamsTitle = document.querySelector('.metadata-section[aria-label="Query Parameters"] h4');
    if (queryParamsTitle) queryParamsTitle.textContent = t('query_parameters');
    // Modal: Request Body
    const requestBodyTitle = document.querySelector('.metadata-section[aria-label="Request body"] h4');
    if (requestBodyTitle) requestBodyTitle.textContent = t('request_body');
    const requestBodyDescLabel = document.querySelector('label[for="requestBodyDescription"]');
    if (requestBodyDescLabel) requestBodyDescLabel.textContent = t('request_body_description');
    const requestBodyDescInput = document.getElementById('requestBodyDescription');
    if (requestBodyDescInput) requestBodyDescInput.placeholder = t('request_body_description');
    // Modal: Response Notes
    const responseNotesTitle = document.querySelector('.metadata-section[aria-label="Response Notes"] h4');
    if (responseNotesTitle) responseNotesTitle.textContent = t('response_notes');
    // Generic: fill any element with data-i18n attribute using the translation key
    document.querySelectorAll('[data-i18n]').forEach(el => {
        try {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        } catch (e) {
            // ignore individual failures to avoid breaking the rest of translations
        }
    });
    // No modificar los textos del selector, se mantienen los del HTML
}

window.addEventListener('DOMContentLoaded', () => {
    // Eliminar lógica de selector de idioma eliminado y setear inglés por defecto
    // Map selector values to regional language codes
    // (ya no se usa, pero se deja por si se requiere en el futuro)
    // function mapSelectorToLang(val) {
    //     if (val === 'default') return null;
    //     if (val === 'es') return 'es-AR';
    //     if (val === 'pt') return 'pt-BR';
    //     return 'en-US';
    // }

    // Por defecto, cargar español (Argentina) para mostrar la versión en español
    loadTranslations('es-AR');
});

export { t, loadTranslations, currentLang };
