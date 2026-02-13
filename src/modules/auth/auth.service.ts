import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { NODE_ENV } from '../../config/env';
import logger from '../../config/logger';
import { ApiError } from '../../utils/ApiError';
import { AuthTokenPayload, signAccessToken } from '../../utils/jwt';

import { AuthRepository } from './auth.repository';

const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .transform((value) => value.toLowerCase()),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const resendOtpSchema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .transform((value) => value.toLowerCase()),
});

type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
};

type RegisterResponse = {
  email: string;
  otpRequired: boolean;
  otpPreview?: string;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async register(rawBody: unknown): Promise<RegisterResponse> {
    const { email, password } = registerSchema.parse(rawBody);

    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser?.email && existingUser.emailVerified) {
      throw new ApiError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser?.email && !existingUser.emailVerified) {
      await this.authRepository.updatePendingUser({
        email,
        password: hashedPassword,
        emailOtpHash: hashedOtp,
        emailOtpExpiry: otpExpiry,
      });
    } else {
      await this.authRepository.createUser({
        email,
        password: hashedPassword,
        emailOtpHash: hashedOtp,
        emailOtpExpiry: otpExpiry,
      });
    }

    logger.info(`OTP for ${email}: ${otp}`);

    return {
      email,
      otpRequired: true,
      ...(NODE_ENV === 'development' ? { otpPreview: otp } : {}),
    };
  }

  public async login(rawBody: unknown): Promise<AuthResponse> {
    const { email, password } = loginSchema.parse(rawBody);

    const user = await this.authRepository.findByEmail(email);

    if (!user?.password || !user.email) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ApiError(403, 'Email is not verified. Please verify OTP first.');
    }

    const accessToken = this.createAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
    };
  }

  public async getMe(userId: string): Promise<{ id: string; email: string }> {
    const user = await this.authRepository.findById(userId);

    if (!user?.email) {
      throw new ApiError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  public async verifyOtp(rawBody: unknown): Promise<AuthResponse> {
    const { email, otp } = otpSchema.parse(rawBody);
    const user = await this.authRepository.findByEmail(email);

    if (!user?.email || !user.password || !user.emailOtpHash || !user.emailOtpExpiry) {
      throw new ApiError(400, 'Invalid verification request');
    }

    if (user.emailVerified) {
      throw new ApiError(409, 'Email already verified');
    }

    if (user.emailOtpExpiry.getTime() < Date.now()) {
      throw new ApiError(400, 'OTP has expired');
    }

    const otpHash = this.hashOtp(otp);

    if (otpHash !== user.emailOtpHash) {
      throw new ApiError(400, 'Invalid OTP');
    }

    const updatedUser = await this.authRepository.markEmailVerified(user.id);

    if (!updatedUser.email) {
      throw new ApiError(500, 'Unable to verify user');
    }

    const accessToken = this.createAccessToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
      },
      accessToken,
    };
  }

  public async resendOtp(rawBody: unknown): Promise<{ message: string; otpPreview?: string }> {
    const { email } = resendOtpSchema.parse(rawBody);
    const user = await this.authRepository.findByEmail(email);

    if (!user?.email) {
      throw new ApiError(404, 'User not found');
    }

    if (user.emailVerified) {
      throw new ApiError(409, 'Email already verified');
    }

    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.authRepository.updateOtp(email, hashedOtp, otpExpiry);
    logger.info(`OTP for ${email}: ${otp}`);

    return {
      message: 'OTP resent successfully',
      ...(NODE_ENV === 'development' ? { otpPreview: otp } : {}),
    };
  }

  private createAccessToken(payload: AuthTokenPayload): string {
    return signAccessToken(payload);
  }

  private generateOtp(): string {
    return String(crypto.randomInt(100000, 1000000));
  }

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }
}
