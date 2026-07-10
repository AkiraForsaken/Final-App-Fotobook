import type { Request, Response } from 'express';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';

export async function getPhotos(req: Request, res: Response) {
	const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
	const take = req.query.take ? Number(req.query.take) : 40;

	const photos = await photoService.listPhotosAdmin({
		currentUserId: req.user?.id ?? null,
		cursor,
		take,
	});

	res.json(photos);
}

export async function getAlbums(req: Request, res: Response) {
	const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
	const take = req.query.take ? Number(req.query.take) : 40;

	const albums = await albumService.listAlbumsAdmin({
		currentUserId: req.user?.id ?? null,
		cursor,
		take,
	});

	res.json(albums);
}
