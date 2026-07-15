import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import * as feedController from '../controllers/feed.controller.js';
import { validate } from '../middlewares/validate.js';
import { paginationQuerySchema } from '../schemas/common.js';

export const feedRouter = Router();

feedRouter.get('/photos', requireAuth, validate(paginationQuerySchema), feedController.feedPhotos);
feedRouter.get('/albums', requireAuth, validate(paginationQuerySchema), feedController.feedAlbums);

export const discoveryRouter = Router();

discoveryRouter.get(
	'/photos',
	optionalAuth,
	validate(paginationQuerySchema),
	feedController.discoveryPhotos
);
discoveryRouter.get(
	'/albums',
	optionalAuth,
	validate(paginationQuerySchema),
	feedController.discoveryAlbums
);
