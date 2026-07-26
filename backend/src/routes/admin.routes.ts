import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import * as adminController from '../controllers/admin.controller.js';
import { idParamsSchema, paginationQuerySchema } from '../schemas/common.js';
import { adminResetPasswordRequestSchema, updateUserRequestSchema } from '../schemas/auth.js';
import { uploadAvatarImage } from '../middlewares/upload.js';

export const adminRouter = Router();

adminRouter.get('/users', requireAuth, requireAdmin, adminController.listUsers);

adminRouter
	.route('/users/:id')
	.all(requireAuth, requireAdmin, validate(idParamsSchema, 'params'))
	.get(adminController.getUserById)
	.put(uploadAvatarImage, validate(updateUserRequestSchema), adminController.adminUpdateUser);

adminRouter.put(
	'/users/:id/password',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	validate(adminResetPasswordRequestSchema),
	adminController.setUserPassword
);

adminRouter.post(
	'/:id/deactivate',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	adminController.adminDeactivateUser
);

adminRouter.post(
	'/:id/reactivate',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	adminController.adminReactivateUser
);

adminRouter.delete(
	'/:id',
	requireAuth,
	requireAdmin,
	validate(idParamsSchema, 'params'),
	adminController.adminDeleteUser
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
