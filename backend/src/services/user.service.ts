import type { Prisma } from '@prisma/client';
import { dateToISO } from '../utils/dto-helpers.js';

export const BCRYPT_ROUNDS = 10;

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

export {
	getUserProfile,
	getPublicUserProfile,
	updateProfile,
	changePassword,
} from './profile.service.js';

export {
	listUsers,
	adminSetPassword,
	deactivateUser,
	reactivateUser,
	deleteUser,
} from './admin-user.service.js';

export { listUserPhotos, listUserAlbums } from './user-content.service.js';

export {
	followUser,
	unfollowUser,
	listUserFollowers,
	listUserFollowing,
} from './follow.service.js';
