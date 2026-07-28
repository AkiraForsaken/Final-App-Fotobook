import { Prisma } from '@prisma/client';
import { dateToISO, toAuthorDto } from '../dto-helpers.js';
import { prisma } from '../../prisma/client.js';
import { DEFAULT_COVER_URL } from '../helpers.js';

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

export type AlbumRow = Prisma.AlbumGetPayload<{ include: typeof albumWithRelations }>;

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
		author: toAuthorDto(row.author, followedAuthorIds.has(row.author.id)),
		createdAt: dateToISO(row.createdAt),
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
