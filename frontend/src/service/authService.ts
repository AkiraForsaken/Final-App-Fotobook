import { request } from './api.ts';
import type { User } from '../types/index.ts';

interface LoginPayload {
	email: string;
	password: string;
}

interface SignupPayload {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

interface AuthResponse {
	user: User;
}

export const authService = {
	login: (payload: LoginPayload) =>
		request<AuthResponse>('/api/auth/login', {
			method: 'POST',
			body: payload,
		}),
	signup: (payload: SignupPayload) =>
		request<AuthResponse>('/api/auth/signup', {
			method: 'POST',
			body: payload,
		}),
	logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
	refresh: () => request<void>('/api/auth/refresh', { method: 'POST' }),
	verifyEmail: (payload: { token: string }) =>
		request<{ message: string }>('/api/auth/verify-email', { method: 'POST', body: payload }),
	forgotPassword: (payload: { email: string }) =>
		request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: payload }),
	resetPassword: (payload: { token: string; newPassword: string }) =>
		request<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: payload }),
	resendVerification: () =>
		request<{ message: string }>('/api/auth/resend-verification', { method: 'POST' }),
};
