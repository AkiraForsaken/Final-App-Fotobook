import { prisma } from '../prisma/client.js';
import {
	NotFoundError,
	ForbiddenError,
	UnauthorizedError,
	ConflictError,
} from '../utils/app-error.js';
import { storage } from './storage.service.js';
import type { UpdateUserRequest, ChangePasswordRequest } from '../schemas/auth.js';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createEmailVerificationToken } from './auth.service.js';
import { env } from '../schemas/env.js';

const BCRYPT_ROUNDS = 10;

const userProfileSelect = {
	id: true,
	firstName: true,
	lastName: true,
	email: true,
	avatarUrl: true,
	_count: {
		select: {
			followers: true,
			following: true,
			photos: { where: { sharingMode: 'public' } },
			albums: { where: { sharingMode: 'public' } },
		},
	},
	// bio: true,
	isActive: true,
	role: true,
	createdAt: true,
} satisfies Prisma.UserSelect;

type UserProfileRow = Prisma.UserGetPayload<{ select: typeof userProfileSelect }>;

function toUserProfileDto(row: UserProfileRow) {
	return {
		id: row.id,
		firstName: row.firstName,
		lastName: row.lastName,
		email: row.email,
		avatarUrl: row.avatarUrl,
		followersCount: row._count.followers,
		followingCount: row._count.following,
		photosCount: row._count.photos,
		albumsCount: row._count.albums,
		// bio: row.bio,
		isActive: row.isActive,
		isAdmin: row.role === 'admin',
		createdAt: row.createdAt.toISOString(),
	};
}

const publicProfileSelect = (currentUserId: number | null) =>
	({
		id: true,
		firstName: true,
		lastName: true,
		avatarUrl: true,
		_count: {
			select: {
				followers: true,
				following: true,
				photos: { where: { sharingMode: 'public' } },
				albums: { where: { sharingMode: 'public' } },
			},
		},
		followers: {
			where: { followerId: currentUserId ?? -1 },
			select: { followerId: true },
			take: 1,
		},
		createdAt: true,
	}) satisfies Prisma.UserSelect;

type PublicProfileUserPayload = Prisma.UserGetPayload<{
	select: ReturnType<typeof publicProfileSelect>;
}>;

function toPublicProfileDto(user: PublicProfileUserPayload, currentUserId: number | null) {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		avatarUrl: user.avatarUrl,
		followerCount: user._count.followers,
		followingCount: user._count.following,
		publicPhotoCount: user._count.photos,
		publicAlbumCount: user._count.albums,
		isFollowedByMe: currentUserId ? user.followers.length > 0 : false,
		createdAt: user.createdAt.toISOString(),
	};
}

/**
 * Get person user's profile. (only for authorized)
 */
export async function getUserProfile(userId: number, currentUserId: number | null) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: userProfileSelect,
	});

	if (!user) throw new NotFoundError('User not found.');

	return toUserProfileDto(user);
}

/**
 * Get other user public profile data. (can be public for guests)
 */
export async function getPublicUserProfile(userId: number, currentUserId: number | null) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: publicProfileSelect(currentUserId),
	});
	if (!user) throw new NotFoundError('User not found.');
	return toPublicProfileDto(user, currentUserId);
}

/**
 * Update current user's profile information.
 */
