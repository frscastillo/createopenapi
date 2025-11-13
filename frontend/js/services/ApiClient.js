// Cliente HTTP para consumir el backend createopenapi
import { CONSTANTS } from '../utils/constants.js';

export class ApiClient {
    constructor({ baseURL, apiKey }) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(path, { method = 'GET', body = null, headers = {} } = {}) {
        const url = `${this.baseURL}${path}`;
        // Log the outgoing call to the persistent service calls panel (if present)
        // Respect the global debug flag to avoid duplicate logs.
        try {
            const debugEnabled = (typeof window !== 'undefined') && (
                (window.DEBUG_SERVICE_LOGS === true) || (CONSTANTS && CONSTANTS.DEBUG && CONSTANTS.DEBUG.SERVICE_LOGS)
            );
            if (debugEnabled && typeof document !== 'undefined') {
                const list = document.getElementById('serviceCallsList');
                if (list) {
                    const ts = new Date().toISOString();
                    const entry = document.createElement('div');
                    entry.className = 'service-call-entry';
                    entry.setAttribute('data-path', path);
                    entry.style.padding = '4px 0';
                    entry.style.borderBottom = '1px dashed #eee';
                    entry.innerText = `${ts} → ${method.toUpperCase()} ${path} (request)`;
                    list.appendChild(entry);
                    // keep scroll at bottom
                    list.scrollTop = list.scrollHeight;
                }
            }
        } catch (e) {
            // ignore DOM errors when running in non-browser contexts
        }
        const allHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            ...headers
        };
        if (this.token) {
            allHeaders['Authorization'] = `Bearer ${this.token}`;
        }
        const opts = {
            method,
            headers: allHeaders,
            credentials: 'include'
        };
        if (body) opts.body = JSON.stringify(body);
        let res;
        try {
            res = await fetch(url, opts);
        } catch (fetchErr) {
            try {
                if (typeof document !== 'undefined') {
                    const list = document.getElementById('serviceCallsList');
                    if (list) {
                        const ts = new Date().toISOString();
                        const entry = document.createElement('div');
                        entry.className = 'service-call-entry service-call-error';
                        entry.style.color = '#b21f2d';
                        entry.style.padding = '4px 0';
                        entry.innerText = `${ts} ✖ ${method.toUpperCase()} ${path} (network error: ${fetchErr.message})`;
                        list.appendChild(entry);
                        list.scrollTop = list.scrollHeight;
                    }
                }
            } catch (e) {}
            throw fetchErr;
        }
        const contentType = res.headers.get('content-type') || '';
        try {
            const debugEnabled = (typeof window !== 'undefined') && (
                (window.DEBUG_SERVICE_LOGS === true) || (CONSTANTS && CONSTANTS.DEBUG && CONSTANTS.DEBUG.SERVICE_LOGS)
            );
            if (debugEnabled && typeof document !== 'undefined') {
                const list = document.getElementById('serviceCallsList');
                if (list) {
                    const ts = new Date().toISOString();
                    const statusEntry = document.createElement('div');
                    statusEntry.className = 'service-call-entry service-call-status';
                    statusEntry.style.padding = '4px 0';
                    statusEntry.style.color = res.ok ? '#006400' : '#b21f2d';
                    statusEntry.innerText = `${ts} ← ${method.toUpperCase()} ${path} (status: ${res.status})`;
                    list.appendChild(statusEntry);
                    list.scrollTop = list.scrollHeight;
                }
            }
        } catch (e) {}
        if (contentType.includes('application/json')) {
            return await res.json();
        } else {
            return await res.text(); // Para YAML u otros formatos
        }
    }
}

export const apiClient = new ApiClient({
    baseURL: 'http://localhost:4000/api',
    apiKey: 'frontend-app-key-1'
});
