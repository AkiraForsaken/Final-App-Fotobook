import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from '../schemas/env.js';
import { UnauthorizedError } from '../utils/app-error.js';
import * as authService from '../services/auth.service.js';
import type { AccessTokenPayload } from '../utils/jwt.js';

/**
 * Local strategy — used only by POST /api/auth/login.
 * Delegates the actual email/password + isActive/isEmailVerified checks to
 * authService.verifyCredentials so there's a single source of truth for
 * "what makes a valid login" (also reused by nothing else today, but keeps
 * the check out of the strategy itself).
 */
passport.use(
	'local',
	new LocalStrategy(
		{ usernameField: 'email', passwordField: 'password' },
		async (email, password, done) => {
			try {
				const user = await authService.verifyCredentials(email, password);
				return done(null, user);
			} catch (err) {
				if (err instanceof UnauthorizedError) {
					// Expected "bad credentials" case — surface as an auth failure,
					// not a thrown error, per passport-local convention.
					return done(null, false, { message: err.message });
				}
				// Unexpected (DB down, etc.) — let the centralized error handler deal with it.
				return done(err);
			}
		}
	)
);

/**
 * JWT strategy — used by requireAuth/optionalAuth on every protected route.
 * No DB round-trip here : access tokens are short-lived (15m), so a deactivated user
 * is caught at their next /refresh call, not mid-session. The email
 * verification gate is still enforced separately by requireVerifiedEmail,
 * which does its own DB check.
 */
passport.use(
	'jwt',
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: env.ACCESS_TOKEN_SECRET,
		},
		(payload: AccessTokenPayload, done) => {
			return done(null, { id: payload.sub, role: payload.role });
		}
	)
);

export { passport };
