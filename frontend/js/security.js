// Módulo de seguridad para validación y sanitización
export class SecurityValidator {
    
    // Sanitizar entrada de usuario
    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remover solo caracteres realmente peligrosos, mantener comillas y otros necesarios para CURL
        return input
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Scripts
            .replace(/javascript:/gi, '') // URLs javascript
            .replace(/vbscript:/gi, '') // URLs vbscript
            .replace(/on\w+\s*=/gi, '') // Event handlers como onclick=
            .slice(0, 10000); // Limitar longitud
    }
    
    // Validar comando CURL
    static validateCurlCommand(curl) {
        const result = {
            isValid: true,
            errors: [],
            sanitized: ''
        };
        
        try {
            // Sanitizar entrada
            const sanitized = this.sanitizeInput(curl);
            result.sanitized = sanitized;
            
            // Validaciones básicas
            if (!sanitized.trim()) {
                result.errors.push('CURL command cannot be empty');
                result.isValid = false;
                return result;
            }
            
            if (sanitized.length > 5000) {
                result.errors.push('CURL command too long (max 5000 characters)');
                result.isValid = false;
            }
            
            if (!sanitized.toLowerCase().startsWith('curl')) {
                result.errors.push('Must start with "curl"');
                result.isValid = false;
            }
            
            // Validar URL
            const urlMatch = sanitized.match(/["']([^"']+)["']/);
            if (urlMatch) {
                try {
                    const url = new URL(urlMatch[1]);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        result.errors.push('Only HTTP/HTTPS URLs allowed');
                        result.isValid = false;
                    }
                } catch (e) {
                    result.errors.push('Invalid URL format');
                    result.isValid = false;
                }
            } else {
                result.errors.push('Valid URL required');
                result.isValid = false;
            }
            
            // Verificar comandos peligrosos (solo los realmente peligrosos)
            const dangerousPatterns = [
                /rm\s+-rf/i,
                /sudo\s+/i,
                /passwd\s+/i,
                /\$\(/i, // Command substitution
                /`[^`]*`/i, // Backticks
                /eval\s*\(/i,
                /exec\s*\(/i,
                /<script/i // HTML script tags
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(sanitized)) {
                    result.errors.push('Potentially dangerous command detected');
                    result.isValid = false;
                    break;
                }
            }
            
        } catch (error) {
            result.errors.push('Validation error: ' + error.message);
            result.isValid = false;
        }
        
        return result;
    }
    
    // Validar JSON de respuesta
    static validateResponseJSON(jsonString) {
        try {
            if (!jsonString.trim()) return { isValid: true, parsed: {} };
            
            // Limitar tamaño
            if (jsonString.length > 100000) {
                return { isValid: false, error: 'JSON too large (max 100KB)' };
            }
            
            const parsed = JSON.parse(jsonString);
            
            // Verificar profundidad (prevenir DoS)
            if (this.getObjectDepth(parsed) > 20) {
                return { isValid: false, error: 'JSON too deeply nested (max 20 levels)' };
            }
            
            return { isValid: true, parsed };
            
        } catch (error) {
            return { isValid: false, error: 'Invalid JSON: ' + error.message };
        }
    }
    
    // Calcular profundidad de objeto
    static getObjectDepth(obj, depth = 1) {
        if (obj === null || typeof obj !== 'object') return depth;
        
        let maxDepth = depth;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const currentDepth = this.getObjectDepth(obj[key], depth + 1);
                maxDepth = Math.max(maxDepth, currentDepth);
            }
        }
        return maxDepth;
    }
    
    // Rate limiting simple (lado cliente)
    static checkRateLimit() {
        const now = Date.now();
        const lastRequests = JSON.parse(localStorage.getItem('apiRequests') || '[]');
        
        // Limpiar requests antiguos (últimos 5 minutos)
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        const recentRequests = lastRequests.filter(time => time > fiveMinutesAgo);
        
        // Máximo 30 requests por 5 minutos
        if (recentRequests.length >= 30) {
            return { allowed: false, error: 'Too many requests. Please wait a moment.' };
        }
        
        // Agregar request actual
        recentRequests.push(now);
        localStorage.setItem('apiRequests', JSON.stringify(recentRequests));
        
        return { allowed: true };
    }
}

export default SecurityValidator;