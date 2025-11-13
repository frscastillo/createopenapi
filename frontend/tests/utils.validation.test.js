import { describe, expect, it } from 'vitest';
import { ValidationUtils } from '../js/utils/validation.js';

describe('ValidationUtils.shouldFieldBeRequired', () => {
  it('marca campos críticos como requeridos', () => {
    expect(ValidationUtils.shouldFieldBeRequired('userId', 123)).toBe(true);
  });

  it('no marca campos opcionales como requeridos', () => {
    expect(ValidationUtils.shouldFieldBeRequired('description', 'texto')).toBe(false);
  });

  it('omite campos vacíos', () => {
    expect(ValidationUtils.shouldFieldBeRequired('any', '')).toBe(false);
  });
});

describe('ValidationUtils.validateCurlCommand', () => {
  const curl = `curl -X POST "https://api.test.com/users" -H "Content-Type: application/json" -d '{"name":"John"}'`;

  it('acepta un comando válido', () => {
    const result = ValidationUtils.validateCurlCommand(curl);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detecta falta de URL', () => {
    const result = ValidationUtils.validateCurlCommand('curl -X GET');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((msg) => msg.includes('URL'))).toBe(true);
  });
});
