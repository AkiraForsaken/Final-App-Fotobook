import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from '../utils/app-error.js';
import { ChangePasswordRequest, UpdateUserRequest } from '../schemas/auth.js';
import { storage } from './storage.service.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS, EMAIL_VERIFICATION_TOKEN_TTL_HOURS, hashToken } from '../utils/jwt.js';
import { sendVerificationEmail } from './email.service.js';
import {
	publicProfileSelect,
	toPublicProfileDto,
	toUserProfileDto,
	userProfileSelect,
} from '../utils/dto/user.dto.js';

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
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatarUrl: true, email: true },
	});
	if (!existingUser) {
		throw new NotFoundError('User not found');
	}
	let emailUpdateFields: Partial<Prisma.UserUpdateInput> = {};
	let verificationToken: { tokenHash: string; expiresAt: Date } | null = null;

	if (input.email) {
		const normalizedEmail = input.email.trim().toLowerCase();

		if (normalizedEmail !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
			if (emailExists) {
				throw new ConflictError('Email already in use');
			}

			const token = crypto.randomUUID();
			const tokenHash = hashToken(token);
			const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

			// Send BEFORE touching storage or the DB — if this fails, nothing
			// below runs and the profile is left completely untouched.
			await sendVerificationEmail({ email: normalizedEmail, firstName: input.firstName }, token);

			verificationToken = { tokenHash, expiresAt };
			emailUpdateFields = { email: normalizedEmail, isEmailVerified: false };
		}
	}

	let avatarFields: Partial<Prisma.UserUpdateInput> = {};
	let oldAvatarUrl: string | null = null;

	// Handle avatar upload
	if (file) {
		oldAvatarUrl = existingUser?.avatarUrl ?? null;
		const { url } = await storage.resolve(file);
		avatarFields = { avatarUrl: url };
	}

	// Handle user creation
	const user = await prisma.$transaction(async (tx) => {
		const updated = await tx.user.update({
			where: { id: userId },
			data: {
				firstName: input.firstName,
				lastName: input.lastName,
				...emailUpdateFields,
				...avatarFields,
			},
			select: userProfileSelect,
		});

		if (verificationToken) {
			await tx.emailVerificationToken.create({
				data: {
					userId,
					tokenHash: verificationToken.tokenHash,
					expiresAt: verificationToken.expiresAt,
				},
			});
			await tx.refreshToken.updateMany({
				where: { userId, revokedAt: null },
				data: { revokedAt: new Date() },
			});
		}

		return updated;
	});

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
		throw new ForbiddenError('Current password is incorrect.');
	}

	// New password must differ from current password
	const isSameAsOld = await bcrypt.compare(input.newPassword, user.passwordHash);
	if (isSameAsOld) {
		throw new ValidationError('New password must be different from your current password.');
	}

	// Hash new password
	const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

	// Update password + revoke token (atomic)
	await prisma.$transaction([
		prisma.user.update({
			where: { id: userId },
			data: { passwordHash: newPasswordHash },
		}),
		prisma.refreshToken.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		}),
	]);
}
