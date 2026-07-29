import { prisma } from '../prisma/client.js';
import type { Prisma } from '@prisma/client';
import {
	NotFoundError,
	ForbiddenError,
	ConflictError,
	ValidationError,
} from '../utils/app-error.js';
import type { CreateAlbumRequest, UpdateAlbumRequest } from '../schemas/album.js';
import {
	albumUploadFolder,
	removeCloudinaryAssets,
	signAlbumUpload,
	storage,
} from './storage.service.js';
import { findFollowedAuthorIds, paginateRows } from '../utils/helpers.js';
import { albumWithRelations, findLikedAlbumIds, toAlbumDto } from '../utils/dto/album.dto.js';
import { CloudinaryPhotoInput } from '../schemas/photo.js';
import { PHOTO_MAX_SIZE_BYTES } from '../middlewares/upload.js';

// Re-fetches a single album with relations and shapes it as a DTO. Accepts
// either the global `prisma` client or an active transaction client, so
// mutation flows can return fresh state from inside their own transaction.
async function getAlbumDtoById(
	client: Prisma.TransactionClient | typeof prisma,
	albumId: number,
	currentUserId: number | null
) {
	const row = await client.album.findUnique({
		where: { id: albumId },
		include: albumWithRelations,
	});
	if (!row) throw new NotFoundError('Album not found.');
	const likedAlbumIds = await findLikedAlbumIds(currentUserId, [albumId]);
	const followedAuthorIds = await findFollowedAuthorIds(currentUserId, [row.author.id]);
	return toAlbumDto(row, likedAlbumIds, followedAuthorIds);
}

// Matches the requirements doc's "maximum 25 images" per-album cap.
// This is the backend's lifetime ceiling
const MAX_ALBUM_PHOTOS = 25;

async function assertAlbumNotFull(
	client: Prisma.TransactionClient | typeof prisma,
	albumId: number
): Promise<void> {
	const count = await client.albumPhoto.count({ where: { albumId } });
	if (count >= MAX_ALBUM_PHOTOS) {
		throw new ValidationError(`Albums can contain at most ${MAX_ALBUM_PHOTOS} photos.`);
	}
}

// Next `position` value for a new album_photos row — simple append-at-end.
async function getNextPosition(tx: Prisma.TransactionClient, albumId: number): Promise<number> {
	const last = await tx.albumPhoto.findFirst({
		where: { albumId },
		orderBy: { position: 'desc' },
		select: { position: true },
	});
	return (last?.position ?? -1) + 1;
}

// If the album has no cover yet, make this the cover.
async function assignCoverIfNeeded(
	tx: Prisma.TransactionClient,
	albumId: number,
	photoId: number
): Promise<void> {
	const album = await tx.album.findUnique({
		where: { id: albumId },
		select: { coverPhotoId: true },
	});
	if (!album?.coverPhotoId) {
		await tx.album.update({ where: { id: albumId }, data: { coverPhotoId: photoId } });
	}
}

interface ListPublicAlbumsOptions {
	authorIds?: number[]; // restrict to these authors (Feed); omit for Discovery
	search?: string;
	currentUserId: number | null;
	cursor?: number; // keyset pagination — album id to start after
	take?: number;
}

