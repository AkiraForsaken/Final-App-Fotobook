import type { Request, Response } from 'express';
import * as albumService from '../services/album.service.js';

export async function create(req: Request, res: Response) {
	const album = await albumService.createAlbum(req.user!.id, req.body);
	res.status(201).json(album);
}

export async function update(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const album = await albumService.updateAlbum(albumId, req.user!.id, req.user!.role, req.body);
	res.json(album);
}

export async function remove(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	await albumService.deleteAlbum(albumId, req.user!.id, req.user!.role);
	res.status(204).send();
}

export async function like(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const result = await albumService.likeAlbum(albumId, req.user!.id);
	res.json(result);
}

export async function unlike(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const result = await albumService.unlikeAlbum(albumId, req.user!.id);
	res.json(result);
}

// Returns a short-lived signed payload the client uses to upload images
export async function getUploadSignature(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const signature = await albumService.getAlbumUploadSignature(albumId, req.user!.id);
	res.json(signature);
}

// Persists every already-uploaded Cloudinary image as a Photo + AlbumPhoto
// row, all inside a single transaction.
export async function addPhotosBatch(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const album = await albumService.addPhotosToAlbumBatch(albumId, req.user!.id, req.body.photos);
	res.status(201).json(album);
}

// Link one of the requester's existing photos into this album.
export async function addExistingPhoto(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const { photoId } = req.body;
	const album = await albumService.addExistingPhotoToAlbum(albumId, photoId, req.user!.id);
	res.status(201).json(album);
}

// Unlink (and, if orphaned + non-standalone, delete) a photo from this album.
export async function removePhoto(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const photoId = req.params.photoId as unknown as number;
	const album = await albumService.removePhotoFromAlbum(albumId, photoId, req.user!.id);
	res.json(album);
}

export async function getById(req: Request, res: Response) {
	const albumId = req.params.id as unknown as number;
	const album = await albumService.getAlbumById(
		albumId,
		req.user?.id ?? null,
		req.user?.role ?? 'user'
	);
	res.json(album);
}
