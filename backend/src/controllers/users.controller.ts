import type { Request, Response } from 'express';
import * as userService from '../services/user.service.js';

export async function getProfile(req: Request, res: Response) {
	const profile = await userService.getUserProfile(req.user!.id, req.user?.id ?? null);
	res.json(profile);
}

export async function updateProfile(req: Request, res: Response) {
	const profile = await userService.updateProfile(req.user!.id, req.body, req.file);
	res.json(profile);
}

export async function changePassword(req: Request, res: Response) {
	await userService.changePassword(req.user!.id, req.body);
	res.json({ message: 'Password changed successfully. Please log in again.' });
}

export async function getPublicProfile(req: Request, res: Response) {
	const userId = Number(req.params.id);
	const profile = await userService.getPublicUserProfile(userId, req.user?.id ?? null);
	res.json(profile);
}

export async function listUsers(req: Request, res: Response) {
	const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
	const take = req.query.take ? Number(req.query.take) : 20;
	const users = await userService.listUsers(req.user!.id, cursor, take);
	res.json(users);
}

export async function followUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	const result = await userService.followUser(req.user!.id, userId);
	res.json(result);
}

export async function unfollowUser(req: Request, res: Response) {
	const userId = Number(req.params.id);
	await userService.unfollowUser(req.user!.id, userId);
	res.json({ message: 'Unfollowed successfully.' });
}

// Admin endpoints

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
