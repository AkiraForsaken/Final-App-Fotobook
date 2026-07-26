import { prisma } from '../prisma/client.js';
import { NotFoundError } from './app-error.js';
import { findFollowedAuthorIds, paginateRows } from './helpers.js';

interface PaginatedUserListOptions {
	targetUserId: number;
	currentUserId: number | null;
	currentUserRole: 'user' | 'admin';
	cursor?: number;
	take?: number;
}

interface ListUserContentConfig<TRow, TDto> {
	// Delegate functions keep Prisma type-safe without dynamic string hacking
	findMany: (args: any) => Promise<TRow[]>;
	findLikedIds: (currentUserId: number, contentIds: number[]) => Promise<number[]>;
	include: Record<string, unknown>;
	toDto: (row: TRow, likedIds: Set<number>, followedAuthorIds: Set<number>) => TDto;
	extraWhere?: Record<string, unknown>;
}

export async function listUserContent<TRow extends { id: number }, TDto>(
	{ targetUserId, currentUserId, currentUserRole, cursor, take = 10 }: PaginatedUserListOptions,
	config: ListUserContentConfig<TRow, TDto>
) {
	const userExists = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: { id: true },
	});
	if (!userExists) throw new NotFoundError('User not found.');

	const isOwnerOrAdmin = targetUserId === currentUserId || currentUserRole === 'admin';

	const rows = await config.findMany({
		where: {
			authorId: targetUserId,
			...(!isOwnerOrAdmin ? { sharingMode: 'public' } : {}),
			...config.extraWhere,
		},
		include: config.include,
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: take + 1,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
	});

	const { pageRows, nextCursor } = paginateRows(rows, take);
	const contentIds = pageRows.map((row) => row.id);

	const likedIds =
		currentUserId && contentIds.length
			? new Set(await config.findLikedIds(currentUserId, contentIds))
			: new Set<number>();

	const followedAuthorIds =
		currentUserId && currentUserId !== targetUserId
			? await findFollowedAuthorIds(currentUserId, [targetUserId])
			: new Set<number>();

	return {
		items: pageRows.map((row) => config.toDto(row, likedIds, followedAuthorIds)),
		nextCursor,
	};
}
