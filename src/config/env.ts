import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number(process.env.PORT ?? 5000);
export const DATABASE_URL = process.env.DATABASE_URL ?? '';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}
