import { z } from 'zod';
import { userSchema } from './user.js';

export const loginRequestSchema = z.object({
	email: z.email(),
	password: z.string().min(1).max(64),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const signupRequestSchema = z.object({
	firstName: z.string().min(1).max(25),
	lastName: z.string().min(1).max(25),
	email: z.email().max(255),
	password: z.string().min(1).max(64),
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
	newPassword: z.string().min(1).max(64),
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
	currentPassword: z.string().min(1),
	newPassword: z.string().min(1).max(64),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
