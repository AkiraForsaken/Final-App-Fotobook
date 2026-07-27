import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { NotFoundError } from '../utils/app-error.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../utils/jwt.js';
import { storage } from './storage.service.js';
import { adminUserSummarySelect, toAdminUserSummaryDto } from '../utils/dto/user.dto.js';

/**
 * List all users for admin panel or discovery (with pagination).
 */
export async function listUsers(currentUserId: number, page: number = 1, take: number = 40) {
	const where: Prisma.UserWhereInput = { id: { not: currentUserId } };

	const [rows, totalItems] = await Promise.all([
		prisma.user.findMany({
			where,
			select: adminUserSummarySelect,
			orderBy: [{ lastLoginAt: 'asc' }, { createdAt: 'desc' }],
			take,
			skip: (page - 1) * take,
		}),
		prisma.user.count({ where }),
	]);

	return {
		items: rows.map(toAdminUserSummaryDto),
		page,
		pageSize: take,
		totalItems,
		totalPages: Math.max(1, Math.ceil(totalItems / take)),
	};
}

/**
 * Admin: set a user's password directly — This is an admin override.
 * Revokes only the TARGET user's active sessions so they must sign in again
 * with the new password — the calling admin's own session is untouched.
 */
export async function adminSetPassword(userId: number, newPassword: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new NotFoundError('User not found.');

	const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash: newPasswordHash },
	});

	await prisma.refreshToken.updateMany({
		where: { userId, revokedAt: null },
		data: { revokedAt: new Date() },
	});
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

		await tx.user.delete({ where: { id: userId } });

		const urls = user.photos.map((p) => p.imageUrl);
		if (user.avatarUrl) urls.push(user.avatarUrl);
		return urls;
	});

	await Promise.all(
		orphanedUrls.map((url) =>
			storage.remove(url).catch((err) => {
				console.error(`Failed to remove file during user deletion cleanup: ${url}`, err);
			})
		)
	);
}
