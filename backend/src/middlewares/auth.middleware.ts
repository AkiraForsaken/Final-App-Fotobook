import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/app-error.js';
import { ForbiddenError } from '../utils/app-error.js';

function extractBearerToken(req: Request): string | null {
	const header = req.headers.authorization;
	if (!header?.startsWith('Bearer ')) return null;
	return header.slice('Bearer '.length);
}

/** Use on routes that require a logged-in user (e.g. POST /api/photos). */

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
	const token = extractBearerToken(req);
	if (!token) {
		throw new UnauthorizedError('Please log in to continue.');
	}
	try {
		const payload = verifyAccessToken(token);
		req.user = { id: payload.sub, role: payload.role };
		next();
	} catch {
		throw new UnauthorizedError('Your session has expired. Please log in again.');
	}
}

/**
 * Use on routes guests can hit too, but that behave differently when
 * logged in (Feed/Discovery: `likedByMe` needs to know who's asking).
 * A missing or invalid token is NOT an error here — it just means
 * req.user stays undefined and the route treats the caller as a guest.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
	const header = req.headers.authorization;
	if (!header?.startsWith('Bearer ')) {
		next();
		return;
	}

	try {
		const payload = verifyAccessToken(header.slice('Bearer '.length));
		req.user = { id: payload.sub, role: payload.role };
	} catch {
		// Invalid/expired token on an optional route — proceed as a guest
		// rather than failing the request.
	}
	next();
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
