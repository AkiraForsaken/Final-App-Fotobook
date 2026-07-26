import { request } from './api.ts';
import type { User, Photo, Album, AdminUserSummary } from '../types/index.ts';
import type { PagedResult } from '../hooks/useOffsetPagination.ts';

export interface AdminUpdateUserPayload {
	firstName: string;
	lastName: string;
	email: string;
	avatarFile?: File | null;
}

function toAdminUpdateUserFormData(payload: AdminUpdateUserPayload): FormData {
	const form = new FormData();
	form.append('firstName', payload.firstName);
	form.append('lastName', payload.lastName);
	form.append('email', payload.email);
	if (payload.avatarFile) form.append('avatar', payload.avatarFile);
	return form;
}

export const adminService = {
	listUsers: (page: number | undefined, pageSize: number) =>
		request<PagedResult<AdminUserSummary>>('/api/admin/users', { params: { page, pageSize } }),

	getUserById: (userId: number) => request<User>(`/api/admin/users/${userId}`),

	updateUser: (userId: number, payload: AdminUpdateUserPayload) =>
		request<User>(`/api/admin/users/${userId}`, {
			method: 'PUT',
			body: toAdminUpdateUserFormData(payload),
		}),

	setUserPassword: (userId: number, newPassword: string) =>
		request<{ message: string }>(`/api/admin/users/${userId}/password`, {
			method: 'PUT',
			body: { newPassword },
		}),

	deactivateUser: (userId: number) =>
		request<{ message: string }>(`/api/admin/${userId}/deactivate`, { method: 'POST' }),

	reactivateUser: (userId: number) =>
		request<{ message: string }>(`/api/admin/${userId}/reactivate`, { method: 'POST' }),

	deleteUser: (userId: number) => request<void>(`/api/admin/${userId}`, { method: 'DELETE' }),

	listPhotos: (page: number | undefined, pageSize: number) =>
		request<PagedResult<Photo>>('/api/admin/photos', { params: { page, pageSize } }),

	listAlbums: (page: number | undefined, pageSize: number) =>
		request<PagedResult<Album>>('/api/admin/albums', { params: { page, pageSize } }),

	// Admin delete reuses the normal photo/album delete routes — the backend
	// service layer already bypasses the ownership check for requesterRole === 'admin'.
	deletePhoto: (photoId: number) => request<void>(`/api/photos/${photoId}`, { method: 'DELETE' }),
	deleteAlbum: (albumId: number) => request<void>(`/api/albums/${albumId}`, { method: 'DELETE' }),
};
