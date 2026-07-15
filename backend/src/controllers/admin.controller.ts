import type { Request, Response } from 'express';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';

export async function getPhotos(req: Request, res: Response) {
	const { cursor, take } = req.query as unknown as { cursor?: number; take: number }; // can add type query validate variant later
	const result = await photoService.listPhotosAdmin({
		currentUserId: req.user?.id ?? null,
		cursor,
		take,
	});
	res.json(result);
}

export async function getAlbums(req: Request, res: Response) {
	const { cursor, take } = req.query as unknown as { cursor?: number; take: number };
	const result = await albumService.listAlbumsAdmin({
		currentUserId: req.user?.id ?? null,
		cursor,
		take,
	});
	res.json(result);
}
