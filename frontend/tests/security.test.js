import { describe, expect, it } from 'vitest';
import { SecurityValidator } from '../js/security.js';

describe('SecurityValidator.sanitizeInput', () => {
  it('remueve etiquetas script peligrosas', () => {
    const sanitized = SecurityValidator.sanitizeInput('<script>alert(1)</script>curl');
    expect(sanitized.includes('<script')).toBe(false);
  });
});

describe('SecurityValidator.validateCurlCommand', () => {
  it('identifica comandos peligrosos', () => {
    const result = SecurityValidator.validateCurlCommand('curl -X GET "http://example.com" && rm -rf /');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((msg) => msg.includes('dangerous'))).toBe(true);
  });

  it('acepta comandos limpios', () => {
    const result = SecurityValidator.validateCurlCommand('curl "https://safe.com"');
    expect(result.isValid).toBe(true);
  });
});
