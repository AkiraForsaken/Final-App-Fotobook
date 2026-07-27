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
import { strictRateLimit } from '../middlewares/rate-limit.js';

export const authRouter = Router();

authRouter.post('/signup', strictRateLimit, validate(signupRequestSchema), authController.signup);

authRouter.post('/login', strictRateLimit, validate(loginRequestSchema), authController.login);

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
