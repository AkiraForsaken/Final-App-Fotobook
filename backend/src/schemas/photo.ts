import { z } from 'zod';
import { sharingModeSchema } from './common.js';
import { authorSummarySchema } from './user.js';

export const photoSchema = z.object({
	id: z.number(),
	title: z.string().max(140),
	description: z.string().max(300),
	imageUrl: z.string(),
	sharingMode: sharingModeSchema,
	likesCount: z.number(),
	likedByMe: z.boolean(),
	author: authorSummarySchema,
	createdAt: z.string(),
});
export type Photo = z.infer<typeof photoSchema>;

// Body for POST /api/photos and PUT /api/photos/:id
// NOTE: authorId is intentionally NOT part of this schema — it comes from
// req.user.id (set by the requireAuth middleware), never from client input.
export const createPhotoRequestSchema = z.object({
	title: z.string().min(1, 'Title is required.').max(140, 'Title must be 140 characters or fewer.'),
	description: z
		.string()
		.min(1, 'Description is required.')
		.max(300, 'Description must be 300 characters or fewer.'),
	sharingMode: sharingModeSchema,
});
export type CreatePhotoRequest = z.infer<typeof createPhotoRequestSchema>;

export const updatePhotoRequestSchema = createPhotoRequestSchema;
export type UpdatePhotoRequest = CreatePhotoRequest;

// Body for POST /api/albums/:id/photos — attaching a NEW photo directly into
// an album. Unlike a standalone photo post: title/description are optional
// (matches the now-nullable Prisma columns for non-standalone photos), and
// there's no sharingMode — the photo inherits its parent album's sharingMode
// instead of asking the client to specify one per photo.
export const addPhotoToAlbumRequestSchema = z.object({
	title: z.string().max(140, 'Title must be 140 characters or fewer.').optional(),
	description: z.string().max(300, 'Description must be 300 characters or fewer.').optional(),
});
export type AddPhotoToAlbumRequest = z.infer<typeof addPhotoToAlbumRequestSchema>;
