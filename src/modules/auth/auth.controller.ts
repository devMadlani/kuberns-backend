import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { buildAuthCookieOptions } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import { AUTH_COOKIE_NAME } from '../../utils/jwt';

import { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Registered successfully. Verify OTP sent to email.',
        data: result,
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie(AUTH_COOKIE_NAME, result.accessToken, buildAuthCookieOptions());
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await this.authService.getMe(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Authenticated user fetched successfully',
      data: {
        user,
      },
    });
  };

  public verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.verifyOtp(req.body);

      res.cookie(AUTH_COOKIE_NAME, result.accessToken, buildAuthCookieOptions());
      res.status(200).json({
        success: true,
        message: 'Email verified and logged in successfully',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public resendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.resendOtp(req.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          ...(result.otpPreview ? { otpPreview: result.otpPreview } : {}),
        },
      });
    } catch (error) {
      this.throwMappedError(error);
    }
  };

  public logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(AUTH_COOKIE_NAME, buildAuthCookieOptions());
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  };

  private throwMappedError(error: unknown): never {
    if (error instanceof ZodError) {
      const issueMessage = error.issues[0]?.message ?? 'Validation error';
      throw new ApiError(400, issueMessage);
    }

    throw error;
  }
}
