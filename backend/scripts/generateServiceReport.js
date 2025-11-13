import fs from 'fs';
import path from 'path';
import url from 'url';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_KEYS = 'test-key';
process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.LOG_DIR = './logs-test';
process.env.SESSION_TTL_MINUTES = '5';
process.env.TOKEN_TTL_MINUTES = '5';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue}"`;
  }
  return stringValue;
}

function pushResult(results, entry) {
  results.push({
    Endpoint: entry.endpoint,
    Method: entry.method,
    Scenario: entry.scenario,
    Status: entry.status,
    Success: entry.success,
    ErrorCode: entry.errorCode ?? '',
    Notes: entry.notes ?? ''
  });
}

async function main() {
  const { default: app } = await import('../src/app.js');
  const agent = request.agent(app);
  const apiKey = 'test-key';
  const results = [];

  // Health check
  {
    const response = await agent.get('/api/health');
    pushResult(results, {
      endpoint: '/api/health',
      method: 'GET',
      scenario: 'Salud del servicio',
      status: response.status,
      success: response.body?.success,
      notes: `uptime=${response.body?.data?.uptime}`
    });
  }

  // Auth token success
  let token;
  {
    const response = await agent.post('/api/auth/token').set('x-api-key', apiKey);
    token = response.body?.data?.token;
    pushResult(results, {
      endpoint: '/api/auth/token',
      method: 'POST',
      scenario: 'Generar token',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: token ? `expiresAt=${response.body?.data?.expiresAt}` : 'token no emitido'
    });
  }

  // Auth token error (sin API key)
  {
    const response = await agent.post('/api/auth/token');
    pushResult(results, {
      endpoint: '/api/auth/token',
      method: 'POST',
      scenario: 'Falta API key',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.error?.message
    });
  }

  // Convert CURL success
  const curlPayload = {
    curl: 'curl "https://api.example.com/users?limit=5" -H "Authorization: Bearer token"',
    responses: [
      {
        code: '200',
        description: 'Listado de usuarios',
        body: {
          data: [{ id: 'user_1', name: 'Jane Doe' }]
        }
      }
    ]
  };

  if (!token) {
    throw new Error('No se pudo obtener token JWT. Aborta el informe.');
  }

  const authHeaders = {
    'x-api-key': apiKey,
    Authorization: `Bearer ${token}`
  };

  {
    const response = await agent.post('/api/convert/curl').set(authHeaders).send(curlPayload);
    pushResult(results, {
      endpoint: '/api/convert/curl',
      method: 'POST',
      scenario: 'Conversión CURL -> JSON',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.data ? `sizeBytes=${response.body.data.sizeBytes}` : response.body?.error?.message
    });
  }

  // Convert CURL error (falta body)
  {
    const response = await agent.post('/api/convert/curl').set(authHeaders).send({});
    pushResult(results, {
      endpoint: '/api/convert/curl',
      method: 'POST',
      scenario: 'Falta parámetro curl',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.error?.message
    });
  }

  // Convert CURL YAML
  {
    const response = await agent
      .post('/api/convert/curl/yaml')
      .set(authHeaders)
      .send(curlPayload);
    pushResult(results, {
      endpoint: '/api/convert/curl/yaml',
      method: 'POST',
      scenario: 'Conversión CURL -> YAML',
      status: response.status,
      success: response.status === 200,
      notes: response.text ? `longitud=${response.text.length}` : 'sin contenido'
    });
  }

  // Convert JSON success
  {
    const response = await agent
      .post('/api/convert/json')
      .set(authHeaders)
      .send({ json: { id: 1, name: 'Producto demo' } });
    pushResult(results, {
      endpoint: '/api/convert/json',
      method: 'POST',
      scenario: 'Conversión JSON -> Spec',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.data ? `sizeBytes=${response.body.data.sizeBytes}` : response.body?.error?.message
    });
  }

  // Convert JSON error (cadena inválida)
  {
    const response = await agent
      .post('/api/convert/json')
      .set(authHeaders)
      .send({ json: '{ invalid }' });
    pushResult(results, {
      endpoint: '/api/convert/json',
      method: 'POST',
      scenario: 'JSON inválido',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.error?.message
    });
  }

  // Validate CURL
  {
    const response = await agent
      .post('/api/validate/curl')
      .set(authHeaders)
      .send({ curl: 'curl https://api.example.com/users' });
    pushResult(results, {
      endpoint: '/api/validate/curl',
      method: 'POST',
      scenario: 'Validar CURL',
      status: response.status,
      success: response.body?.success,
      notes: response.body?.data?.warnings?.join('; ') || 'sin advertencias'
    });
  }

  // Validate CURL error (comando vacío)
  {
    const response = await agent
      .post('/api/validate/curl')
      .set(authHeaders)
      .send({ curl: '' });
    pushResult(results, {
      endpoint: '/api/validate/curl',
      method: 'POST',
      scenario: 'Curl vacío',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.data?.errors?.join('; ') || response.body?.error?.message
    });
  }

  // Validate JSON success
  {
    const response = await agent
      .post('/api/validate/json')
      .set(authHeaders)
      .send({ json: '{"name":"test"}' });
    pushResult(results, {
      endpoint: '/api/validate/json',
      method: 'POST',
      scenario: 'Validar JSON',
      status: response.status,
      success: response.body?.success,
      notes: response.body?.data ? 'JSON válido' : response.body?.error?.message
    });
  }

  // Validate JSON error
  {
    const response = await agent
      .post('/api/validate/json')
      .set(authHeaders)
      .send({ json: '{ invalid }' });
    pushResult(results, {
      endpoint: '/api/validate/json',
      method: 'POST',
      scenario: 'JSON inválido',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.error?.message
    });
  }

  // Validate spec success
  {
    const response = await agent
      .post('/api/validate/spec')
      .set(authHeaders)
      .send({
        spec: {
          openapi: '3.0.0',
          info: { title: 'Demo', version: '1.0.0' },
          paths: {}
        }
      });
    pushResult(results, {
      endpoint: '/api/validate/spec',
      method: 'POST',
      scenario: 'Spec válida',
      status: response.status,
      success: response.body?.success,
      notes: response.body?.data?.message
    });
  }

  // Validate spec error
  {
    const response = await agent
      .post('/api/validate/spec')
      .set(authHeaders)
      .send({ spec: { info: {} } });
    pushResult(results, {
      endpoint: '/api/validate/spec',
      method: 'POST',
      scenario: 'Spec inválida',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: Array.isArray(response.body?.error?.details)
        ? response.body.error.details.join('; ')
        : response.body?.error?.message
    });
  }

  // Examples defaults
  {
    const response = await agent.get('/api/examples/defaults').set(authHeaders);
    pushResult(results, {
      endpoint: '/api/examples/defaults',
      method: 'GET',
      scenario: 'Ejemplos por defecto',
      status: response.status,
      success: response.body?.success,
      notes: response.body?.data ? 'Incluye curl y responses' : response.body?.error?.message
    });
  }

  // Without token example
  {
    const response = await agent.post('/api/convert/json').set('x-api-key', apiKey).send({ json: {} });
    pushResult(results, {
      endpoint: '/api/convert/json',
      method: 'POST',
      scenario: 'Falta token Bearer',
      status: response.status,
      success: response.body?.success,
      errorCode: response.body?.error?.code,
      notes: response.body?.error?.message
    });
  }

  const headers = ['Endpoint', 'Method', 'Scenario', 'Status', 'Success', 'ErrorCode', 'Notes'];
  const csvRows = [headers.map(toCsvValue).join(',')];
  results.forEach((row) => {
    csvRows.push(headers.map((key) => toCsvValue(row[key])).join(','));
  });

  const reportDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const outputPath = path.join(reportDir, 'service_report.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');
  console.log(`Reporte generado en ${outputPath}`);
}

main().catch((error) => {
  console.error('Error al generar el informe:', error);
  process.exit(1);
});
