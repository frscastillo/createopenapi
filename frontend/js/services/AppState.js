// Sistema de estado centralizado con patrón Observer
import { CONSTANTS } from '../utils/constants.js';

export class AppState {
    constructor() {
        this.state = {
            // Estado de la aplicación
            currentSpec: null,
            curlCommand: '',
            responses: [],
            isLoading: false,
            isConverting: false,
            
            // Estado de UI
            activeTab: 'input',
            notifications: [],
            
            // Estado de configuración
            settings: {
                autoConvert: false,
                validateOnInput: true,
                theme: 'light'
            },
            
            // Historial
            history: [],
            historyIndex: -1
        };
        
        this.subscribers = new Set();
        this.middlewares = new Set();
        
        // Bind methods
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.subscribe = this.subscribe.bind(this);
    }

    /**
     * Obtiene el estado actual
     * @returns {object} - Estado completo
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Actualiza el estado y notifica a subscribers
     * @param {object} updates - Actualizaciones parciales del estado
     */
    setState(updates) {
        const previousState = { ...this.state };
        
        // Aplicar middlewares antes de actualizar
        let finalUpdates = updates;
        for (const middleware of this.middlewares) {
            finalUpdates = middleware(finalUpdates, previousState);
        }
        
        // Actualizar estado
        this.state = { ...this.state, ...finalUpdates };
        
        // Notificar subscribers
        this.notifySubscribers(previousState, this.state);
        
        // Log en desarrollo
        if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
            console.log('State updated:', { previous: previousState, current: this.state, updates });
        }
    }

    /**
     * Suscribe un callback a cambios de estado
     * @param {function} callback - Función a ejecutar en cambios
     * @returns {function} - Función para desuscribirse
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        
        // Retornar función de limpieza
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Notifica a todos los subscribers
     * @param {object} previousState - Estado anterior
     * @param {object} currentState - Estado actual
     */
    notifySubscribers(previousState, currentState) {
        this.subscribers.forEach(callback => {
            try {
                callback(currentState, previousState);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });
    }

    /**
     * Agrega middleware para interceptar cambios de estado
     * @param {function} middleware - Función middleware
     */
    addMiddleware(middleware) {
        this.middlewares.add(middleware);
    }

    /**
     * Métodos de conveniencia para operaciones comunes
     */

    /**
     * Actualiza el comando CURL
     * @param {string} curlCommand - Comando CURL
     */
    setCurlCommand(curlCommand) {
        this.setState({ curlCommand });
    }

    /**
     * Actualiza la especificación OpenAPI actual
     * @param {object} spec - Especificación OpenAPI
     */
    setCurrentSpec(spec) {
        this.setState({ currentSpec: spec });
        this.addToHistory(spec);
    }

    /**
     * Actualiza las respuestas
     * @param {Array} responses - Array de respuestas
     */
    setResponses(responses) {
        this.setState({ responses });
    }

    /**
     * Establece estado de loading
     * @param {boolean} isLoading - Estado de loading
     */
    setLoading(isLoading) {
        this.setState({ isLoading });
    }

    /**
     * Establece estado de conversión
     * @param {boolean} isConverting - Estado de conversión
     */
    setConverting(isConverting) {
        this.setState({ isConverting });
    }

    /**
     * Agrega notificación
     * @param {object} notification - Notificación {message, type, duration}
     */
    addNotification(notification) {
        const notifications = [...this.state.notifications];
        const id = Date.now() + Math.random();
        
        notifications.push({
            id,
            message: notification.message,
            type: notification.type || 'info',
            duration: notification.duration || CONSTANTS.TIMEOUTS.NOTIFICATION_DISMISS,
            timestamp: new Date().toISOString()
        });
        
        this.setState({ notifications });
        
        // Auto-remove después del duration
        if (notification.duration !== 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, notification.duration || CONSTANTS.TIMEOUTS.NOTIFICATION_DISMISS);
        }
        
        return id;
    }

    /**
     * Remueve notificación
     * @param {string|number} notificationId - ID de la notificación
     */
    removeNotification(notificationId) {
        const notifications = this.state.notifications.filter(n => n.id !== notificationId);
        this.setState({ notifications });
    }

    /**
     * Limpia todas las notificaciones
     */
    clearNotifications() {
        this.setState({ notifications: [] });
    }

    /**
     * Agrega al historial
     * @param {object} spec - Especificación OpenAPI
     */
    addToHistory(spec) {
        if (!spec) return;
        
        const history = [...this.state.history];
        
        // Evitar duplicados consecutivos
        if (history.length > 0 && JSON.stringify(history[history.length - 1]) === JSON.stringify(spec)) {
            return;
        }
        
        history.push({
            spec,
            timestamp: new Date().toISOString(),
            curlCommand: this.state.curlCommand
        });
        
        // Limitar tamaño del historial
        const maxHistory = 50;
        if (history.length > maxHistory) {
            history.splice(0, history.length - maxHistory);
        }
        
        this.setState({ 
            history,
            historyIndex: history.length - 1
        });
    }

    /**
     * Navega en el historial
     * @param {number} direction - -1 para atrás, 1 para adelante
     */
    navigateHistory(direction) {
        const newIndex = this.state.historyIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.state.history.length) {
            const historyItem = this.state.history[newIndex];
            this.setState({
                historyIndex: newIndex,
                currentSpec: historyItem.spec,
                curlCommand: historyItem.curlCommand
            });
        }
    }

    /**
     * Limpia el historial
     */
    clearHistory() {
        this.setState({ 
            history: [],
            historyIndex: -1
        });
    }

    /**
     * Actualiza configuración
     * @param {object} settingsUpdate - Actualizaciones de configuración
     */
    updateSettings(settingsUpdate) {
        const settings = { ...this.state.settings, ...settingsUpdate };
        this.setState({ settings });
        
        // Persistir en localStorage
        try {
            localStorage.setItem('createopenapi_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save settings to localStorage:', error);
        }
    }

    /**
     * Carga configuración desde localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('createopenapi_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.setState({ settings: { ...this.state.settings, ...settings } });
            }
        } catch (error) {
            console.warn('Could not load settings from localStorage:', error);
        }
    }

    /**
     * Reset completo del estado
     */
    reset() {
        this.setState({
            currentSpec: null,
            curlCommand: '',
            responses: [],
            isLoading: false,
            isConverting: false,
            notifications: []
        });
    }
}

// Crear instancia singleton
export const appState = new AppState();

// Cargar configuración al inicializar
appState.loadSettings();

export default appState;