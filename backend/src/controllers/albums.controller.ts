import type { Request, Response } from 'express';
import * as albumService from '../services/album.service.js';
import { ValidationError } from '../utils/app-error.js';

export async function create(req: Request, res: Response) {
	const album = await albumService.createAlbum(req.user!.id, req.body);
	res.status(201).json(album);
}

export async function update(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const album = await albumService.updateAlbum(albumId, req.user!.id, req.body);
	res.json(album);
}

export async function remove(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	await albumService.deleteAlbum(albumId, req.user!.id, req.user!.role);
	res.status(204).send();
}

export async function like(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const result = await albumService.likeAlbum(albumId, req.user!.id);
	res.json(result);
}

export async function unlike(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const result = await albumService.unlikeAlbum(albumId, req.user!.id);
	res.json(result);
}

// Upload a brand-new photo directly into this album.
export async function addNewPhoto(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	if (!req.file) {
		throw new ValidationError('Please select an image to upload.');
	}
	const album = await albumService.addNewPhotoToAlbum(albumId, req.user!.id, req.body, req.file);
	res.status(201).json(album);
}

// Link one of the requester's existing photos into this album.
export async function addExistingPhoto(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const { photoId } = req.body;
	const album = await albumService.addExistingPhotoToAlbum(albumId, photoId, req.user!.id);
	res.status(201).json(album);
}

// Unlink (and, if orphaned + non-standalone, delete) a photo from this album.
export async function removePhoto(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const photoId = Number(req.params.photoId);
	const album = await albumService.removePhotoFromAlbum(albumId, photoId, req.user!.id);
	res.json(album);
}

export async function getById(req: Request, res: Response) {
	const albumId = Number(req.params.id);
	const album = await albumService.getAlbumById(
		albumId,
		req.user?.id ?? null,
		req.user?.role ?? 'user'
	);
	res.json(album);
}
