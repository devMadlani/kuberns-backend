import { Router } from 'express';

import asyncHandler from '../../middlewares/asyncHandler';
import authMiddleware from '../../middlewares/auth.middleware';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const authRouter = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/verify-otp', asyncHandler(authController.verifyOtp));
authRouter.post('/resend-otp', asyncHandler(authController.resendOtp));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authMiddleware, asyncHandler(authController.me));

export default authRouter;
