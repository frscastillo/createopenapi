// Utilidades de validación centralizadas
import { CONSTANTS } from './constants.js';

export class ValidationUtils {
    
    /**
     * Determina si un campo debe ser requerido basado en criterios inteligentes
     * @param {string} fieldName - Nombre del campo
     * @param {any} value - Valor del campo
     * @returns {boolean} - true si debe ser requerido
     */
    static shouldFieldBeRequired(fieldName, value) {
        if (value === null || value === undefined || value === '') {
            return false;
        }

        const lowerFieldName = fieldName.toLowerCase();

        // Si está en la lista de opcionales, no es requerido
        if (CONSTANTS.VALIDATION.OPTIONAL_FIELDS.some(opt => 
            lowerFieldName.includes(opt))) {
            return false;
        }

        // Si está en la lista de requeridos, es requerido
        if (CONSTANTS.VALIDATION.REQUIRED_FIELDS.some(req => 
            lowerFieldName.includes(req))) {
            return true;
        }

        // Por defecto, considerar requerido si tiene valor no vacío
        return true;
    }

    /**
     * Determina si un header debe ser requerido
     * @param {string} headerName - Nombre del header
     * @returns {boolean} - true si debe ser requerido
     */
    static shouldHeaderBeRequired(headerName) {
        const lowerHeaderName = headerName.toLowerCase();

        // Si está en la lista de opcionales, no es requerido
        if (CONSTANTS.VALIDATION.OPTIONAL_HEADERS.some(opt => 
            lowerHeaderName === opt || lowerHeaderName.includes(opt))) {
            return false;
        }

        // Si está en la lista de requeridos, es requerido
        if (CONSTANTS.VALIDATION.REQUIRED_HEADERS.some(req => 
            lowerHeaderName === req || lowerHeaderName.includes(req))) {
            return true;
        }

        // Headers personalizados (x-*) suelen ser requeridos
        if (lowerHeaderName.startsWith('x-')) {
            return true;
        }

        // Por defecto, headers estándar son opcionales
        return false;
    }

    /**
     * Determina si un query parameter debe ser requerido
     * @param {string} paramName - Nombre del parámetro
     * @returns {boolean} - true si debe ser requerido
     */
    static shouldQueryParamBeRequired(paramName) {
        const lowerParamName = paramName.toLowerCase();

        // Si está en la lista de opcionales, no es requerido
        if (CONSTANTS.VALIDATION.OPTIONAL_PARAMS.some(opt => 
            lowerParamName === opt || lowerParamName.includes(opt))) {
            return false;
        }

        // Si está en la lista de requeridos, es requerido
        if (CONSTANTS.VALIDATION.REQUIRED_PARAMS.some(req => 
            lowerParamName === req || lowerParamName.includes(req))) {
            return true;
        }

        // Por defecto, los query params son opcionales
        return false;
    }

    /**
     * Valida un comando CURL básico
     * @param {string} curlCommand - Comando CURL a validar
     * @returns {object} - Resultado de validación con errores y warnings
     */
    static validateCurlCommand(curlCommand) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Verificar si comienza con curl
        if (!curlCommand.trim().toLowerCase().startsWith('curl')) {
            result.errors.push('El comando debe comenzar con "curl"');
        }

        // Verificar si tiene una URL
        if (!curlCommand.match(/["']https?:\/\/[^"']+["']/)) {
            result.errors.push('El comando debe incluir una URL válida (http:// o https://)');
        }

        // Verificar método HTTP
        const method = curlCommand.match(/-X\s+([A-Z]+)/i);
        if (!method) {
            result.warnings.push('No se especificó método HTTP, se usará GET por defecto');
        } else if (!CONSTANTS.HTTP_METHODS.includes(method[1].toUpperCase())) {
            result.errors.push(`Método HTTP no válido. Use: ${CONSTANTS.HTTP_METHODS.join(', ')}`);
        }

        // Verificar headers
        const contentTypeHeader = curlCommand.includes('Content-Type');
        if (!contentTypeHeader) {
            result.warnings.push('No se especificó Content-Type header');
        }

        // Verificar body en métodos POST/PUT/PATCH
        if (method && ['POST', 'PUT', 'PATCH'].includes(method[1].toUpperCase())) {
            if (!curlCommand.includes('-d')) {
                result.warnings.push(`Se detectó método ${method[1]} pero no se encontró body (-d)`);
            } else {
                // Verificar formato JSON del body
                const bodyMatch = curlCommand.match(/-d\s+['"]({[^}]+})["']/);
                if (bodyMatch) {
                    try {
                        JSON.parse(bodyMatch[1].replace(/\\"/g, '"'));
                    } catch (e) {
                        result.errors.push('El body no es un JSON válido');
                    }
                }
            }
        }

        // Validar URL completa
        const urlMatch = curlCommand.match(/["']([^"']+)["']/);
        if (urlMatch) {
            try {
                new URL(urlMatch[1]);
            } catch (e) {
                result.errors.push('URL inválida. Debe ser una URL completa (ejemplo: https://api.ejemplo.com/ruta)');
            }
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Valida formato de respuesta JSON
     * @param {string} jsonString - String JSON a validar
     * @returns {object} - Resultado con validación y objeto parseado
     */
    static validateResponseJSON(jsonString) {
        try {
            if (!jsonString.trim()) return { isValid: true, parsed: {} };
            
            // Limitar tamaño
            if (jsonString.length > CONSTANTS.LIMITS.MAX_JSON_SIZE) {
                return { 
                    isValid: false, 
                    error: `JSON demasiado grande (máx ${CONSTANTS.LIMITS.MAX_JSON_SIZE/1000}KB)` 
                };
            }
            
            const parsed = JSON.parse(jsonString);
            
            // Verificar profundidad (prevenir DoS)
            if (this.getObjectDepth(parsed) > CONSTANTS.LIMITS.MAX_OBJECT_DEPTH) {
                return { 
                    isValid: false, 
                    error: `JSON demasiado anidado (máx ${CONSTANTS.LIMITS.MAX_OBJECT_DEPTH} niveles)` 
                };
            }
            
            return { isValid: true, parsed };
            
        } catch (error) {
            return { isValid: false, error: 'JSON inválido: ' + error.message };
        }
    }

    /**
     * Calcula profundidad de objeto para prevenir DoS
     * @param {object} obj - Objeto a evaluar
     * @param {number} depth - Profundidad actual
     * @returns {number} - Profundidad máxima
     */
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

    /**
     * Valida método HTTP
     * @param {string} method - Método HTTP
     * @returns {boolean} - true si es válido
     */
    static isValidHttpMethod(method) {
        return CONSTANTS.HTTP_METHODS.includes(method.toUpperCase());
    }

    /**
     * Valida código de estado HTTP
     * @param {string|number} statusCode - Código de estado
     * @returns {boolean} - true si es válido
     */
    static isValidStatusCode(statusCode) {
        const code = parseInt(statusCode);
        return code >= 100 && code <= 599;
    }
}

export default ValidationUtils;