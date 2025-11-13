import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_KEYS = 'test-key';
process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.LOG_DIR = './logs-test';
process.env.SESSION_TTL_MINUTES = '5';
process.env.TOKEN_TTL_MINUTES = '5';

async function ensure200(agent, method, url, headers = {}, body) {
  let req = agent[method.toLowerCase()](url);
  Object.entries(headers).forEach(([key, value]) => {
    req = req.set(key, value);
  });
  if (body !== undefined) {
    req = req.send(body);
  }
  const response = await req;
  return {
    method: method.toUpperCase(),
    url,
    status: response.status,
    success: response.body?.success ?? (response.status === 200),
    note: response.body?.error?.message || response.body?.data?.message || 'OK'
  };
}

async function main() {
  const { default: app } = await import('../src/app.js');
  const agent = request.agent(app);
  const apiKey = 'test-key';

  const results = [];

  // health
  results.push(await ensure200(agent, 'get', '/api/health'));

  // token
  const tokenResponse = await agent.post('/api/auth/token').set('x-api-key', apiKey);
  results.push({
    method: 'POST',
    url: '/api/auth/token',
    status: tokenResponse.status,
    success: tokenResponse.body?.success,
    note: tokenResponse.body?.success ? 'Token emitido correctamente' : tokenResponse.body?.error?.message
  });

  const token = tokenResponse.body?.data?.token;

  if (!token) {
    throw new Error('No se pudo obtener token JWT.');
  }

  const authHeaders = {
    'x-api-key': apiKey,
    Authorization: `Bearer ${token}`
  };

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

  results.push(await ensure200(agent, 'post', '/api/convert/curl', authHeaders, curlPayload));
  results.push(await ensure200(agent, 'post', '/api/convert/curl/yaml', authHeaders, curlPayload));
  results.push(
    await ensure200(agent, 'post', '/api/convert/json', authHeaders, {
      json: { id: 'abc123', name: 'Producto demo', price: 9.99 }
    })
  );

  results.push(
    await ensure200(agent, 'post', '/api/validate/curl', authHeaders, {
      curl: 'curl -X GET "https://api.example.com/orders/123" -H "Authorization: Bearer token"'
    })
  );

  results.push(
    await ensure200(agent, 'post', '/api/validate/json', authHeaders, {
      json: '{"id":1,"name":"Test"}'
    })
  );

  results.push(
    await ensure200(agent, 'post', '/api/validate/spec', authHeaders, {
      spec: {
        openapi: '3.0.0',
        info: { title: 'Demo', version: '1.0.0' },
        paths: {
          '/orders': {
            get: {
              responses: {
                '200': {
                  description: 'ok'
                }
              }
            }
          }
        }
      }
    })
  );

  results.push(await ensure200(agent, 'get', '/api/examples/defaults', authHeaders));

  console.table(results, ['method', 'url', 'status', 'success', 'note']);
}

main().catch((error) => {
  console.error('Error validando servicios:', error);
  process.exit(1);
});
