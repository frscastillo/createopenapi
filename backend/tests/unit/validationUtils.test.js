import { ValidationUtils } from '../../src/utils/validation.js';

describe('ValidationUtils', () => {
  test('validateCurlCommand detects invalid command', () => {
    const result = ValidationUtils.validateCurlCommand('GET https://api.example.com');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('El comando debe comenzar con "curl".');
  });

  test('validateCurlCommand accepts valid curl', () => {
    const curl = 'curl https://api.example.com/resource -H "Accept: application/json"';
    const result = ValidationUtils.validateCurlCommand(curl);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateResponseJSON returns error for invalid JSON', () => {
    const result = ValidationUtils.validateResponseJSON('{ invalid }');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/JSON inválido/);
  });

  test('validateResponseJSON parses valid JSON', () => {
    const json = '{"name":"test"}';
    const result = ValidationUtils.validateResponseJSON(json);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test' });
  });
});
