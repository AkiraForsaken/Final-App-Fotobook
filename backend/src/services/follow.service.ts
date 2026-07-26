import { prisma } from '../prisma/client.js';
import { ForbiddenError, NotFoundError } from '../utils/app-error.js';
import { publicProfileSelect, toPublicProfileDto } from './user.service.js';

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

interface OffsetFollowListOptions {
	targetUserId: number;
	currentUserId: number | null;
	offset?: number;
	take?: number;
}

/**
 * Paginate and list followers of target user (Limit-Offset style).
 */
export async function listUserFollowers({
	targetUserId,
	currentUserId,
	offset = 0,
	take = 10,
}: OffsetFollowListOptions) {
	const userExists = await prisma.user.findUnique({ where: { id: targetUserId } });
	if (!userExists) throw new NotFoundError('User not found.');

	const rows = await prisma.follow.findMany({
		where: { followingId: targetUserId },
		include: { follower: { select: publicProfileSelect(currentUserId) } },
		orderBy: { createdAt: 'desc' },
		take: take + 1, // Fetch one extra to check if there is a next page
		skip: offset,
	});

	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? offset + take : null;

	return {
		items: pageRows.map((row) => toPublicProfileDto(row.follower, currentUserId)),
		nextCursor, // Returns the next offset (number) to fetch, or null
	};
}

/**
 * Paginate and list whom target user is following (Limit-Offset style).
 */
export async function listUserFollowing({
	targetUserId,
	currentUserId,
	offset = 0,
	take = 10,
}: OffsetFollowListOptions) {
	const userExists = await prisma.user.findUnique({ where: { id: targetUserId } });
	if (!userExists) throw new NotFoundError('User not found.');

	const rows = await prisma.follow.findMany({
		where: { followerId: targetUserId },
		include: { following: { select: publicProfileSelect(currentUserId) } },
		orderBy: { createdAt: 'desc' },
		take: take + 1,
		skip: offset,
	});

	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? offset + take : null;

	return {
		items: pageRows.map((row) => toPublicProfileDto(row.following, currentUserId)),
		nextCursor, // Returns the next offset (number) to fetch, or null
	};
}
