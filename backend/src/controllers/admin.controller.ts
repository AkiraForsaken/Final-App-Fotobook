import type { Request, Response } from 'express';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';
import * as userService from '../services/user.service.js';

export async function listUsers(req: Request, res: Response) {
	const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
	const take = req.query.take ? Number(req.query.take) : 20;
	const users = await userService.listUsers(req.user!.id, cursor, take);
	res.json(users);
}

export async function adminDeactivateUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	await userService.deactivateUser(userId);
	res.json({ message: 'User deactivated.' });
}

export async function adminReactivateUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	await userService.reactivateUser(userId);
	res.json({ message: 'User reactivated.' });
}

export async function adminDeleteUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	await userService.deleteUser(userId);
	res.status(204).send();
}

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
