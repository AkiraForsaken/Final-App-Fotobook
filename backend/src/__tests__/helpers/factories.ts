import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client.js';

export const RAW_PASSWORD = 'Password123!';

export async function createTestUser(
	overrides: Partial<{
		email: string;
		firstName: string;
		lastName: string;
		role: 'user' | 'admin';
		isActive: boolean;
		isEmailVerified: boolean;
	}> = {}
) {
	const passwordHash = await bcrypt.hash(RAW_PASSWORD, 10);
	return prisma.user.create({
		data: {
			firstName: overrides.firstName ?? 'Test',
			lastName: overrides.lastName ?? 'User',
			email:
				overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
			passwordHash,
			role: overrides.role ?? 'user',
			isActive: overrides.isActive ?? true,
			isEmailVerified: overrides.isEmailVerified ?? true,
		},
	});
}

export function createTestPhoto(
	authorId: number,
	overrides: Partial<{
		title: string;
		sharingMode: 'public' | 'private';
		imageUrl: string;
	}> = {}
) {
	return prisma.photo.create({
		data: {
			authorId,
			title: overrides.title ?? 'Test Photo',
			description: 'A test photo',
			sharingMode: overrides.sharingMode ?? 'public',
			imageUrl: overrides.imageUrl ?? '/uploads/test.jpg',
			imageMimeType: 'image/jpeg',
			imageSizeBytes: 1024,
			isStandalone: true,
		},
	});
}

export function createTestAlbum(
	authorId: number,
	overrides: Partial<{
		title: string;
		sharingMode: 'public' | 'private';
	}> = {}
) {
	return prisma.album.create({
		data: {
			authorId,
			title: overrides.title ?? 'Test Album',
			description: 'A test album',
			sharingMode: overrides.sharingMode ?? 'public',
		},
	});
}
