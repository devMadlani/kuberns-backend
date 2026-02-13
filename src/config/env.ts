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

export const GITHUB_CLIENT_ID = requireEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = requireEnv('GITHUB_CLIENT_SECRET');
export const GITHUB_CALLBACK_URL = requireEnv('GITHUB_CALLBACK_URL');
export const GITHUB_TOKEN_ENCRYPTION_KEY =
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY ?? GITHUB_CLIENT_SECRET;
