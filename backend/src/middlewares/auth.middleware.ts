import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/app-error.js';
import { ForbiddenError } from '../utils/app-error.js';
import { prisma } from '../prisma/client.js';
import passport from 'passport';
/** Use on routes that require a logged-in user (e.g. POST /api/photos). */

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
	passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
		if (err) return next(err);
		if (!user) {
			return next(new UnauthorizedError('Your session has expired. Please log in again.'));
		}
		req.user = user;
		next();
	})(req, res, next);
}

/**
 * Use on routes guests can hit too, but that behave differently when
 * logged in (Feed/Discovery: `likedByMe` needs to know who's asking).
 * A missing or invalid token is NOT an error here — it just means
 * req.user stays undefined and the route treats the caller as a guest.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
	passport.authenticate('jwt', { session: false }, (_err: unknown, user: Express.User | false) => {
		// <-- was AccessTokenPayload
		if (user) req.user = user;
		next();
	})(req, res, next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (!req.user) {
		throw new ForbiddenError('You must be authenticated to access this resource.');
	}

	if (req.user.role !== 'admin') {
		throw new ForbiddenError('You must be an admin to access this resource.');
	}

	next();
}

// auth.middleware.ts — new export
export async function requireVerifiedEmail(
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> {
	if (!req.user) throw new UnauthorizedError('Please log in to continue.');
	const user = await prisma.user.findUnique({
		where: { id: req.user.id },
		select: { isEmailVerified: true },
	});
	if (!user) throw new UnauthorizedError('Your session is no longer valid.');
	if (!user.isEmailVerified) {
		throw new ForbiddenError('Please verify your email before posting photos or albums.');
	}
	next();
}
