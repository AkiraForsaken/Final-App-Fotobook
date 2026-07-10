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

export const authRouter = Router();

authRouter.post('/signup', validate(signupRequestSchema), authController.signup);

authRouter.post('/login', validate(loginRequestSchema), authController.login);

authRouter.post('/logout', authController.logout);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/verify-email', validate(verifyEmailRequestSchema), authController.verifyEmail);
authRouter.post(
	'/forgot-password',
	validate(forgotPasswordRequestSchema),
	authController.forgotPassword
);
authRouter.post(
	'/reset-password',
	validate(resetPasswordRequestSchema),
	authController.resetPassword
);
