// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { curlToOpenAPI } from '../js/curlConverter.js';

describe('curlToOpenAPI', () => {
  beforeEach(() => {
    // Limpiar el DOM de respuestas personalizadas antes de cada prueba
    document.body.innerHTML = '';
  });

  it('convierte un comando CURL simple', async () => {
    const command = `curl -X GET "https://api.ecommerce.com/v1/products?category=electronics" -H "Accept: application/json"`;
    const spec = await curlToOpenAPI(command);

    expect(spec.paths['/v1/products']).toBeDefined();
    const operation = spec.paths['/v1/products'].get;
    expect(operation.parameters.some((p) => p.name === 'category')).toBe(true);
    expect(operation.security).toBeUndefined();
  });

  it('detecta headers de seguridad y request body', async () => {
    const command = `curl -X POST "https://api.example.com/users" -H "Authorization: Bearer token" -H "Content-Type: application/json" -d '{"name":"Jane"}'`;

    const spec = await curlToOpenAPI(command);
    const operation = spec.paths['/users'].post;

    expect(operation.security?.length).toBeGreaterThan(0);
    expect(spec.components?.securitySchemes).toBeDefined();
    expect(operation.requestBody.required).toBe(true);
  });

  it('incluye respuestas personalizadas desde el DOM', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="response-item">
        <select class="status-code-select">
          <option value="200" selected>200</option>
        </select>
        <input class="response-description" value="Respuesta ok">
        <textarea class="response-body">{"message":"ok"}</textarea>
      </div>
    `;
    document.body.appendChild(container);

    const command = `curl -X GET "https://api.test.com/status"`;
    const spec = await curlToOpenAPI(command);
    const responses = spec.paths['/status'].get.responses;

    expect(responses['200']).toBeDefined();
    expect(responses['200'].content['application/json'].example).toEqual({ message: 'ok' });
  });
});
