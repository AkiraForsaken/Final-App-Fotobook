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
	return follows.map((f) => f.followingId);
}

export async function feedPhotos(req: Request, res: Response) {
	const currentUserId = req.user?.id ?? null;
	const { cursor, take } = req.query as any;

	// Feed is empty for guests
	if (!currentUserId) {
		res.json({ items: [], nextCursor: null });
		return;
	}

	const authorIds = await getFollowedAuthorIds(currentUserId);
	const result = await photoService.listPublicPhotos({
		authorIds: authorIds,
		currentUserId,
		cursor: cursor ? parseInt(cursor as string, 10) : undefined,
		take: parseInt(take as string, 10),
	});
	res.json(result);
}

export async function discoveryPhotos(req: Request, res: Response) {
	const { cursor, take } = req.query as any;
	const photos = await photoService.listPublicPhotos({
		currentUserId: req.user?.id ?? null,
		cursor: cursor ? parseInt(cursor as string, 10) : undefined,
		take: parseInt(take as string, 10),
	});
	res.json(photos);
}

export async function feedAlbums(req: Request, res: Response) {
	const currentUserId = req.user?.id ?? null;
	const { cursor, take } = req.query as any;

	// Feed is empty for guests
	if (!currentUserId) {
		res.json({ items: [], nextCursor: null });
		return;
	}

	const authorIds = await getFollowedAuthorIds(currentUserId);
	const result = await albumService.listPublicAlbums({
		authorIds: authorIds,
		currentUserId,
		cursor: cursor ? parseInt(cursor as string, 10) : undefined,
		take: parseInt(take as string, 10),
	});
	res.json(result);
}

export async function discoveryAlbums(req: Request, res: Response) {
	const { cursor, take } = req.query as any;
	const photos = await albumService.listPublicAlbums({
		currentUserId: req.user?.id ?? null,
		cursor: cursor ? parseInt(cursor as string, 10) : undefined,
		take: parseInt(take as string, 10),
	});
	res.json(photos);
}
