import { z } from 'zod';
import { userSchema } from './user.js';

const passwordSchema = z
	.string()
	.min(10, 'Password must be at least 10 characters')
	.max(64, 'Password must be at most 64 characters')
	.refine(
		(pw) => {
			const commonPasswords = new Set([
				'password123',
				'1234567890',
				'qwerty12345',
				'admin12345',
				'letmein12345',
				'welcome1234',
				'monket12345',
				'football123',
			]);
			return !commonPasswords.has(pw.toLowerCase());
		},
		{
			message: 'Password is too common. Please choose a more secure password.',
		}
	);

export const loginRequestSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const signupRequestSchema = z.object({
	firstName: z.string().min(1).max(25),
	lastName: z.string().min(1).max(25),
	email: z.email().max(255),
	password: passwordSchema,
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const verifyEmailRequestSchema = z.object({
	token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
	email: z.email().max(255),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
	token: z.string().min(1),
	newPassword: passwordSchema,
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const authResponseSchema = z.object({
	user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// Body for PUT /api/users/:id
export const updateUserRequestSchema = z.object({
	firstName: z.string().min(1).max(25),
	lastName: z.string().min(1).max(25),
	email: z.email().max(255),
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

// Body for POST /api/users/:id/password
export const changePasswordRequestSchema = z.object({
	currentPassword: passwordSchema,
	newPassword: passwordSchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const adminResetPasswordRequestSchema = z.object({
	newPassword: passwordSchema,
});
export type AdminResetPasswordRequest = z.infer<typeof adminResetPasswordRequestSchema>;
