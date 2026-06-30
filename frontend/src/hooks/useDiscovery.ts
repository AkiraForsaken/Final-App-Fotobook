import { useCallback, useEffect, useState } from 'react';
import { contentService } from '../service/contentService.ts';
import type { Album, Photo } from '../types/index.ts';

export const useDiscovery = () => {
	const [discoveryPhotos, setDiscoveryPhotos] = useState<Photo[]>([]);
	const [discoveryAlbums, setDiscoveryAlbums] = useState<Album[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadDiscovery = useCallback(async () => {
		try {
			setLoading(true);
			const [photos, albums] = await Promise.all([
				contentService.getDiscoveryPhotos(),
				contentService.getDiscoveryAlbums(),
			]);
			setDiscoveryPhotos(photos);
			setDiscoveryAlbums(albums);
			setError(null);
		} catch (err) {
			console.error('Failed to load discovery content:', err);
			setError('Could not load discovery content.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadDiscovery();
	}, [loadDiscovery]);

	const toggleLikePhoto = useCallback((photoId: number) => {
		setDiscoveryPhotos((prev) =>
			prev.map((photo) => {
				if (photo.id !== photoId) return photo;
				return {
					...photo,
					likedByMe: !photo.likedByMe,
					likesCount: photo.likedByMe ? photo.likesCount - 1 : photo.likesCount + 1,
				};
			})
		);
	}, []);

	const toggleLikeAlbum = useCallback((albumId: number) => {
		setDiscoveryAlbums((prev) =>
			prev.map((album) => {
				if (album.id !== albumId) return album;
				return {
					...album,
					likedByMe: !album.likedByMe,
					likesCount: album.likedByMe ? album.likesCount - 1 : album.likesCount + 1,
				};
			})
		);
	}, []);

	return {
		discoveryPhotos,
		discoveryAlbums,
		loading,
		error,
		toggleLikePhoto,
		toggleLikeAlbum,
		refetch: loadDiscovery,
	};
};
