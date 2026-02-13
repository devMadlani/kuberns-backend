import app from './app';
import { PORT } from './config/env';
import logger from './config/logger';
import { connectDB } from './config/prisma';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    logger.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

void startServer();
