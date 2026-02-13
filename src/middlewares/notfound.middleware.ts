import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const notFoundMiddleware = (_req: Request, _res: Response, _next: NextFunction): void => {
  throw new ApiError(404, 'Route not found');
};

export default notFoundMiddleware;
