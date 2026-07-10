import { z } from 'zod';
import { sharingModeSchema } from './common.js';
import { authorSummarySchema } from './user.js';

export const albumSchema = z.object({
	id: z.number(),
	title: z.string().max(140),
	description: z.string().max(300),
	coverImageUrl: z.string(),
	imageUrls: z.array(z.string()),
	sharingMode: sharingModeSchema,
	likesCount: z.number(),
	likedByMe: z.boolean(),
	author: authorSummarySchema,
	createdAt: z.string(),
});
export type Album = z.infer<typeof albumSchema>;

// Body for POST /api/albums and PUT /api/albums/:id
export const createAlbumRequestSchema = z.object({
	title: z.string().min(1, 'Title is required.').max(140, 'Title must be 140 characters or fewer.'),
	description: z
		.string()
		.min(1, 'Description is required.')
		.max(300, 'Description must be 300 characters or fewer.'),
	sharingMode: sharingModeSchema,
});
export type CreateAlbumRequest = z.infer<typeof createAlbumRequestSchema>;

export const updateAlbumRequestSchema = createAlbumRequestSchema;
export type UpdateAlbumRequest = CreateAlbumRequest;

// Body for POST /api/albums/:id/photos/existing
export const addExistingPhotoToAlbumRequestSchema = z.object({
	photoId: z.number().int().positive('photoId must be a positive integer.'),
});
export type AddExistingPhotoToAlbumRequest = z.infer<typeof addExistingPhotoToAlbumRequestSchema>;
