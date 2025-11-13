import { describe, expect, it } from 'vitest';
import { SchemaUtils } from '../js/utils/schema.js';

const sampleObject = {
  id: '123',
  name: 'Producto',
  price: 10.5,
  createdAt: '2023-01-01T00:00:00Z'
};

describe('SchemaUtils.generateSchema', () => {
  it('genera schema para objetos con campos requeridos', () => {
    const schema = SchemaUtils.generateSchema(sampleObject);
    expect(schema.type).toBe('object');
    expect(schema.required).toContain('id');
    expect(schema.properties.name.type).toBe('string');
  });

  it('genera schema para arreglos', () => {
    const schema = SchemaUtils.generateSchema([sampleObject]);
    expect(schema.type).toBe('array');
    expect(schema.items.type).toBe('object');
  });
});

describe('SchemaUtils.processOpenAPISpec', () => {
  it('normaliza el spec y asegura versión 3.0', () => {
    const spec = SchemaUtils.processOpenAPISpec({
      info: { title: 'Test' },
      paths: {
        '/users': {
          get: {
            responses: {
              200: { description: 'ok' }
            }
          }
        }
      }
    });

    expect(spec.openapi).toBe('3.0.0');
    expect(spec.paths['/users'].get.responses['200']).toBeDefined();
  });
});
