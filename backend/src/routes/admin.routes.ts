import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import * as adminController from '../controllers/admin.controller.js';
import * as usersController from '../controllers/users.controller.js';
import { idParamsSchema, paginationQuerySchema } from '../schemas/common.js';

export const adminRouter = Router();

adminRouter.get('/users', requireAuth, requireAdmin, usersController.listUsers);

adminRouter.post(
	'/:id/deactivate',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	usersController.adminDeactivateUser
);

adminRouter.post(
	'/:id/reactivate',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	usersController.adminReactivateUser
);

adminRouter.delete(
	'/:id',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	usersController.adminDeleteUser
);

adminRouter.get(
	'/photos',
	requireAuth,
	requireAdmin,
	validate(paginationQuerySchema, 'query'),
	adminController.getPhotos
);

adminRouter.get(
	'/albums',
	requireAuth,
	requireAdmin,
	validate(paginationQuerySchema, 'query'),
	adminController.getAlbums
);
