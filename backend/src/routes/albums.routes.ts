import { Router } from 'express';
import { optionalAuth, requireAuth, requireVerifiedEmail } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import {
	createAlbumRequestSchema,
	updateAlbumRequestSchema,
	addExistingPhotoToAlbumRequestSchema,
} from '../schemas/album.js';
import { idParamsSchema } from '../schemas/common.js';
import { batchAddPhotosToAlbumRequestSchema } from '../schemas/photo.js';
import * as albumsController from '../controllers/albums.controller.js';

export const albumsRouter = Router();

albumsRouter.post(
	'/',
	requireAuth,
	requireVerifiedEmail,
	validate(createAlbumRequestSchema),
	albumsController.create
);

albumsRouter.get(
	'/:id',
	optionalAuth,
	validate(idParamsSchema, 'params'),
	albumsController.getById
);

albumsRouter
	.route('/:id')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.put(validate(updateAlbumRequestSchema), albumsController.update)
	.delete(albumsController.remove);

albumsRouter
	.route('/:id/like')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.put(albumsController.like)
	.delete(albumsController.unlike);

// Direct-to-Cloudinary upload: get a signed payload for this album's folder.
albumsRouter.post(
	'/:id/upload-signature',
	requireAuth,
	requireVerifiedEmail,
	validate(idParamsSchema, 'params'),
	albumsController.getUploadSignature
);

// Persist everything the client already uploaded to Cloudinary, in one shot.
albumsRouter.post(
	'/:id/photos/batch',
	requireAuth,
	requireVerifiedEmail,
	validate(idParamsSchema, 'params'),
	validate(batchAddPhotosToAlbumRequestSchema),
	albumsController.addPhotosBatch
);

albumsRouter.post(
	'/:id/photos/existing',
	requireAuth,
	validate(idParamsSchema, 'params'),
	validate(addExistingPhotoToAlbumRequestSchema),
	albumsController.addExistingPhoto
);

albumsRouter.delete(
	'/:id/photos/:photoId',
	requireAuth,
	validate(idParamsSchema, 'params'),
	albumsController.removePhoto
);
