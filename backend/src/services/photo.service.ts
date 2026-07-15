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
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: take + 1, // fetch one extra to detect "more remain"
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

	const likedPhotoIds = await findLikedPhotoIds(
		currentUserId,
		pageRows.map((r) => r.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		pageRows.map((r) => r.author.id)
	);

	return {
		items: pageRows.map((row) => toPhotoDto(row, likedPhotoIds, followedAuthorIds)),
		nextCursor,
	};
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
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

	const likedPhotoIds = await findLikedPhotoIds(
		currentUserId,
		pageRows.map((row) => row.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		pageRows.map((row) => row.author.id)
	);
	return {
		items: pageRows.map((row) => toPhotoDto(row, likedPhotoIds, followedAuthorIds)),
		nextCursor,
	};
}

export async function createPhoto(
	authorId: number,
	input: CreatePhotoRequest,
	file: Express.Multer.File
) {
	const { url, sizeBytes } = await storage.resolve(file);
	try {
		const row = await prisma.photo.create({
			data: {
				authorId,
				title: input.title,
				description: input.description,
				sharingMode: input.sharingMode,
				imageUrl: url,
				imageMimeType: file.mimetype,
				imageSizeBytes: sizeBytes,
				isStandalone: true,
			},
			include: photoWithRelations,
		});
		return toPhotoDto(row, new Set(), new Set());
	} catch (err) {
		await storage.remove(url);
		throw err;
	}
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

	let newUrl: string | null = null;
	let imageFields: Partial<Prisma.PhotoUpdateInput> = {};
	if (file) {
		const { url, sizeBytes } = await storage.resolve(file);
		newUrl = url;
		imageFields = { imageUrl: url, imageMimeType: file.mimetype, imageSizeBytes: sizeBytes };
	}

	let row;
	try {
		row = await prisma.photo.update({
			where: { id: photoId },
			data: {
				title: input.title,
				description: input.description,
				sharingMode: input.sharingMode,
				...imageFields,
			},
			include: photoWithRelations,
		});
	} catch (err) {
		if (newUrl) await storage.remove(newUrl);
		throw err;
	}

	if (file) {
		await storage.remove(existing.imageUrl); // old file — cleaned up only now that the update committed
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

export async function likePhoto(photoId: number, userId: number) {
	// Can be optimized by catching Prisma FK error (P2003) instead and translate into NotFoundError
	const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { id: true } });
	if (!photo) throw new NotFoundError('Photo not found.');
	await prisma.photoLike.upsert({
		where: { userId_photoId: { userId, photoId } },
		create: { userId, photoId },
		update: {},
	});
	return { likedByMe: true };
}

export async function unlikePhoto(photoId: number, userId: number) {
	// Not technically needed but added for consistency
	const photo = await prisma.photo.findUnique({ where: { id: photoId }, select: { id: true } });
	if (!photo) throw new NotFoundError('Photo not found.');
	await prisma.photoLike.deleteMany({ where: { userId, photoId } });
	return { likedByMe: false };
}
