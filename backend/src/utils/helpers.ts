import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

export const photoWithRelations = {
	author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
	_count: { select: { likes: true } },
} satisfies Prisma.PhotoInclude;

type PhotoRow = Prisma.PhotoGetPayload<{ include: typeof photoWithRelations }>;

// Shapes a DB row into the wire-format Photo DTO (matches frontend/src/types
// Photo interface — nested author, derived likesCount/likedByMe).
export function toPhotoDto(
	row: PhotoRow,
	likedPhotoIds: Set<number>,
	followedAuthorIds: Set<number>
) {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		imageUrl: row.imageUrl,
		sharingMode: row.sharingMode,
		likesCount: row._count.likes,
		likedByMe: likedPhotoIds.has(row.id),
		author: {
			...row.author,
			isFollowedByMe: followedAuthorIds.has(row.author.id),
		},
		createdAt: row.createdAt.toISOString(),
	};
}

// One query to find which of a batch of photos the current viewer has liked
export async function findLikedPhotoIds(
	currentUserId: number | null,
	photoIds: number[]
): Promise<Set<number>> {
	if (!currentUserId || photoIds.length === 0) return new Set();
	const likes = await prisma.photoLike.findMany({
		where: { userId: currentUserId, photoId: { in: photoIds } },
		select: { photoId: true },
	});
	return new Set(likes.map((l) => l.photoId));
}

export const DEFAULT_COVER_URL = 'https://picsum.photos/seed/album-default/600/400';

export const albumWithRelations = {
	author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
	coverPhoto: { select: { id: true, imageUrl: true } },
	// Ordered by `position` so `imageUrls` reflects the intended display
	// order (append-on-add for now — no manual reordering UI yet).
	photoLinks: {
		orderBy: { position: 'asc' },
		include: { photo: { select: { id: true, imageUrl: true } } },
	},
	_count: { select: { likes: true } },
} satisfies Prisma.AlbumInclude;

type AlbumRow = Prisma.AlbumGetPayload<{ include: typeof albumWithRelations }>;

// Shapes a DB row into the wire-format Album DTO (matches frontend Album interface).
export function toAlbumDto(
	row: AlbumRow,
	likedAlbumIds: Set<number>,
	followedAuthorIds: Set<number>
) {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		coverImageUrl:
			row.coverPhoto?.imageUrl ?? row.photoLinks[0]?.photo.imageUrl ?? DEFAULT_COVER_URL,
		imageUrls: row.photoLinks.map((link) => link.photo.imageUrl),
		photoIds: row.photoLinks.map((link) => link.photo.id),
		sharingMode: row.sharingMode,
		likesCount: row._count.likes,
		likedByMe: likedAlbumIds.has(row.id),
		author: {
			...row.author,
			isFollowedByMe: followedAuthorIds.has(row.author.id),
		},
		createdAt: row.createdAt.toISOString(),
	};
}

// Find which albums the current user has liked.
export async function findLikedAlbumIds(
	currentUserId: number | null,
	albumIds: number[]
): Promise<Set<number>> {
	if (!currentUserId || albumIds.length === 0) return new Set();
	const likes = await prisma.albumLike.findMany({
		where: { userId: currentUserId, albumId: { in: albumIds } },
		select: { albumId: true },
	});
	return new Set(likes.map((l) => l.albumId));
}

export async function findFollowedAuthorIds(
	currentUserId: number | null,
	authorIds: number[]
): Promise<Set<number>> {
	if (!currentUserId || authorIds.length === 0) return new Set();
	const follows = await prisma.follow.findMany({
		where: { followerId: currentUserId, followingId: { in: authorIds } },
		select: { followingId: true },
	});
	return new Set(follows.map((follow) => follow.followingId));
}

export function paginateRows<T extends { id: number }>(rows: T[], take: number) {
	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;
	return { pageRows, nextCursor };
}
