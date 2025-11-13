import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yaml';
import { transform } from '../../js/transform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, '../fixtures');

const CASES = [
  '01-get-con-query',
  '02-post-con-body',
  '03-put-con-path-param',
  '04-patch-form-data',
  '05-delete-simple',
  '06-get-con-filtros',
  '07-post-con-body-bulk',
  '08-put-con-path-compuesto',
  '09-patch-form-data-avatar',
  '10-delete-con-headers',
  '11-head-sin-responses',
  '12-options-muchos-headers'
];

const UNSUPPORTED_CASES = [
  '13-trace-custom-auth',
  '14-connect-large-body'
];

describe('transform(curl, responses)', () => {
  it.each(CASES)('genera OpenAPI válido para %s', async (caseId) => {
    const caseDir = path.join(fixturesDir, caseId);

    const curlText = await fs.readFile(path.join(caseDir, 'curl.txt'), 'utf8');
    const responses = JSON.parse(
      await fs.readFile(path.join(caseDir, 'responses.json'), 'utf8')
    );
    const expected = JSON.parse(
      await fs.readFile(path.join(caseDir, 'expected.json'), 'utf8')
    );

    const yamlOutput = transform(curlText, responses);

    // Snapshot del YAML generado
    expect(yamlOutput).toMatchSnapshot(`case-${caseId}`);

    // Parseo YAML y validación estructural
    const document = YAML.parse(yamlOutput);
    await SwaggerParser.validate(document);

    // Validar path y método
    expect(document.paths).toHaveProperty(expected.path);
    const operation = document.paths[expected.path][expected.method];
    expect(operation).toBeDefined();

    // Validar parámetros por tipo
    if (expected.parameters) {
      const paramsByType = groupParamsByIn(operation.parameters || []);
      if (expected.parameters.query) {
        expected.parameters.query.forEach((name) => {
          expect(paramsByType.query).toContain(name);
        });
      }
      if (expected.parameters.path) {
        expected.parameters.path.forEach((name) => {
          expect(paramsByType.path).toContain(name);
        });
      }
      if (expected.parameters.header) {
        expected.parameters.header.forEach((name) => {
          expect(paramsByType.header).toContain(name);
        });
      }
    }

    // Validar requestBody y content-type
    if (expected.requestBodyContentType) {
      expect(operation.requestBody).toBeDefined();
      const contentTypes = Object.keys(operation.requestBody.content || {});
      expect(contentTypes).toContain(expected.requestBodyContentType);

      if (expected.multipart) {
        const schema =
          operation.requestBody.content[expected.requestBodyContentType].schema;
        const multipartFields = Object.keys(schema.properties || {});
        expected.multipart.text?.forEach((field) => {
          expect(multipartFields).toContain(field);
          expect(schema.properties[field].type).toBe('string');
          expect(schema.properties[field].format).toBeUndefined();
        });
        expected.multipart.binary?.forEach((field) => {
          expect(multipartFields).toContain(field);
          expect(schema.properties[field].format).toBe('binary');
        });
      }
    }

    // Validar códigos de respuesta
    const responseCodes = Object.keys(operation.responses || {});
    expected.responses.forEach((code) => {
      expect(responseCodes).toContain(code);
    });

    // Validar esquemas de seguridad esperados
    if (expected.securitySchemes) {
      const schemes = Object.keys(document.components?.securitySchemes || {});
      expected.securitySchemes.forEach((scheme) => {
        expect(schemes).toContain(scheme);
      });
    }
  });
});

it.each(UNSUPPORTED_CASES)('rechaza métodos no soportados para %s', async (caseId) => {
  const caseDir = path.join(fixturesDir, caseId);

  const curlText = await fs.readFile(path.join(caseDir, 'curl.txt'), 'utf8');
  const responses = JSON.parse(
    await fs.readFile(path.join(caseDir, 'responses.json'), 'utf8')
  );

  await expect(async () => {
    transform(curlText, responses);
  }).rejects.toThrow(/método http no válido/i);
});

function groupParamsByIn(parameters) {
  return parameters.reduce(
    (acc, param) => {
      const location = param.in;
      acc[location] = acc[location] || [];
      acc[location].push(param.name);
      return acc;
    },
    { query: [], header: [], path: [] }
  );
}
