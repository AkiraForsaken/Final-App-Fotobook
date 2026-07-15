import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createPhotoRequestSchema, updatePhotoRequestSchema } from '../schemas/photo.js';
import * as photosController from '../controllers/photos.controller.js';
import { uploadPhotoImage } from '../middlewares/upload.js';
import { idParamsSchema } from '../schemas/common.js';

export const photosRouter = Router();

photosRouter.post(
	'/',
	requireAuth,
	uploadPhotoImage,
	validate(createPhotoRequestSchema),
	photosController.create
);

photosRouter
	.route('/:id')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.put(uploadPhotoImage, validate(updatePhotoRequestSchema), photosController.update)
	.delete(photosController.remove);

photosRouter
	.route('/:id/like')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.put(photosController.like)
	.delete(photosController.unlike);
