import { describe, it, expect } from 'vitest';
import { jsonToOpenAPI } from '../../js/jsonConverter.js';

describe('jsonConverter (legacy shim) basic', () => {
  it('converts simple JSON to an OpenAPI spec with /example', () => {
    const input = JSON.stringify({ id: '123', name: 'Alice' });
    const spec = jsonToOpenAPI(input);
    expect(spec).toBeTruthy();
    expect(spec.paths).toBeTruthy();
    expect(spec.paths['/example']).toBeTruthy();
    const getOp = spec.paths['/example'].get;
    expect(getOp).toBeTruthy();
    const res200 = getOp.responses['200'];
    expect(res200).toBeTruthy();
    const content = res200.content['application/json'];
    expect(content).toBeTruthy();
    const schema = content.schema;
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeTruthy();
    expect(schema.properties.id).toBeTruthy();
    expect(schema.properties.name).toBeTruthy();
  });
});
