import { curlToOpenAPI } from '../../src/services/curlConverter.js';

describe('curlToOpenAPI', () => {
  const curl = 'curl https://api.example.com/v1/users -H "Authorization: Bearer token"';

  test('generates OpenAPI spec with path and method', () => {
    const spec = curlToOpenAPI(curl);
    const pathKeys = Object.keys(spec.paths);
    expect(pathKeys).toContain('/v1/users');
    const getOperation = spec.paths['/v1/users'].get;
    expect(getOperation).toBeDefined();
    expect(getOperation.tags).toContain('V1');
  });

  test('rejects curl sin URL', () => {
    const invalidCurl = 'curl -X GET';
    expect(() => curlToOpenAPI(invalidCurl)).toThrow(/URL válida/);
  });
});
