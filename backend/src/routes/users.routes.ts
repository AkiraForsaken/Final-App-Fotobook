import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { updateUserRequestSchema, changePasswordRequestSchema } from '../schemas/auth.js';
import * as usersController from '../controllers/users.controller.js';
import { uploadAvatarImage } from '../middlewares/upload.js';
import { idParamsSchema } from '../schemas/common.js';

export const usersRouter = Router();

// Current user endpoints (requires auth)
usersRouter
	.route('/current/profile')
	.all(requireAuth)
	.get(usersController.getProfile)
	.put(uploadAvatarImage, validate(updateUserRequestSchema), usersController.updateProfile);

usersRouter.post(
	'/current/change-password',
	requireAuth,
	validate(changePasswordRequestSchema),
	usersController.changePassword
);

// Public profile endpoints
usersRouter.get(
	'/:id',
	optionalAuth,
	validate(idParamsSchema, 'params'),
	usersController.getPublicProfile
);

usersRouter
	.route('/:id/follow')
	.all(requireAuth, validate(idParamsSchema, 'params'))
	.post(usersController.followUser)
	.delete(usersController.unfollowUser);
