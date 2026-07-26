import { useState } from 'react';
import { contentService } from '../service/contentService.ts';
import { usePaginatedContent } from '../hooks/usePaginatedContent.ts';
import type { Album, Photo } from '../types/index.ts';

const PAGE_SIZE = 6;

export const useFeed = (enabled = true) => {
	const photoFeed = usePaginatedContent<Photo>(contentService.getFeedPhotos, PAGE_SIZE, enabled);
	const albumFeed = usePaginatedContent<Album>(contentService.getFeedAlbums, PAGE_SIZE, enabled);

	// Modal states managed within the hook's domain
	const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
	const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

	const toggleLikePhoto = (photoId: number) => {
		const photo = photoFeed.items.find((p) => p.id === photoId);
		if (!photo) return;
		const willLike = !photo.likedByMe;

		const apply = (liked: boolean) => (p: Photo) => ({
			...p,
			likedByMe: liked,
			likesCount: liked ? p.likesCount + 1 : p.likesCount - 1,
		});

		photoFeed.updateItem(photoId, apply(willLike));
		const call = willLike ? contentService.likePhoto(photoId) : contentService.unlikePhoto(photoId);
		call.catch(() => photoFeed.updateItem(photoId, apply(!willLike)));
	};

	const toggleLikeAlbum = (albumId: number) => {
		const album = albumFeed.items.find((a) => a.id === albumId);
		if (!album) return;
		const willLike = !album.likedByMe;

		const apply = (liked: boolean) => (a: Album) => ({
			...a,
			likedByMe: liked,
			likesCount: liked ? a.likesCount + 1 : a.likesCount - 1,
		});

		albumFeed.updateItem(albumId, apply(willLike));
		const call = willLike ? contentService.likeAlbum(albumId) : contentService.unlikeAlbum(albumId);
		call.catch(() => albumFeed.updateItem(albumId, apply(!willLike)));
	};

	return {
		photoFeed,
		albumFeed,
		activePhoto,
		setActivePhoto,
		activeAlbum,
		setActiveAlbum,
		toggleLikePhoto,
		toggleLikeAlbum,
		loading: photoFeed.loading && albumFeed.loading,
	};
};
