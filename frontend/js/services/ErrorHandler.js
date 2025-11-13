// Sistema unificado de manejo de errores
import { CONSTANTS } from '../utils/constants.js';
import { appState } from './AppState.js';

export class ErrorHandler {
    
    /**
     * Maneja errores de forma centralizada
     * @param {Error|string} error - Error a manejar
     * @param {string} context - Contexto donde ocurrió el error
     * @param {object} options - Opciones adicionales
     */
    static handle(error, context = '', options = {}) {
        const errorInfo = this.parseError(error);
        
        // Log estructurado
        this.logError(errorInfo, context, options);
        
        // Mostrar notificación al usuario
        if (!options.silent) {
            this.showUserNotification(errorInfo, context);
        }
        
        // Reportar error si está configurado
        if (options.report !== false) {
            this.reportError(errorInfo, context);
        }
        
        return errorInfo;
    }

    /**
     * Parsea error para extraer información útil
     * @param {Error|string} error - Error original
     * @returns {object} - Información estructurada del error
     */
    static parseError(error) {
        if (typeof error === 'string') {
            return {
                message: error,
                type: 'UserError',
                stack: null,
                timestamp: new Date().toISOString()
            };
        }
        
        if (error instanceof Error) {
            return {
                message: error.message,
                type: error.constructor.name,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                code: error.code || null
            };
        }
        
        return {
            message: 'Unknown error occurred',
            type: 'UnknownError',
            stack: null,
            timestamp: new Date().toISOString(),
            originalError: error
        };
    }

    /**
     * Log estructurado de errores
     * @param {object} errorInfo - Información del error
     * @param {string} context - Contexto
     * @param {object} options - Opciones
     */
    static logError(errorInfo, context, options) {
        const logEntry = {
            level: 'error',
            context,
            timestamp: errorInfo.timestamp,
            error: {
                message: errorInfo.message,
                type: errorInfo.type,
                code: errorInfo.code,
                stack: errorInfo.stack
            },
            userAgent: navigator.userAgent,
            url: window.location.href,
            state: options.includeState ? appState.getState() : null
        };
        
        // Console log con formato
        console.error(`[${context}] Error:`, logEntry);
        
        // Guardar en sessionStorage para debugging
        try {
            const errorLog = JSON.parse(sessionStorage.getItem('errorLog') || '[]');
            errorLog.push(logEntry);
            
            // Mantener solo los últimos 20 errores
            if (errorLog.length > 20) {
                errorLog.splice(0, errorLog.length - 20);
            }
            
            sessionStorage.setItem('errorLog', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('Could not save error to sessionStorage:', e);
        }
    }

    /**
     * Muestra notificación amigable al usuario
     * @param {object} errorInfo - Información del error
     * @param {string} context - Contexto
     */
    static showUserNotification(errorInfo, context) {
        const userMessage = this.getUserFriendlyMessage(errorInfo, context);
        
        appState.addNotification({
            message: userMessage,
            type: 'error',
            duration: this.getNotificationDuration(errorInfo.type)
        });
    }

    /**
     * Convierte errores técnicos en mensajes amigables
     * @param {object} errorInfo - Información del error
     * @param {string} context - Contexto
     * @returns {string} - Mensaje amigable
     */
    static getUserFriendlyMessage(errorInfo, context) {
        const message = errorInfo.message.toLowerCase();
        
        // Errores específicos del contexto
        if (context === 'curl-conversion') {
            if (message.includes('invalid json')) {
                return 'El JSON en el comando CURL no es válido. Verifique la sintaxis.';
            }
            if (message.includes('invalid url')) {
                return 'La URL en el comando CURL no es válida. Use una URL completa (https://...).';
            }
            if (message.includes('method not found')) {
                return 'No se pudo detectar el método HTTP. Use -X GET, -X POST, etc.';
            }
            return 'Error al convertir comando CURL. Verifique la sintaxis.';
        }
        
        if (context === 'yaml-export') {
            if (message.includes('no spec')) {
                return 'No hay especificación OpenAPI para exportar. Convierta un comando CURL primero.';
            }
            return 'Error al exportar YAML. Inténtelo de nuevo.';
        }
        
        if (context === 'response-validation') {
            if (message.includes('json')) {
                return 'El JSON de respuesta no es válido. Verifique la sintaxis.';
            }
            return 'Error en la validación de respuesta.';
        }
        
        // Errores de red
        if (message.includes('network') || message.includes('fetch')) {
            return 'Error de conexión. Verifique su conexión a internet.';
        }
        
        // Errores de permisos
        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'Sin permisos para realizar esta acción.';
        }
        
        // Error genérico más amigable
        return errorInfo.message || 'Ha ocurrido un error inesperado. Inténtelo de nuevo.';
    }