export async function updateProfile(
	userId: number,
	input: UpdateUserRequest,
	file?: Express.Multer.File
) {
	let avatarFields: Partial<Prisma.UserUpdateInput> = {};
	let emailUpdateFields: Partial<Prisma.UserUpdateInput> = {};
	let oldAvatarUrl: string | null = null;

	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatarUrl: true, email: true },
	});
	if (!existingUser) {
		throw new NotFoundError('User not found');
	}
	// Handle avatar upload
	if (file) {
		oldAvatarUrl = existingUser?.avatarUrl ?? null;
		const { url } = await storage.resolve(file);
		avatarFields = { avatarUrl: url };
	}
	// Handle email change
	if (input.email) {
		const normalizedEmail = input.email.trim().toLowerCase();

		if (normalizedEmail !== existingUser.email) {
			// Ensure the new email doesn't exist
			const emailExists = await prisma.user.findUnique({
				where: { email: normalizedEmail },
			});
			if (emailExists) {
				throw new ConflictError('Email already in use');
			}
			emailUpdateFields = {
				email: normalizedEmail,
				isEmailVerified: false,
			};

			// Optional: If you want to revoke active sessions upon email change:
			// await revokeUserSessions(userId);
		}
	}

	const user = await prisma.user.update({
		where: { id: userId },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			...emailUpdateFields,
			...avatarFields,
		},
		select: userProfileSelect,
	});
	// Create token and send verification email
	if (emailUpdateFields.email) {
		const token = await createEmailVerificationToken(userId);
		const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';
		console.log(
			`[auth] Verification link for ${user.email}: ${baseUrl}/verify-email?token=${token}`
		);
		// TODO: replace with real email send once the email provider is implemented.
	}
	// Revoke session
	if (emailUpdateFields.email) {
		await prisma.refreshToken.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}

	// Only remove the old avatar file after the DB write succeeds.
	if (file && oldAvatarUrl) {
		await storage.remove(oldAvatarUrl);
	}

	if (emailUpdateFields.email) {
		// await sendVerificationEmail(user.email, emailUpdateFields.emailVerificationToken);
	}

	return toUserProfileDto(user);
}

/**
 * Change current user's password.
 */
export async function changePassword(userId: number, input: ChangePasswordRequest) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');

	// Verify current password
	const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
	if (!passwordMatches) {
		throw new UnauthorizedError('Current password is incorrect.');
	}

	// Hash new password
	const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

	// Update password
	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash: newPasswordHash },
	});

	await prisma.refreshToken.updateMany({
		where: { userId, revokedAt: null },
		data: { revokedAt: new Date() },
	});
}

/**
 * List all users for admin panel or discovery (with pagination).
 */
export async function listUsers(currentUserId: number, cursor?: number, take: number = 20) {
	const users = await prisma.user.findMany({
		where: { id: { not: currentUserId } }, // Don't list self
		select: userProfileSelect,
		orderBy: { createdAt: 'desc' },
		take,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});
	return users.map(toUserProfileDto);
}

/**
 * Follow another user.
 */
export async function followUser(followerId: number, followingId: number) {
	if (followerId === followingId) {
		throw new ForbiddenError('You cannot follow yourself.');
	}

	const target = await prisma.user.findUnique({ where: { id: followingId } });
	if (!target) throw new NotFoundError('User not found.');

	// Check if already following
	const existing = await prisma.follow.findUnique({
		where: { followerId_followingId: { followerId, followingId } },
	});
	if (existing) {
		return { alreadyFollowing: true };
	}

	await prisma.follow.create({
		data: { followerId, followingId },
	});
	return { alreadyFollowing: false };
}

/**
 * Unfollow another user.
 */
export async function unfollowUser(followerId: number, followingId: number) {
	await prisma.follow.deleteMany({
		where: { followerId, followingId },
	});
	return { unfollowed: true };
}

// Admin: Deactivate a user.
export async function deactivateUser(userId: number) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');

	await prisma.user.update({
		where: { id: userId },
		data: { isActive: false },
	});

	// Revoke all tokens for this user
	await prisma.refreshToken.updateMany({
		where: { userId, revokedAt: null },
		data: { revokedAt: new Date() },
	});
}

// Admin: Reactivate a user.
export async function reactivateUser(userId: number) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');

	await prisma.user.update({
		where: { id: userId },
		data: { isActive: true },
	});
}

// Admin: Delete a user (hard delete).
export async function deleteUser(userId: number) {
	const orphanedUrls = await prisma.$transaction(async (tx) => {
		const user = await tx.user.findUnique({
			where: { id: userId },
			select: {
				avatarUrl: true,
				photos: { select: { imageUrl: true } },
			},
		});
		if (!user) throw new NotFoundError('User not found.');

		await tx.user.delete({ where: { id: userId } }); // cascades photos, albums, tokens, follows, likes

		const urls = user.photos.map((p) => p.imageUrl);
		if (user.avatarUrl) urls.push(user.avatarUrl);
		return urls;
	});

	await Promise.all(
		orphanedUrls.map((url) =>
			storage.remove(url).catch((err) => {
				// storage.remove() already handles its own errors internally and
				// logs — this catch is just a defensive backstop in case that
				// contract changes later.
				console.error(`Failed to remove file during user deletion cleanup: ${url}`, err);
			})
		)
	);
}
