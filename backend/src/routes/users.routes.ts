import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { updateUserRequestSchema, changePasswordRequestSchema } from '../schemas/auth.js';
import * as usersController from '../controllers/users.controller.js';
import { uploadAvatarImage } from '../middlewares/upload.js';

export const usersRouter = Router();

// Public profile endpoints
usersRouter.get('/:id', usersController.getPublicProfile);

// Current user endpoints (requires auth)
usersRouter.get('/current/profile', requireAuth, usersController.getProfile);

usersRouter.put(
	'/current/profile',
	requireAuth,
	uploadAvatarImage,
	validate(updateUserRequestSchema),
	usersController.updateProfile
);

usersRouter.post(
	'/current/change-password',
	requireAuth,
	validate(changePasswordRequestSchema),
	usersController.changePassword
);

// Follow/unfollow endpoints
usersRouter.post('/:id/follow', requireAuth, usersController.followUser);

usersRouter.delete('/:id/follow', requireAuth, usersController.unfollowUser);

// Admin endpoints
usersRouter.get('/users', requireAuth, requireAdmin, usersController.listUsers);

usersRouter.post('/:id/deactivate', requireAuth, requireAdmin, usersController.adminDeactivateUser);

usersRouter.post('/:id/reactivate', requireAuth, requireAdmin, usersController.adminReactivateUser);

usersRouter.delete('/:id', requireAuth, requireAdmin, usersController.adminDeleteUser);
