import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';

async function getFollowedAuthorIds(userId: number | null): Promise<number[] | undefined> {
	if (!userId) return undefined;
	const follows = await prisma.follow.findMany({
		where: { followerId: userId },
		select: { followingId: true },
	});
	return [...follows.map((f) => f.followingId), userId];
}

type FeedHandler = (opts: {
	authorIds?: number[];
	currentUserId: number | null;
	cursor?: number;
	take: number;
}) => Promise<{ items: unknown; nextCursor: number | null }>;

function makeFeedHandler(serviceFn: FeedHandler, requireFollowed: boolean) {
	return async (req: Request, res: Response) => {
		const currentUserId = req.user?.id ?? null;
		const cursor = req.query.cursor ? (req.query.cursor as unknown as number) : undefined;
		const take = req.query.take ? (req.query.take as unknown as number) : 6;

		// Check for feeds
		if (requireFollowed && !currentUserId) {
			res.json({ items: [], nextCursor: null });
			return;
		}

		const authorIds = requireFollowed ? await getFollowedAuthorIds(currentUserId) : undefined;
		const result = await serviceFn({ authorIds, currentUserId, cursor, take });
		res.json(result);
	};
}

export const feedPhotos = makeFeedHandler(photoService.listPublicPhotos, true);
export const feedAlbums = makeFeedHandler(albumService.listPublicAlbums, true);
export const discoveryPhotos = makeFeedHandler(photoService.listPublicPhotos, false);
export const discoveryAlbums = makeFeedHandler(albumService.listPublicAlbums, false);
