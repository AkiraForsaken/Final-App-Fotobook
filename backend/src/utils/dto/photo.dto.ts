import { Prisma } from '@prisma/client';
import { dateToISO, toAuthorDto } from '../dto-helpers.js';
import { prisma } from '../../prisma/client.js';

export const photoWithRelations = {
	author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
	_count: { select: { likes: true } },
} satisfies Prisma.PhotoInclude;

export type PhotoRow = Prisma.PhotoGetPayload<{ include: typeof photoWithRelations }>;

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
		author: toAuthorDto(row.author, followedAuthorIds.has(row.author.id)),
		createdAt: dateToISO(row.createdAt),
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
