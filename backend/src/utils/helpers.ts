import { prisma } from '../prisma/client.js';

export const DEFAULT_COVER_URL = 'https://picsum.photos/seed/album-default/600/400';

export async function findFollowedAuthorIds(
	currentUserId: number | null,
	authorIds: number[]
): Promise<Set<number>> {
	if (!currentUserId || authorIds.length === 0) return new Set();
	const follows = await prisma.follow.findMany({
		where: { followerId: currentUserId, followingId: { in: authorIds } },
		select: { followingId: true },
	});
	return new Set(follows.map((follow) => follow.followingId));
}

export function paginateRows<T extends { id: number }>(rows: T[], take: number) {
	const hasMore = rows.length > take;
	const pageRows = hasMore ? rows.slice(0, take) : rows;
	const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;
	return { pageRows, nextCursor };
}
