import { request } from './api.ts';
import type { User, UserProfile, Page, Photo, Album, FollowRelation } from '../types/index.ts';

export interface UpdateProfilePayload {
	firstName: string;
	lastName: string;
	email: string;
	avatarFile?: File | null;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}

function toUpdateProfileFormData(payload: UpdateProfilePayload): FormData {
	const form = new FormData();
	form.append('firstName', payload.firstName);
	form.append('lastName', payload.lastName);
	form.append('email', payload.email);
	// uploadAvatarImage (multer .single('avatar')) only parses the body at
	// all when the request is multipart — so we always send FormData here
	if (payload.avatarFile) {
		form.append('avatar', payload.avatarFile);
	}
	return form;
}

export const userService = {
	getCurrentProfile: () => request<User>('/api/users/current/profile'),

	updateProfile: (payload: UpdateProfilePayload) =>
		request<User>('/api/users/current/profile', {
			method: 'PUT',
			body: toUpdateProfileFormData(payload),
		}),

	changePassword: (payload: ChangePasswordPayload) =>
		request<{ message: string }>('/api/users/current/change-password', {
			method: 'POST',
			body: payload,
		}),

	getPublicProfile: (userId: number) => request<UserProfile>(`/api/users/${userId}`),

	followUser: (userId: number) =>
		request<{ alreadyFollowing: boolean }>(`/api/users/${userId}/follow`, { method: 'POST' }),

	unfollowUser: (userId: number) =>
		request<{ unfollowed: boolean }>(`/api/users/${userId}/follow`, { method: 'DELETE' }),

	// Cursor-pagination
	getUserPhotos: (userId: number, cursor: number | undefined, take: number) =>
		request<Page<Photo>>(`/api/users/${userId}/photos`, { params: { cursor, take } }),

	getUserAlbums: (userId: number, cursor: number | undefined, take: number) =>
		request<Page<Album>>(`/api/users/${userId}/albums`, { params: { cursor, take } }),

	// Offset-pagination
	getUserFollowers: (userId: number, offset: number | undefined, take: number) =>
		request<Page<FollowRelation>>(`/api/users/${userId}/followers`, { params: { offset, take } }),

	getUserFollowing: (userId: number, offset: number | undefined, take: number) =>
		request<Page<FollowRelation>>(`/api/users/${userId}/following`, { params: { offset, take } }),
};
