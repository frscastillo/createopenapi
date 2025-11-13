import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import FileStoreFactory from 'session-file-store';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import swaggerSpec from './docs/openapi.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { httpsGuard } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './lib/logger.js';

const FileStore = FileStoreFactory(session);

const sessionDir = path.resolve(env.logDir, '../sessions');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

export const app = express();

if (env.nodeEnv !== 'test') {
  app.enable('trust proxy');
}

const allowList = env.allowedOrigins.length > 0 ? env.allowedOrigins : undefined;

app.use(helmet());
app.use(
  cors({
    origin: allowList || true,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(requestLogger);

app.use(
  session({
    store: new FileStore({
      path: sessionDir,
      retries: 0
    }),
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv !== 'development',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: env.sessionTTLMinutes * 60 * 1000
    }
  })
);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'createopenapi backend listo.'
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/openapi.json', (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use('/api', httpsGuard, apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado.'
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
});

app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', { error });
});

export default app;
