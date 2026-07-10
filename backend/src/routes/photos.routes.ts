import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createPhotoRequestSchema, updatePhotoRequestSchema } from '../schemas/photo.js';
import * as photosController from '../controllers/photos.controller.js';
import { uploadPhotoImage } from '../middlewares/upload.js';

export const photosRouter = Router();

photosRouter.post(
	'/',
	requireAuth,
	uploadPhotoImage,
	validate(createPhotoRequestSchema),
	photosController.create
);

photosRouter.put(
	'/:id',
	requireAuth,
	uploadPhotoImage,
	validate(updatePhotoRequestSchema),
	photosController.update
);

photosRouter.delete('/:id', requireAuth, photosController.remove);

photosRouter.post('/:id/like', requireAuth, photosController.toggleLike);
