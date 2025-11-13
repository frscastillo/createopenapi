import { describe, it, expect } from 'vitest';
import { curlToOpenAPI } from '../../js/curlConverter.js';

describe('curlToOpenAPI (unit) — pure parsing behaviour', () => {
    it('parses simple GET and includes response 200', () => {
        const curl = `curl "https://api.example.com/users/123?verbose=true" -X GET -H 'Accept: application/json'`;
        const overrides = [{ code: '200', description: 'OK', body: { id: 123, name: 'Alice' } }];
        const spec = curlToOpenAPI(curl, overrides);
        expect(spec).toBeTruthy();
        const path = '/users/123';
        expect(spec.paths[path]).toBeTruthy();
        const op = spec.paths[path].get || spec.paths[path].GET || spec.paths[path].get;
        expect(op).toBeTruthy();
        expect(op.responses['200']).toBeTruthy();
        expect(op.responses['200'].content['application/json'].example).toEqual({ id: 123, name: 'Alice' });
    });

    it('parses POST with JSON body and multipart fallback', () => {
        const curl = `curl "https://api.example.com/items" -X POST -H 'Content-Type: application/json' -d '{"name":"item1","qty":2}'`;
        const overrides = [{ code: '201', description: 'Created', body: { id: 'abc' } }];
        const spec = curlToOpenAPI(curl, overrides);
        expect(spec).toBeTruthy();
        const path = '/items';
        const op = spec.paths[path].post || spec.paths[path].POST;
        expect(op).toBeTruthy();
        expect(op.requestBody).toBeTruthy();
        expect(op.responses['201']).toBeTruthy();
    });

    it('supports multiple responses and preserves codes', () => {
        const curl = `curl "https://api.example.com/auth" -X POST -H 'Content-Type: application/json' -d '{"user":"u","pass":"p"}'`;
        const overrides = [
            { code: '200', description: 'OK', body: { token: 'x' } },
            { code: '401', description: 'Unauthorized', body: { error: 'unauthorized' } }
        ];
        const spec = curlToOpenAPI(curl, overrides);
        const path = '/auth';
        const op = spec.paths[path].post || spec.paths[path].POST;
        expect(op.responses['200']).toBeTruthy();
        expect(op.responses['401']).toBeTruthy();
    });

    it('detects path placeholders and query params', () => {
        const curl = `curl "https://api.example.com/items/{itemId}?q=test&page=2" -X GET`;
        const overrides = [{ code: '200', description: 'OK', body: { result: [] } }];
        const spec = curlToOpenAPI(curl, overrides);
        // path should contain {itemId}
        const paths = Object.keys(spec.paths || {});
        const matching = paths.find(p => p.includes('{itemId}'));
        expect(matching).toBeTruthy();
        const op = spec.paths[matching].get || spec.paths[matching].GET;
        expect(op.parameters.some(p => p.in === 'query' && p.name === 'q')).toBeTruthy();
    });
});
