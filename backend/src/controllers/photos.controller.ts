import type { Request, Response } from 'express';
import * as photoService from '../services/photo.service.js';
import { ValidationError } from '../utils/app-error.js';

export async function create(req: Request, res: Response) {
	if (!req.file) {
		throw new ValidationError('Please select an image to upload.');
	}
	const photo = await photoService.createPhoto(req.user!.id, req.body, req.file);
	res.status(201).json(photo);
}

export async function update(req: Request, res: Response) {
	const photoId = Number(req.params.id);
	const photo = await photoService.updatePhoto(photoId, req.user!.id, req.body, req.file);
	res.json(photo);
}

export async function remove(req: Request, res: Response) {
	const photoId = Number(req.params.id);
	await photoService.deletePhoto(photoId, req.user!.id, req.user!.role);
	res.status(204).send();
}

export async function toggleLike(req: Request, res: Response) {
	const photoId = Number(req.params.id);
	const result = await photoService.toggleLikePhoto(photoId, req.user!.id);
	res.json(result);
}
