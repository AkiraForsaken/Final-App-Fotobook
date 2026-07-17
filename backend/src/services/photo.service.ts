import { prisma } from '../prisma/client.js';
import { NotFoundError, ForbiddenError } from '../utils/app-error.js';
import { storage } from './storage.service.js';
import type { CreatePhotoRequest, UpdatePhotoRequest } from '../schemas/photo.js';
import type { Prisma } from '@prisma/client';
import {
	findFollowedAuthorIds,
	findLikedPhotoIds,
	paginateRows,
	photoWithRelations,
	toPhotoDto,
} from '../utils/helpers.js';

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
			isStandalone: true,
		},
		include: photoWithRelations,
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: take + 1, // fetch one extra to detect "more remain"
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const { pageRows, nextCursor } = paginateRows(rows, take);

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

	const { pageRows, nextCursor } = paginateRows(rows, take);

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

export async function getPhotoById(
	photoId: number,
	currentUserId: number | null,
	currentUserRole: 'user' | 'admin'
) {
	const row = await prisma.photo.findUnique({
		where: { id: photoId },
		include: photoWithRelations,
	});

	if (!row) throw new NotFoundError('Photo not found.');

	// Strict visibility check: 403 Forbidden if private and requester is not the owner or an admin
	if (
		row.sharingMode === 'private' &&
		row.authorId !== currentUserId &&
		currentUserRole !== 'admin'
	) {
		throw new ForbiddenError('You do not have permission to view this photo.');
	}

	const likedPhotoIds = await findLikedPhotoIds(currentUserId, [photoId]);
	const followedAuthorIds = await findFollowedAuthorIds(currentUserId, [row.author.id]);

	return toPhotoDto(row, likedPhotoIds, followedAuthorIds);
}
