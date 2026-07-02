import { request } from './api.ts';
import type { User } from '../types/index.ts';

// TODO: Swap to formdata body (to include the avatar file) once the real
// upload endpoint exists.
export interface UpdateProfilePayload {
	firstName: string;
	lastName: string;
	email: string;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}

export const userService = {
	updateProfile: (userId: number, payload: UpdateProfilePayload) =>
		request<User>(`/api/users/${userId}`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),

	changePassword: (userId: number, payload: ChangePasswordPayload) =>
		request<void>(`/api/users/${userId}/password`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
};
