import { prisma } from '../prisma/client.js';
import { NotFoundError, ForbiddenError, UnauthorizedError } from '../utils/app-error.js';
import { logout } from './auth.service.js';
import { storage } from './storage.service.js';
import type { UpdateUserRequest, ChangePasswordRequest } from '../schemas/auth.js';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

const userProfileSelect = {
	id: true,
	firstName: true,
	lastName: true,
	email: true,
	avatarUrl: true,
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
		// bio: row.bio,
		isActive: row.isActive,
		isAdmin: row.role === 'admin',
		createdAt: row.createdAt.toISOString(),
	};
}

/**
 * Get a user's profile with follow stats (for profile page display).
 */
export async function getUserProfile(userId: number, currentUserId: number | null) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			_count: {
				select: {
					followers: true,
					following: true,
					photos: { where: { sharingMode: 'public' } },
					albums: { where: { sharingMode: 'public' } },
				},
			},
		},
	});

	if (!user) throw new NotFoundError('User not found.');

	// Check if current user follows this user
	const isFollowedByMe =
		currentUserId && currentUserId !== userId
			? await prisma.follow
					.findUnique({
						where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
					})
					.then((f) => !!f)
			: false;

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		avatarUrl: user.avatarUrl,
		// bio: user.bio,
		isActive: user.isActive,
		isAdmin: user.role === 'admin',
		followerCount: user._count.followers,
		followingCount: user._count.following,
		publicPhotoCount: user._count.photos,
		publicAlbumCount: user._count.albums,
		isFollowedByMe,
		createdAt: user.createdAt.toISOString(),
	};
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
	let oldAvatarUrl: string | null = null;

	if (file) {
		const existing = await prisma.user.findUnique({
			where: { id: userId },
			select: { avatarUrl: true },
		});
		oldAvatarUrl = existing?.avatarUrl ?? null;

		const { url } = await storage.resolve(file);
		avatarFields = { avatarUrl: url };
	}

	const user = await prisma.user.update({
		where: { id: userId },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			// bio: input.bio,
			...avatarFields,
		},
		select: userProfileSelect,
	});

	// Only remove the old avatar file after the DB write succeeds.
	if (file && oldAvatarUrl) {
		await storage.remove(oldAvatarUrl);
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
 * Get public user profile data for discovery/feed pages.
 */
export async function getUserPublicInfo(userId: number, currentUserId: number | null) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: userProfileSelect,
	});
	if (!user) throw new NotFoundError('User not found.');

	// Check if current user follows this user
	const isFollowedByMe =
		currentUserId && currentUserId !== userId
			? await prisma.follow
					.findUnique({
						where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
					})
					.then((f) => !!f)
			: false;

	return {
		...toUserProfileDto(user),
		isFollowedByMe,
	};
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
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');

	// Cascade delete: remove all user's data (DB should cascade if configured)
	await prisma.user.delete({ where: { id: userId } });
}
