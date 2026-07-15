import { z } from 'zod';

export const userSchema = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.email(),
	avatarUrl: z.string().optional(),
	followersCount: z.number(),
	followingCount: z.number(),
	photosCount: z.number(),
	albumsCount: z.number(),
	isActive: z.boolean(),
	isAdmin: z.boolean(),
	createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

// The trimmed-down author summary embedded in every Photo/Album
// defined once and reused by photo.ts/album.ts.
export const authorSummarySchema = userSchema.pick({
	id: true,
	firstName: true,
	lastName: true,
	avatarUrl: true,
});
export type AuthorSummary = z.infer<typeof authorSummarySchema>;

export const userProfileSchema = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string(),
	avatarUrl: z.string().optional(),
	publicPhotoCount: z.number(),
	publicAlbumCount: z.number(),
	followingCount: z.number(),
	followerCount: z.number(),
	isFollowedByMe: z.boolean(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// A user card shown in the Following / Followers tab
export const followRelationSchema = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string(),
	avatarUrl: z.string().optional(),
	isFollowedByMe: z.boolean(),
});
export type FollowRelation = z.infer<typeof followRelationSchema>;
