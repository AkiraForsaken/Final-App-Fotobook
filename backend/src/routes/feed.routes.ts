import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import * as feedController from '../controllers/feed.controller.js';

export const feedRouter = Router();

feedRouter.get('/photos', requireAuth, feedController.feedPhotos);
feedRouter.get('/albums', requireAuth, feedController.feedAlbums);

export const discoveryRouter = Router();

discoveryRouter.get('/photos', optionalAuth, feedController.discoveryPhotos);
discoveryRouter.get('/albums', optionalAuth, feedController.discoveryAlbums);
