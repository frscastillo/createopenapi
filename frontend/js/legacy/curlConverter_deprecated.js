// Legacy (deprecated) helpers extracted from js/curlConverter.js
// These functions are kept for backward compatibility and to ease the
// migration path. New code should use SchemaUtils and ValidationUtils
// directly. Exported so tests or existing callers can still import them.

import { SchemaUtils } from '../utils/schema.js';
import { ValidationUtils } from '../utils/validation.js';

export function extractSecuritySchemes(parameters) {
    console.warn('extractSecuritySchemes is deprecated; use SchemaUtils.extractSecuritySchemesFromHeaders');
    const headers = (parameters || []).filter(p => p.in === 'header');
    return SchemaUtils.extractSecuritySchemesFromHeaders(headers);
}

export function generateJsonSchema(data, title = '') {
    console.warn('generateJsonSchema is deprecated; use SchemaUtils.generateSchema');
    return SchemaUtils.generateSchema(data, title);
}

export function shouldHeaderBeRequired(headerName) {
    console.warn('shouldHeaderBeRequired is deprecated; use ValidationUtils.shouldHeaderBeRequired');
    return ValidationUtils.shouldHeaderBeRequired(headerName);
}

export function shouldQueryParamBeRequired(paramName) {
    console.warn('shouldQueryParamBeRequired is deprecated; use ValidationUtils.shouldQueryParamBeRequired');
    return ValidationUtils.shouldQueryParamBeRequired(paramName);
}

export function shouldFieldBeRequired(fieldName, value) {
    console.warn('shouldFieldBeRequired is deprecated; use ValidationUtils.shouldFieldBeRequired');
    return ValidationUtils.shouldFieldBeRequired(fieldName, value);
}

export function validateCurlCommand(curl) {
    console.warn('validateCurlCommand is deprecated; use ValidationUtils.validateCurlCommand');
    return ValidationUtils.validateCurlCommand(curl);
}