    /**
     * Determina duración de notificación basada en tipo de error
     * @param {string} errorType - Tipo de error
     * @returns {number} - Duración en ms
     */
    static getNotificationDuration(errorType) {
        switch (errorType) {
            case 'ValidationError':
            case 'UserError':
                return 5000; // 5 segundos para errores de usuario
            case 'NetworkError':
                return 7000; // 7 segundos para errores de red
            case 'CriticalError':
                return 0; // Permanente hasta que usuario cierre
            default:
                return CONSTANTS.TIMEOUTS.NOTIFICATION_DISMISS;
        }
    }

    /**
     * Reporta error a servicio de monitoreo (si está configurado)
     * @param {object} errorInfo - Información del error
     * @param {string} context - Contexto
     */
    static reportError(errorInfo, context) {
        // Solo reportar en producción y errores serios
        if (window.location.hostname === 'localhost' || 
            errorInfo.type === 'UserError' ||
            errorInfo.type === 'ValidationError') {
            return;
        }
        
        try {
            // Ejemplo de integración con servicio de monitoreo
            if (window.analytics && typeof window.analytics.track === 'function') {
                window.analytics.track('error', {
                    context,
                    errorType: errorInfo.type,
                    errorMessage: errorInfo.message,
                    timestamp: errorInfo.timestamp,
                    url: window.location.href,
                    userAgent: navigator.userAgent
                });
            }
            
            // Ejemplo de envío a API propia (comentado)
            /*
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: errorInfo,
                    context,
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                })
            }).catch(() => {}); // Silenciar errores de reporte
            */
        } catch (reportError) {
            console.warn('Could not report error:', reportError);
        }
    }

    /**
     * Maneja errores específicos de validación
     * @param {Array} validationErrors - Array de errores de validación
     * @param {string} context - Contexto
     */
    static handleValidationErrors(validationErrors, context = 'validation') {
        if (!Array.isArray(validationErrors) || validationErrors.length === 0) {
            return;
        }
        
        const messages = validationErrors.map(error => 
            typeof error === 'string' ? error : error.message
        ).join('\n');
        
        this.handle(new Error(messages), context, { 
            report: false // No reportar errores de validación
        });
    }

    /**
     * Wrapper para promesas que maneja errores automáticamente
     * @param {Promise} promise - Promesa a manejar
     * @param {string} context - Contexto
     * @param {object} options - Opciones
     * @returns {Promise} - Promesa que nunca hace reject
     */
    static async handlePromise(promise, context, options = {}) {
        try {
            return await promise;
        } catch (error) {
            this.handle(error, context, options);
            return null; // Retornar null en caso de error
        }
    }

    /**
     * Obtiene log de errores para debugging
     * @returns {Array} - Array de errores del sessionStorage
     */
    static getErrorLog() {
        try {
            return JSON.parse(sessionStorage.getItem('errorLog') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Limpia log de errores
     */
    static clearErrorLog() {
        try {
            sessionStorage.removeItem('errorLog');
        } catch (e) {
            console.warn('Could not clear error log:', e);
        }
    }
}

// Manejador global de errores no capturados
window.addEventListener('error', (event) => {
    ErrorHandler.handle(event.error || event.message, 'global-error', {
        includeState: true
    });
});

// Manejador global de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(event.reason, 'unhandled-promise', {
        includeState: true
    });
});

export default ErrorHandler;