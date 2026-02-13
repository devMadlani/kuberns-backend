import { createLogger, format, transports } from 'winston';
import { NODE_ENV } from './env';

const isDevelopment = NODE_ENV === 'development';

const loggerFormat = format.combine(
  format.timestamp(),
  isDevelopment ? format.colorize({ all: true }) : format.uncolorize(),
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`),
);

const logger = createLogger({
  level: isDevelopment ? 'info' : 'warn',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
  },
  format: loggerFormat,
  transports: [new transports.Console()],
});

export default logger;
