import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set in environment variables`);
  }

  return value;
};

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number(process.env.PORT ?? 5000);
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
export const DATABASE_URL = requireEnv('DATABASE_URL');
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export const GITHUB_CLIENT_ID = requireEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = requireEnv('GITHUB_CLIENT_SECRET');
export const GITHUB_CALLBACK_URL = requireEnv('GITHUB_CALLBACK_URL');
export const GITHUB_TOKEN_ENCRYPTION_KEY =
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY ?? GITHUB_CLIENT_SECRET;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;

export const MAIL_ENABLED = process.env.MAIL_ENABLED === 'true';
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const MAIL_FROM = process.env.MAIL_FROM ?? SMTP_USER;
