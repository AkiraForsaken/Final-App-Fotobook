import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { uploadPhotoImage } from '../middlewares/upload.js';
import {
	createAlbumRequestSchema,
	updateAlbumRequestSchema,
	addExistingPhotoToAlbumRequestSchema,
} from '../schemas/album.js';
import { idParamsSchema } from '../schemas/common.js';
import { createPhotoRequestSchema } from '../schemas/photo.js';
import * as albumsController from '../controllers/albums.controller.js';

export const albumsRouter = Router();

albumsRouter.post('/', requireAuth, validate(createAlbumRequestSchema), albumsController.create);

albumsRouter.put(
	'/:id',
	requireAuth,
	validate(idParamsSchema, 'params'),
	validate(updateAlbumRequestSchema),
	albumsController.update
);

albumsRouter.delete(
	'/:id',
	requireAuth,
	validate(idParamsSchema, 'params'),
	albumsController.remove
);

albumsRouter
	.route('/:id/like')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.put(albumsController.like)
	.delete(albumsController.unlike);

albumsRouter.post(
	'/:id/photos',
	requireAuth,
	uploadPhotoImage,
	validate(idParamsSchema, 'params'),
	validate(createPhotoRequestSchema),
	albumsController.addNewPhoto
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
