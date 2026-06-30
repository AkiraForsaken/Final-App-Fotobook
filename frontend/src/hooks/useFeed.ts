import { useCallback, useEffect, useState } from 'react';
import { contentService } from '../service/contentService.ts';
import type { Album, Photo } from '../types/index.ts';

export const useFeed = () => {
	const [feedPhotos, setFeedPhotos] = useState<Photo[]>([]);
	const [feedAlbums, setFeedAlbums] = useState<Album[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadFeed = useCallback(async () => {
		try {
			setLoading(true);
			const [photos, albums] = await Promise.all([
				contentService.getFeedPhotos(),
				contentService.getFeedAlbums(),
			]);
			setFeedPhotos(photos);
			setFeedAlbums(albums);
			setError(null);
		} catch (err) {
			console.error('Failed to load feed content:', err);
			setError('Could not load feed content.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadFeed();
	}, [loadFeed]);

	const toggleLikePhoto = useCallback((photoId: number) => {
		setFeedPhotos((prev) =>
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
		setFeedAlbums((prev) =>
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
		feedPhotos,
		feedAlbums,
		loading,
		error,
		toggleLikePhoto,
		toggleLikeAlbum,
		refetch: loadFeed,
	};
};
