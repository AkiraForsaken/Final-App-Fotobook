import { Prisma } from '@prisma/client';
import { roleToIsAdmin, dateToISO } from '../dto-helpers.js';

export function toAuthUserDto(user: {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl: string | null;
	isActive: boolean;
	role: 'user' | 'admin';
	createdAt: Date;
}) {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		avatarUrl: user.avatarUrl,
		isActive: user.isActive,
		isAdmin: roleToIsAdmin(user.role),
		createdAt: dateToISO(user.createdAt),
	};
}

export const publicProfileSelect = (currentUserId: number | null) =>
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

export function toPublicProfileDto(user: PublicProfileUserPayload, currentUserId: number | null) {
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
		createdAt: dateToISO(user.createdAt),
	};
}

export const adminUserSummarySelect = {
	id: true,
	firstName: true,
	lastName: true,
	email: true,
	avatarUrl: true,
	isActive: true,
	role: true,
	createdAt: true,
	lastLoginAt: true,
} satisfies Prisma.UserSelect;
type AdminUserSummaryRow = Prisma.UserGetPayload<{ select: typeof adminUserSummarySelect }>;

export function toAdminUserSummaryDto(row: AdminUserSummaryRow) {
	return {
		id: row.id,
		firstName: row.firstName,
		lastName: row.lastName,
		email: row.email,
		avatarUrl: row.avatarUrl,
		isActive: row.isActive,
		isAdmin: roleToIsAdmin(row.role),
		createdAt: dateToISO(row.createdAt),
		lastLoginAt: row.lastLoginAt ? dateToISO(row.lastLoginAt) : null,
	};
}

export const userProfileSelect = {
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
	isEmailVerified: true,
	isActive: true,
	role: true,
	createdAt: true,
} satisfies Prisma.UserSelect;

type UserProfileRow = Prisma.UserGetPayload<{ select: typeof userProfileSelect }>;

export function toUserProfileDto(row: UserProfileRow) {
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
		isEmailVerified: row.isEmailVerified,
		isActive: row.isActive,
		isAdmin: roleToIsAdmin(row.role),
		createdAt: dateToISO(row.createdAt),
	};
}
