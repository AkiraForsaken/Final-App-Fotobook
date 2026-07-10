import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import {
	createAlbumRequestSchema,
	updateAlbumRequestSchema,
	addExistingPhotoToAlbumRequestSchema,
} from '../schemas/album.js';
import { createPhotoRequestSchema } from '../schemas/photo.js';
import * as albumsController from '../controllers/albums.controller.js';
import { uploadPhotoImage } from '../middlewares/upload.js';

export const albumsRouter = Router();

albumsRouter.post('/', requireAuth, validate(createAlbumRequestSchema), albumsController.create);

albumsRouter.put('/:id', requireAuth, validate(updateAlbumRequestSchema), albumsController.update);

albumsRouter.delete('/:id', requireAuth, albumsController.remove);

albumsRouter.post('/:id/like', requireAuth, albumsController.toggleLike);

albumsRouter.post(
	'/:id/photos',
	requireAuth,
	uploadPhotoImage,
	validate(createPhotoRequestSchema),
	albumsController.addNewPhoto
);

albumsRouter.post(
	'/:id/photos/existing',
	requireAuth,
	validate(addExistingPhotoToAlbumRequestSchema),
	albumsController.addExistingPhoto
);

albumsRouter.delete('/:id/photos/:photoId', requireAuth, albumsController.removePhoto);
