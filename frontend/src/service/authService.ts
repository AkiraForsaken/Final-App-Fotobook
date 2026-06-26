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
			body: JSON.stringify(payload),
		}),
	signup: (payload: SignupPayload) =>
		request<AuthResponse>('/api/auth/signup', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
};
