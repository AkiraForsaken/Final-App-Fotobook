import { request } from './api.ts';
import type { User, Photo, Album } from '../types/index.ts';
import type { Page } from '../hooks/usePaginatedContent.ts';

export interface AdminUpdateUserPayload {
	firstName: string;
	lastName: string;
	email: string;
}

export const adminService = {
	// usersController.listUsers returns a plain array today (no {items,
	// nextCursor} envelope), unlike feed/discovery/admin photos & albums —
	// worth aligning for consistency, but wired as-is for now.
	listUsers: (cursor?: number, take = 40) =>
		request<User[]>('/api/admin/users', { params: { cursor, take } }),

	// TODO: Wired to the PUT /api/admin/users/:id -> usersController.updateProfile
	// route you're adding. JSON body only — admin edit has no avatar upload
	// in the requirements doc, unlike the user's own Edit Profile.
	updateUser: (userId: number, payload: AdminUpdateUserPayload) =>
		request<User>(`/api/admin/users/${userId}`, { method: 'PUT', body: payload }),

	deactivateUser: (userId: number) =>
		request<{ message: string }>(`/api/admin/${userId}/deactivate`, { method: 'POST' }),

	reactivateUser: (userId: number) =>
		request<{ message: string }>(`/api/admin/${userId}/reactivate`, { method: 'POST' }),

	deleteUser: (userId: number) => request<void>(`/api/admin/${userId}`, { method: 'DELETE' }),

	// listPhotosAdmin/listAlbumsAdmin already return the {items, nextCursor}
	// envelope, per photo.service.ts/album.service.ts.
	listPhotos: (cursor?: number, take = 40) =>
		request<Page<Photo>>('/api/admin/photos', { params: { cursor, take } }),

	listAlbums: (cursor?: number, take = 40) =>
		request<Page<Album>>('/api/admin/albums', { params: { cursor, take } }),

	// Admin delete reuses the normal photo/album delete routes — the backend
	// service layer already checks `requesterRole !== 'admin'` to bypass the
	// ownership check.
	deletePhoto: (photoId: number) => request<void>(`/api/photos/${photoId}`, { method: 'DELETE' }),
	deleteAlbum: (albumId: number) => request<void>(`/api/albums/${albumId}`, { method: 'DELETE' }),
};
