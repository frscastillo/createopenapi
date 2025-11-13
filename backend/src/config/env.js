import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = ['SESSION_SECRET', 'JWT_SECRET', 'API_KEYS'];
const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(
    `WARNING: Missing environment variables: ${missing.join(', ')}. ` +
      'Ensure they are set before running in production.'
  );
}

export const env = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKeys: (process.env.API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'unsafe-secret',
  sessionSecret: process.env.SESSION_SECRET || 'unsafe-session-secret',
  logDir: process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),
  sessionTTLMinutes: parseInt(process.env.SESSION_TTL_MINUTES, 10) || 60,
  tokenTTLMinutes: parseInt(process.env.TOKEN_TTL_MINUTES, 10) || 30,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};

export default env;
