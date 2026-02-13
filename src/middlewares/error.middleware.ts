import { ErrorRequestHandler } from 'express';
import { NODE_ENV } from '../config/env';
import logger from '../config/logger';
import { ApiError } from '../utils/ApiError';

const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  logger.error(message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export default errorMiddleware;
