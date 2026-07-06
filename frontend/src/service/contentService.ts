import { request } from './api.ts';
import type { Photo, Album, UserProfileData } from '../types/index.ts';

// TODO: Swap to formdata type for body with real backend
interface PhotoPayload {
	title: string;
	description: string;
	sharingMode: string;
	authorId: number;
}

interface AlbumPayload {
	title: string;
	description: string;
	sharingMode: string;
	authorId: number;
}

export const contentService = {
	getFeedPhotos: () => request<Photo[]>('/api/feed/photos'),
	getFeedAlbums: () => request<Album[]>('/api/feed/albums'),
	getDiscoveryPhotos: () => request<Photo[]>('/api/discovery/photos'),
	getDiscoveryAlbums: () => request<Album[]>('/api/discovery/albums'),
	getProfiles: () => request<Record<number, UserProfileData>>('/api/profiles'),

	// ── Photos ────────────────────────────────────────────────────────────────
	createPhoto: (payload: PhotoPayload) =>
		request<Photo>('/api/photos', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	updatePhoto: (id: number, payload: PhotoPayload) =>
		request<Photo>(`/api/photos/${id}`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),

	deletePhoto: (id: number, authorId: number) =>
		request<void>(`/api/photos/${id}`, {
			method: 'DELETE',
			body: JSON.stringify({ authorId }),
		}),

	// ── Albums ────────────────────────────────────────────────────────────────
	createAlbum: (payload: AlbumPayload) =>
		request<Album>('/api/albums', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	updateAlbum: (id: number, payload: AlbumPayload) =>
		request<Album>(`/api/albums/${id}`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),

	deleteAlbum: (id: number, authorId: number) =>
		request<void>(`/api/albums/${id}`, {
			method: 'DELETE',
			body: JSON.stringify({ authorId }),
		}),
};
