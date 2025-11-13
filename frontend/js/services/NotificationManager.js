// Sistema de notificaciones UI integrado con AppState
import { appState } from './AppState.js';
import { CONSTANTS } from '../utils/constants.js';

export class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
        this.subscribeToState();
    }

    init() {
        // Crear contenedor de notificaciones si no existe
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
            
            // Agregar estilos CSS si no existen
            this.addStyles();
        }
    }

    subscribeToState() {
        appState.subscribe((state, previousState) => {
            // Detectar nuevas notificaciones
            const newNotifications = state.notifications.filter(notification => 
                !previousState.notifications.some(prev => prev.id === notification.id)
            );
            
            newNotifications.forEach(notification => {
                this.showNotification(notification);
            });
            
            // Detectar notificaciones eliminadas
            const removedNotifications = previousState.notifications.filter(notification => 
                !state.notifications.some(current => current.id === notification.id)
            );
            
            removedNotifications.forEach(notification => {
                this.hideNotification(notification.id);
            });
        });
    }

    showNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('data-notification-id', notification.id);
        
        element.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Agregar evento de click para cerrar
        element.querySelector('.notification-close').addEventListener('click', () => {
            appState.removeNotification(notification.id);
        });
        
        // Animación de entrada
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        this.container.appendChild(element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    hideNotification(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    }

    addStyles() {
        const styleId = 'notification-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .notifications-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }
            
            .notification {
                background: white;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                overflow: hidden;
                pointer-events: auto;
                transition: all 0.3s ease;
                border-left: 4px solid #ccc;
            }
            
            .notification-success {
                border-left-color: var(--success-color, #2f855a);
            }
            
            .notification-error {
                border-left-color: var(--danger-color, #c53030);
            }
            
            .notification-warning {
                border-left-color: #f6ad55;
            }
            
            .notification-info {
                border-left-color: var(--secondary-color, #3182ce);
            }
            
            .notification-content {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .notification-message {
                flex: 1;
                color: var(--text-primary, #2d3748);
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #a0aec0;
                cursor: pointer;
                font-size: 18px;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background-color: #f7fafc;
                color: #4a5568;
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new NotificationManager();
});

export default NotificationManager;