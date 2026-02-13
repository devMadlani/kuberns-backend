import jwt, { SignOptions } from 'jsonwebtoken';

import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env';

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

export const signAccessToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
};

export const AUTH_COOKIE_NAME = ACCESS_TOKEN_COOKIE_NAME;
