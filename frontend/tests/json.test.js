import { describe, expect, it } from 'vitest';
import { ValidationUtils } from '../js/utils/validation.js';

describe('Validación de JSON de respuestas', () => {
	it('acepta JSON válido', () => {
		const { isValid, parsed } = ValidationUtils.validateResponseJSON('{"ok":true}');
		expect(isValid).toBe(true);
		expect(parsed).toEqual({ ok: true });
	});

	it('reporta errores para JSON inválido', () => {
		const result = ValidationUtils.validateResponseJSON('{invalid');
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('JSON inválido');
	});
});
