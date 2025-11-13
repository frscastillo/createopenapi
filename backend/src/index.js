import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const server = http.createServer(app);

server.listen(env.port, () => {
  logger.info('server_started', {
    port: env.port,
    nodeEnv: env.nodeEnv
  });
});

export default server;
