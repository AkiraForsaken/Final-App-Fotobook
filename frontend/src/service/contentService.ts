import { request } from './api.ts';
import type { Photo, Album, SharingMode } from '../types/index.ts';
import type { Page } from '../hooks/usePaginatedContent.ts';

export interface MediaPayload {
	title: string;
	description: string;
	sharingMode: SharingMode;
}

// Lighter payload for attaching a photo to an album — title/description are
// optional and there's no sharingMode; the photo inherits the album's.
export interface AlbumPhotoPayload {
	title?: string;
	description?: string;
}

function toMediaFormData(payload: MediaPayload, file: File | null | undefined): FormData {
	const form = new FormData();
	form.append('title', payload.title);
	form.append('description', payload.description);
	form.append('sharingMode', payload.sharingMode);
	if (file) form.append('image', file);
	return form;
}

function toAlbumPhotoFormData(payload: AlbumPhotoPayload, file: File): FormData {
	const form = new FormData();
	if (payload.title) form.append('title', payload.title);
	if (payload.description) form.append('description', payload.description);
	form.append('image', file);
	return form;
}

export const contentService = {
	// ── Feed (server-paginated, cursor/take) ──────────────────────────────
	getFeedPhotos: (cursor: number | undefined, take: number) =>
		request<Page<Photo>>('/api/feed/photos', { params: { cursor, take } }),

	getFeedAlbums: (cursor: number | undefined, take: number) =>
		request<Page<Album>>('/api/feed/albums', { params: { cursor, take } }),

	// ── Discovery (server-paginated, cursor/take) ─────────────────────────
	getDiscoveryPhotos: (cursor: number | undefined, take: number) =>
		request<Page<Photo>>('/api/discovery/photos', { params: { cursor, take } }),

	getDiscoveryAlbums: (cursor: number | undefined, take: number) =>
		request<Page<Album>>('/api/discovery/albums', { params: { cursor, take } }),

	// ── Single-item fetch — direct /photos/:id/edit, /albums/:id/edit loads
	getPhotoById: (id: number) => request<Photo>(`/api/photos/${id}`),
	getAlbumById: (id: number) => request<Album>(`/api/albums/${id}`),

	// ── Photos ─────────────────────────────────────────────────────────────
	createPhoto: (payload: MediaPayload, file: File) =>
		request<Photo>('/api/photos', { method: 'POST', body: toMediaFormData(payload, file) }),

	updatePhoto: (id: number, payload: MediaPayload, file?: File | null) =>
		request<Photo>(`/api/photos/${id}`, { method: 'PUT', body: toMediaFormData(payload, file) }),

	deletePhoto: (id: number) => request<void>(`/api/photos/${id}`, { method: 'DELETE' }),

	likePhoto: (id: number) =>
		request<{ likedByMe: boolean }>(`/api/photos/${id}/like`, { method: 'PUT' }),
	unlikePhoto: (id: number) =>
		request<{ likedByMe: boolean }>(`/api/photos/${id}/like`, { method: 'DELETE' }),

	// ── Albums ─────────────────────────────────────────────────────────────
	createAlbum: (payload: MediaPayload) =>
		request<Album>('/api/albums', { method: 'POST', body: payload }),

	updateAlbum: (id: number, payload: MediaPayload) =>
		request<Album>(`/api/albums/${id}`, { method: 'PUT', body: payload }),

	deleteAlbum: (id: number) => request<void>(`/api/albums/${id}`, { method: 'DELETE' }),

	likeAlbum: (id: number) =>
		request<{ likedByMe: boolean }>(`/api/albums/${id}/like`, { method: 'PUT' }),
	unlikeAlbum: (id: number) =>
		request<{ likedByMe: boolean }>(`/api/albums/${id}/like`, { method: 'DELETE' }),

	// One image at a time — the frontend creates multiple sequential
	// calls to this for the "attach N photos on album creation" flow.
	addNewPhotoToAlbum: (albumId: number, payload: AlbumPhotoPayload, file: File) =>
		request<Album>(`/api/albums/${albumId}/photos`, {
			method: 'POST',
			body: toAlbumPhotoFormData(payload, file),
		}),

	addExistingPhotoToAlbum: (albumId: number, photoId: number) =>
		request<Album>(`/api/albums/${albumId}/photos/existing`, {
			method: 'POST',
			body: { photoId },
		}),

	removePhotoFromAlbum: (albumId: number, photoId: number) =>
		request<Album>(`/api/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }),
};
