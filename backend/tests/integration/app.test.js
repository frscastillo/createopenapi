import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_KEYS = 'test-key';
process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.LOG_DIR = './logs-test';
process.env.SESSION_TTL_MINUTES = '5';
process.env.TOKEN_TTL_MINUTES = '5';

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../src/app.js'));
});

describe('API integration', () => {
  test('health check responde ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('flujo de autenticación y conversión', async () => {
    const agent = request.agent(app);

    const tokenRes = await agent.post('/api/auth/token').set('x-api-key', 'test-key');
    expect(tokenRes.status).toBe(200);
    const token = tokenRes.body.data.token;
    expect(token).toBeDefined();

    const curl = 'curl https://api.example.com/users -H "Authorization: Bearer token"';
    const convertRes = await agent
      .post('/api/convert/curl')
      .set('x-api-key', 'test-key')
      .set('Authorization', `Bearer ${token}`)
      .send({ curl });

    expect(convertRes.status).toBe(200);
    expect(convertRes.body.success).toBe(true);
    expect(convertRes.body.data.spec).toBeDefined();
  });
});
