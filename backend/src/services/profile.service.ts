import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { roleToIsAdmin, dateToISO } from '../utils/dto-helpers.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/app-error.js';
import { ChangePasswordRequest, UpdateUserRequest } from '../schemas/auth.js';
import { storage } from './storage.service.js';
import { createEmailVerificationToken } from './auth.service.js';
import { env } from '../schemas/env.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, publicProfileSelect, toPublicProfileDto } from './user.service.js';

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
			photos: true,
			albums: true,
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
		isAdmin: roleToIsAdmin(row.role),
		createdAt: dateToISO(row.createdAt),
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
