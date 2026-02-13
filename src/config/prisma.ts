import { PrismaClient } from '@prisma/client';
import { DATABASE_URL } from './env';
import logger from './logger';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error';
    logger.error(`Database connection failed: ${message}`);
    process.exit(1);
  }
};

export default prisma;
