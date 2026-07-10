import { prisma } from '../prisma/client.js';
import { NotFoundError, ForbiddenError } from '../utils/app-error.js';
import { storage } from './storage.service.js';
import type { CreatePhotoRequest, UpdatePhotoRequest } from '../schemas/photo.js';
import type { Prisma } from '@prisma/client';

const photoWithRelations = {
	author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
	_count: { select: { likes: true } },
} satisfies Prisma.PhotoInclude;

type PhotoRow = Prisma.PhotoGetPayload<{ include: typeof photoWithRelations }>;

// Shapes a DB row into the wire-format Photo DTO (matches frontend/src/types
// Photo interface — nested author, derived likesCount/likedByMe).
function toPhotoDto(row: PhotoRow, likedPhotoIds: Set<number>, followedAuthorIds: Set<number>) {
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
async function findLikedPhotoIds(
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

async function findFollowedAuthorIds(
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

interface ListPublicPhotosOptions {
	authorIds?: number[]; // restrict to these authors (Feed); omit for Discovery
	currentUserId: number | null;
	cursor?: number; // keyset pagination — photo id to start after
	take?: number;
}

export async function listPublicPhotos({
	authorIds,
	currentUserId,
	cursor,
	take = 20,
}: ListPublicPhotosOptions) {
	const rows = await prisma.photo.findMany({
		where: {
			sharingMode: 'public',
			...(authorIds ? { authorId: { in: authorIds } } : {}),
		},
		include: photoWithRelations,
		orderBy: { createdAt: 'desc' },
		take,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const likedPhotoIds = await findLikedPhotoIds(
		currentUserId,
		rows.map((r) => r.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		rows.map((row) => row.author.id)
	);
	return rows.map((row) => toPhotoDto(row, likedPhotoIds, followedAuthorIds));
}

export async function listPhotosAdmin({
	currentUserId,
	cursor,
	take = 40,
}: {
	currentUserId: number | null;
	cursor?: number;
	take?: number;
}) {
	const rows = await prisma.photo.findMany({
		include: photoWithRelations,
		orderBy: { createdAt: 'desc' },
		take,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const likedPhotoIds = await findLikedPhotoIds(
		currentUserId,
		rows.map((row) => row.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		rows.map((row) => row.author.id)
	);
	return rows.map((row) => toPhotoDto(row, likedPhotoIds, followedAuthorIds));
}

export async function createPhoto(
	authorId: number,
	input: CreatePhotoRequest,
	file: Express.Multer.File
) {
	const { url, sizeBytes } = await storage.resolve(file);
	// Placeholder image until real upload storage exists (multer + S3/disk —
	// a separate piece of work per the requirements doc's "New Photo" section).
	const row = await prisma.photo.create({
		data: {
			authorId,
			title: input.title,
			description: input.description,
			sharingMode: input.sharingMode,
			imageUrl: url,
			imageMimeType: 'image/jpeg',
			imageSizeBytes: sizeBytes,
			// Created via POST /photos
			isStandalone: true,
		},
		include: photoWithRelations,
	});
	return toPhotoDto(row, new Set(), new Set());
}

export async function updatePhoto(
	photoId: number,
	requesterId: number,
	input: UpdatePhotoRequest,
	file?: Express.Multer.File
) {
	const existing = await prisma.photo.findUnique({ where: { id: photoId } });
	if (!existing) throw new NotFoundError('Photo not found.');
	if (existing.authorId !== requesterId) {
		throw new ForbiddenError('You can only edit your own photos.');
	}

	let imageFields: Partial<Prisma.PhotoUpdateInput> = {};
	if (file) {
		const { url, sizeBytes } = await storage.resolve(file);
		imageFields = { imageUrl: url, imageMimeType: file.mimetype, imageSizeBytes: sizeBytes };
	}

	const row = await prisma.photo.update({
		where: { id: photoId },
		data: {
			title: input.title,
			description: input.description,
			sharingMode: input.sharingMode,
			...imageFields,
		},
		include: photoWithRelations,
	});

	if (file) {
		await storage.remove(existing.imageUrl);
	}

	const likedPhotoIds = await findLikedPhotoIds(requesterId, [photoId]);
	return toPhotoDto(row, likedPhotoIds, new Set());
}

export async function deletePhoto(
	photoId: number,
	requesterId: number,
	requesterRole: 'user' | 'admin'
) {
	const existing = await prisma.photo.findUnique({ where: { id: photoId } });
	if (!existing) throw new NotFoundError('Photo not found.');
	if (existing.authorId !== requesterId && requesterRole !== 'admin') {
		throw new ForbiddenError('You can only delete your own photos.');
	}
	// Cascades deletes album_photos link rows
	await prisma.photo.delete({ where: { id: photoId } });
	await storage.remove(existing.imageUrl);
}

export async function toggleLikePhoto(
	photoId: number,
	userId: number
): Promise<{ likedByMe: boolean }> {
	const existing = await prisma.photoLike.findUnique({
		where: { userId_photoId: { userId, photoId } },
	});

	if (existing) {
		await prisma.photoLike.delete({ where: { userId_photoId: { userId, photoId } } });
		return { likedByMe: false };
	}

	await prisma.photoLike.create({ data: { userId, photoId } });
	return { likedByMe: true };
}
