import { Request, Response, NextFunction } from 'express';

import { NODE_ENV } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { AUTH_COOKIE_NAME, verifyAccessToken } from '../utils/jwt';

const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export default authMiddleware;