export async function listPublicAlbums({
	authorIds,
	search,
	currentUserId,
	cursor,
	take = 20,
}: ListPublicAlbumsOptions) {
	const rows = await prisma.album.findMany({
		where: {
			sharingMode: 'public',
			...(authorIds ? { authorId: { in: authorIds } } : {}),
			...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
		},
		include: albumWithRelations,
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const { pageRows, nextCursor } = paginateRows(rows, take);

	const likedAlbumIds = await findLikedAlbumIds(
		currentUserId,
		pageRows.map((r) => r.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		pageRows.map((row) => row.author.id)
	);
	return {
		items: pageRows.map((row) => toAlbumDto(row, likedAlbumIds, followedAuthorIds)),
		nextCursor,
	};
}

export async function listAlbumsAdmin({
	currentUserId,
	page = 1,
	take = 40,
}: {
	currentUserId: number | null;
	page?: number;
	take?: number;
}) {
	const [rows, totalItems] = await Promise.all([
		prisma.album.findMany({
			include: albumWithRelations,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			take,
			skip: (page - 1) * take,
		}),
		prisma.album.count(),
	]);

	const likedAlbumIds = await findLikedAlbumIds(
		currentUserId,
		rows.map((row) => row.id)
	);
	const followedAuthorIds = await findFollowedAuthorIds(
		currentUserId,
		rows.map((row) => row.author.id)
	);
	return {
		items: rows.map((row) => toAlbumDto(row, likedAlbumIds, followedAuthorIds)),
		page,
		pageSize: take,
		totalItems,
		totalPages: Math.max(1, Math.ceil(totalItems / take)),
	};
}

export async function createAlbum(authorId: number, input: CreateAlbumRequest) {
	// Albums are created empty — photos are attached afterward via
	// addExistingPhotoToAlbum / addNewPhotoToAlbum, one at a time
	const row = await prisma.album.create({
		data: {
			authorId,
			title: input.title,
			description: input.description,
			sharingMode: input.sharingMode,
		},
		include: albumWithRelations,
	});
	return toAlbumDto(row, new Set(), new Set());
}

export async function updateAlbum(
	albumId: number,
	requesterId: number,
	requesterRole: 'user' | 'admin',
	input: UpdateAlbumRequest
) {
	const existing = await prisma.album.findUnique({ where: { id: albumId } });
	if (!existing) throw new NotFoundError('Album not found.');
	if (existing.authorId !== requesterId && requesterRole !== 'admin') {
		throw new ForbiddenError('You can only edit your own albums.');
	}

	const row = await prisma.album.update({
		where: { id: albumId },
		data: {
			title: input.title,
			description: input.description,
			sharingMode: input.sharingMode,
		},
		include: albumWithRelations,
	});
	const likedAlbumIds = await findLikedAlbumIds(requesterId, [albumId]);
	const followedAuthorIds = await findFollowedAuthorIds(requesterId, [row.author.id]);
	return toAlbumDto(row, likedAlbumIds, followedAuthorIds);
}

export async function deleteAlbum(
	albumId: number,
	requesterId: number,
	requesterRole: 'user' | 'admin'
) {
	// Files are only actually removed from storage after the DB transaction commits successfully
	const orphanedImageUrls = await prisma.$transaction(async (tx) => {
		const existing = await tx.album.findUnique({
			where: { id: albumId },
			include: { photoLinks: { select: { photoId: true } } },
		});
		if (!existing) throw new NotFoundError('Album not found.');
		if (existing.authorId !== requesterId && requesterRole !== 'admin') {
			throw new ForbiddenError('You can only delete your own albums.');
		}

		const linkedPhotoIds = existing.photoLinks.map((link) => link.photoId);

		// Deleting the album cascades its album_photos link rows
		await tx.album.delete({ where: { id: albumId } });

		if (linkedPhotoIds.length === 0) return [];

		// Delete photos that don't belong to other albums or not standalone
		const stillLinked = await tx.albumPhoto.findMany({
			where: { photoId: { in: linkedPhotoIds } },
			select: { photoId: true },
		});
		const stillLinkedIds = new Set(stillLinked.map((l) => l.photoId));
		const orphanCandidateIds = linkedPhotoIds.filter((id) => !stillLinkedIds.has(id));

		if (orphanCandidateIds.length === 0) return [];

		const orphans = await tx.photo.findMany({
			where: { id: { in: orphanCandidateIds }, isStandalone: false },
			select: { id: true, imageUrl: true },
		});
		if (orphans.length === 0) return [];

		await tx.photo.deleteMany({ where: { id: { in: orphans.map((p) => p.id) } } });

		return orphans.map((p) => p.imageUrl);
	});

	await Promise.all(orphanedImageUrls.map((url) => storage.remove(url)));
}

// Link an existing photo to an Album. Sets album cover if no cover
export async function addExistingPhotoToAlbum(
	albumId: number,
	photoId: number,
	requesterId: number
) {
	return prisma.$transaction(async (tx) => {
		const album = await tx.album.findUnique({ where: { id: albumId } });
		if (!album) throw new NotFoundError('Album not found.');
		if (album.authorId !== requesterId) {
			throw new ForbiddenError('You can only add photos to your own albums.');
		}

		const photo = await tx.photo.findUnique({ where: { id: photoId } });
		if (!photo) throw new NotFoundError('Photo not found.');
		if (photo.authorId !== requesterId) {
			throw new ForbiddenError('You can only add your own photos to an album.');
		}

		const existingLink = await tx.albumPhoto.findUnique({
			where: { albumId_photoId: { albumId, photoId } },
		});
		if (existingLink) {
			throw new ConflictError('This photo is already in the album.');
		}

		await assertAlbumNotFull(tx, albumId);

		const position = await getNextPosition(tx, albumId);
		await tx.albumPhoto.create({ data: { albumId, photoId, position } });
		await assignCoverIfNeeded(tx, albumId, photoId);

		return getAlbumDtoById(tx, albumId, requesterId);
	});
}

export async function getAlbumUploadSignature(albumId: number, requesterId: number) {
	const album = await prisma.album.findUnique({ where: { id: albumId } });
	if (!album) throw new NotFoundError('Album not found.');
	if (album.authorId !== requesterId) {
		throw new ForbiddenError('You can only upload photos to your own albums.');
	}
	await assertAlbumNotFull(prisma, albumId);
	return signAlbumUpload(albumId);
}

function cloudinaryFormatToMime(format: string): string {
	const normalized = format.toLowerCase();
	return normalized === 'jpg' ? 'image/jpeg' : `image/${normalized}`;
}

export async function addPhotosToAlbumBatch(
	albumId: number,
	requesterId: number,
	photos: CloudinaryPhotoInput[]
) {
	const expectedPrefix = `${albumUploadFolder(albumId)}/`;

	// Reject (and clean up) anything that didn't come from the folder we
	// signed for THIS album, or that's larger than what we allow — a client
	// could otherwise submit a publicId it uploaded somewhere else entirely.
	const invalid = photos.filter(
		(p) => !p.publicId.startsWith(expectedPrefix) || p.bytes > PHOTO_MAX_SIZE_BYTES
	);
	if (invalid.length > 0) {
		await removeCloudinaryAssets(invalid.map((p) => p.publicId));
		throw new ValidationError('One or more uploaded images were invalid or too large.');
	}

	try {
		return await prisma.$transaction(async (tx) => {
			const album = await tx.album.findUnique({ where: { id: albumId } });
			if (!album) throw new NotFoundError('Album not found.');
			if (album.authorId !== requesterId) {
				throw new ForbiddenError('You can only add photos to your own albums.');
			}

			const existingCount = await tx.albumPhoto.count({ where: { albumId } });
			if (existingCount + photos.length > MAX_ALBUM_PHOTOS) {
				throw new ValidationError(`Albums can contain at most ${MAX_ALBUM_PHOTOS} photos.`);
			}

			let nextPosition = await getNextPosition(tx, albumId);
			let coverAssigned = Boolean(album.coverPhotoId);

			for (const p of photos) {
				const photo = await tx.photo.create({
					data: {
						authorId: requesterId,
						title: null,
						description: null,
						sharingMode: album.sharingMode,
						imageUrl: p.secureUrl,
						imagePublicId: p.publicId,
						imageMimeType: cloudinaryFormatToMime(p.format),
						imageSizeBytes: p.bytes,
						isStandalone: false,
					},
				});
				await tx.albumPhoto.create({
					data: { albumId, photoId: photo.id, position: nextPosition++ },
				});
				if (!coverAssigned) {
					await tx.album.update({ where: { id: albumId }, data: { coverPhotoId: photo.id } });
					coverAssigned = true;
				}
			}

			return getAlbumDtoById(tx, albumId, requesterId);
		});
	} catch (error) {
		// Transaction rolled back — don't leave the assets orphaned in Cloudinary.
		await removeCloudinaryAssets(photos.map((p) => p.publicId));
		throw error;
	}
}

// Unlink photos from an Album, delete if it is not standalone or linked to another album
export async function removePhotoFromAlbum(albumId: number, photoId: number, requesterId: number) {
	let imageUrlToRemove: string | null = null;

	const result = await prisma.$transaction(async (tx) => {
		const album = await tx.album.findUnique({ where: { id: albumId } });
		if (!album) throw new NotFoundError('Album not found.');
		if (album.authorId !== requesterId) {
			throw new ForbiddenError('You can only remove photos from your own albums.');
		}

		const link = await tx.albumPhoto.findUnique({
			where: { albumId_photoId: { albumId, photoId } },
		});
		if (!link) throw new NotFoundError('This photo is not in the album.');

		await tx.albumPhoto.delete({ where: { albumId_photoId: { albumId, photoId } } });

		if (album.coverPhotoId === photoId) {
			const nextCoverLink = await tx.albumPhoto.findFirst({
				where: { albumId },
				orderBy: { position: 'asc' },
				select: { photoId: true },
			});
			await tx.album.update({
				where: { id: albumId },
				data: { coverPhotoId: nextCoverLink?.photoId ?? null },
			});
		}

		const photo = await tx.photo.findUnique({
			where: { id: photoId },
			select: { isStandalone: true, imageUrl: true },
		});
		if (photo && !photo.isStandalone) {
			const remainingLinks = await tx.albumPhoto.count({ where: { photoId } });
			if (remainingLinks === 0) {
				await tx.photo.delete({ where: { id: photoId } });
				imageUrlToRemove = photo.imageUrl;
			}
		}

		return getAlbumDtoById(tx, albumId, requesterId);
	});

	// Only touch the filesystem after the transaction has committed.
	if (imageUrlToRemove) {
		await storage.remove(imageUrlToRemove);
	}

	return result;
}

export async function likeAlbum(albumId: number, userId: number) {
	// Can be optimized by catching Prisma FK error (P2003) instead and translate into NotFoundError
	const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
	if (!album) throw new NotFoundError('Album not found.');
	await prisma.albumLike.upsert({
		where: { userId_albumId: { userId, albumId } },
		create: { userId, albumId },
		update: {},
	});
	return { likedByMe: true };
}

export async function unlikeAlbum(albumId: number, userId: number) {
	// Not technically needed but added for consistency
	const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
	if (!album) throw new NotFoundError('Album not found.');
	await prisma.albumLike.deleteMany({ where: { userId, albumId } });
	return { likedByMe: false };
}

export async function getAlbumById(
	albumId: number,
	currentUserId: number | null,
	currentUserRole: 'user' | 'admin'
) {
	const row = await prisma.album.findUnique({
		where: { id: albumId },
		include: albumWithRelations,
	});

	if (!row) throw new NotFoundError('Album not found.');

	// Strict visibility check: 403 Forbidden if private and requester is not the owner or an admin
	if (
		row.sharingMode === 'private' &&
		row.authorId !== currentUserId &&
		currentUserRole !== 'admin'
	) {
		throw new ForbiddenError('You do not have permission to view this album.');
	}

	const likedAlbumIds = await findLikedAlbumIds(currentUserId, [albumId]);
	const followedAuthorIds = await findFollowedAuthorIds(currentUserId, [row.author.id]);

	return toAlbumDto(row, likedAlbumIds, followedAuthorIds);
}
