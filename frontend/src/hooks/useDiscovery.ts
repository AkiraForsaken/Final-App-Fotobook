import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './useAuth.ts';
import { contentService } from '../service/contentService.ts';
import { userService } from '../service/userService.ts';
import { usePaginatedContent } from '../hooks/usePaginatedContent.ts';
import type { Album, Photo } from '../types/index.ts';
import { APP_ROUTE } from '../utils/routes.ts';

const PAGE_SIZE = 6;

export const useDiscovery = (enabled = true) => {
	const { currentUser, updateCurrentUser } = useAuth();
	const navigate = useNavigate();
	const photoFeed = usePaginatedContent<Photo>(
		contentService.getDiscoveryPhotos,
		PAGE_SIZE,
		enabled
	);
	const albumFeed = usePaginatedContent<Album>(
		contentService.getDiscoveryAlbums,
		PAGE_SIZE,
		enabled
	);

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

	const setAuthorFollowed = (authorId: number, followed: boolean) => {
		const apply = <T extends { author: { id: number; isFollowedByMe?: boolean } }>(item: T): T =>
			item.author.id === authorId
				? { ...item, author: { ...item.author, isFollowedByMe: followed } }
				: item;

		photoFeed.items.forEach((p) => {
			if (p.author.id === authorId) photoFeed.updateItem(p.id, apply);
		});
		albumFeed.items.forEach((a) => {
			if (a.author.id === authorId) albumFeed.updateItem(a.id, apply);
		});
	};

	const toggleFollow = (authorId: number, currentlyFollowing: boolean) => {
		if (!currentUser) {
			navigate(APP_ROUTE.LOGIN);
			return;
		}

		const willFollow = !currentlyFollowing;
		const delta = willFollow ? 1 : -1;

		setAuthorFollowed(authorId, willFollow);
		updateCurrentUser((user) => ({
			...user,
			followingCount: Math.max(0, (user.followingCount ?? 0) + delta),
		}));
		const call = currentlyFollowing
			? userService.unfollowUser(authorId)
			: userService.followUser(authorId);
		call.catch(() => {
			// Revert both feed state and user state on failure
			setAuthorFollowed(authorId, currentlyFollowing);
			updateCurrentUser((user) => ({
				...user,
				followingCount: Math.max(0, (user.followingCount ?? 0) - delta),
			}));
		});
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
		toggleFollow,
		loading: photoFeed.loading && albumFeed.loading,
	};
};
