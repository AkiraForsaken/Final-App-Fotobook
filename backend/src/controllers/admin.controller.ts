import type { Request, Response } from 'express';
import * as photoService from '../services/photo.service.js';
import * as albumService from '../services/album.service.js';
import * as userService from '../services/user.service.js';

export async function listUsers(req: Request, res: Response) {
	const page = req.query.page ? Number(req.query.page) : 1;
	const take = req.query.take ? Number(req.query.take) : 40;
	const result = await userService.listUsers(req.user!.id, page, take);
	res.json(result);
}

export async function getUserById(req: Request, res: Response) {
	const userId = Number(req.params.id);
	const profile = await userService.getUserProfile(userId, req.user?.id ?? null);
	res.json(profile);
}

export async function setUserPassword(req: Request, res: Response) {
	const userId = Number(req.params.id);
	await userService.adminSetPassword(userId, req.body.newPassword);
	res.json({ message: 'Password updated. The user will need to log in again.' });
}

export async function adminUpdateUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	const profile = await userService.updateProfile(userId, req.body, req.file);
	res.json(profile);
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
	const page = req.query.page ? Number(req.query.page) : 1;
	const take = req.query.take ? Number(req.query.take) : 40;
	const result = await photoService.listPhotosAdmin({
		currentUserId: req.user?.id ?? null,
		page,
		take,
	});
	res.json(result);
}

export async function getAlbums(req: Request, res: Response) {
	const page = req.query.page ? Number(req.query.page) : 1;
	const take = req.query.take ? Number(req.query.take) : 40;
	const result = await albumService.listAlbumsAdmin({
		currentUserId: req.user?.id ?? null,
		page,
		take,
	});
	res.json(result);
}
