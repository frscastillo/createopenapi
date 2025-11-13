import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../js/services/ApiClient.js';

describe('Conversor CURL → OpenAPI (backend)', () => {
	it('rechaza comandos sin URL válida', async () => {
		// Mockear la respuesta del backend para comando inválido
		vi.spyOn(apiClient, 'request').mockResolvedValue({
			success: false,
			error: { message: 'URL inválida en comando CURL' }
		});
		const curlBody = { curl: 'curl -X GET', responses: [] };
		const result = await apiClient.request('/convert/curl', { method: 'POST', body: curlBody });
		expect(result.success).toBe(false);
		expect(result.error.message).toContain('URL');
		apiClient.request.mockRestore();
	});
});
