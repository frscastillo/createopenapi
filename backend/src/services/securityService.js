import crypto from 'crypto';
import { ValidationUtils } from '../utils/validation.js';

/**
 * Sanitiza entradas de texto removiendo patrones peligrosos.
 * @param {string} input Texto a sanitizar.
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=\s*/gi, '')
    .slice(0, 10000);
}

/**
 * Valida y sanitiza un comando CURL.
 * @param {string} curlCommand Comando.
 * @returns {{isValid:boolean, sanitized:string, errors:string[]}}
 */
export function secureCurlValidation(curlCommand) {
  const sanitized = sanitizeInput(curlCommand);
  const result = ValidationUtils.validateCurlCommand(sanitized);
  return {
    ...result,
    sanitized
  };
}

/**
 * Genera un identificador de correlación criptográficamente seguro.
 * @returns {string}
 */
export function generateCorrelationId() {
  return crypto.randomUUID();
}

export default { sanitizeInput, secureCurlValidation, generateCorrelationId };
