import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
	loginRequestSchema,
	signupRequestSchema,
	verifyEmailRequestSchema,
	forgotPasswordRequestSchema,
	resetPasswordRequestSchema,
} from '../schemas/auth.js';
import * as authController from '../controllers/auth.controller.js';
import { authRateLimit, strictRateLimit } from '../middlewares/rate-limit.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/signup', authRateLimit, validate(signupRequestSchema), authController.signup);

authRouter.post('/login', authRateLimit, validate(loginRequestSchema), authController.login);

authRouter.post('/logout', authController.logout);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/verify-email', validate(verifyEmailRequestSchema), authController.verifyEmail);
authRouter.post(
	'/forgot-password',
	strictRateLimit,
	validate(forgotPasswordRequestSchema),
	authController.forgotPassword
);
authRouter.post(
	'/reset-password',
	strictRateLimit,
	validate(resetPasswordRequestSchema),
	authController.resetPassword
);
authRouter.post('/resend-verification', requireAuth, authController.resendVerification);
