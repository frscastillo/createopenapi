import SwaggerParser from '@apidevtools/swagger-parser';
import { ValidationUtils } from '../utils/validation.js';

/**
 * Valida comandos CURL y devuelve detalles útiles.
 * @param {string} curlCommand Comando CURL a validar.
 * @returns {{isValid:boolean,errors:string[],warnings:string[]}}
 */
export function validateCurl(curlCommand) {
  return ValidationUtils.validateCurlCommand(curlCommand);
}

/**
 * Valida JSON de respuesta.
 * @param {string} jsonString Cadena JSON.
 * @returns {{isValid:boolean,parsed?:object,error?:string}}
 */
export function validateJsonString(jsonString) {
  return ValidationUtils.validateResponseJSON(jsonString);
}

/**
 * Valida especificaciones OpenAPI utilizando swagger-parser.
 * @param {object} spec Especificación a validar.
 * @returns {Promise<{isValid:boolean, errors?:string[]}>}
 */
export async function validateOpenApi(spec) {
  try {
    await SwaggerParser.validate(spec);
    return { isValid: true };
  } catch (error) {
    const errors = error.details ? error.details.map((detail) => detail.message) : [error.message];
    return { isValid: false, errors };
  }
}

export default { validateCurl, validateJsonString, validateOpenApi };
