import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.get('/photos', requireAuth, requireAdmin, adminController.getPhotos);

adminRouter.get('/albums', requireAuth, requireAdmin, adminController.getAlbums);
