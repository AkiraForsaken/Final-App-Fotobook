import { request } from './api.ts';
import type { Photo, Album, UserProfileData } from '../types/index.ts';

export const contentService = {
	getFeedPhotos: () => request<Photo[]>('/api/feed/photos'),
	getFeedAlbums: () => request<Album[]>('/api/feed/albums'),
	getDiscoveryPhotos: () => request<Photo[]>('/api/discovery/photos'),
	getDiscoveryAlbums: () => request<Album[]>('/api/discovery/albums'),
	getProfiles: () => request<Record<number, UserProfileData>>('/api/profiles'),
};
