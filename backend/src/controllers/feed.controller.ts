import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';

export async function feedPhotos(req: Request, res: Response) {
	const currentUserId = req.user?.id ?? null;

	// Feed is empty for guests
	if (!currentUserId) {
		res.json([]);
		return;
	}

	const follows = await prisma.follow.findMany({
		where: { followerId: currentUserId },
		select: { followingId: true },
	});

	const photos = await photoService.listPublicPhotos({
		authorIds: follows.map((f: { followingId: number }) => f.followingId),
		currentUserId,
	});
	res.json(photos);
}

export async function discoveryPhotos(req: Request, res: Response) {
	const photos = await photoService.listPublicPhotos({
		currentUserId: req.user?.id ?? null,
	});
	res.json(photos);
}

export async function feedAlbums(req: Request, res: Response) {
	const currentUserId = req.user?.id ?? null;

	// Feed is empty for guests
	if (!currentUserId) {
		res.json([]);
		return;
	}

	const follows = await prisma.follow.findMany({
		where: { followerId: currentUserId },
		select: { followingId: true },
	});

	const photos = await albumService.listPublicAlbums({
		authorIds: follows.map((f: { followingId: number }) => f.followingId),
		currentUserId,
	});
	res.json(photos);
}

export async function discoveryAlbums(req: Request, res: Response) {
	const photos = await albumService.listPublicAlbums({
		currentUserId: req.user?.id ?? null,
	});
	res.json(photos);
}
