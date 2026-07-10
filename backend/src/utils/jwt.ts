import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AccessTokenPayload {
	sub: number; // userId
	role: 'user' | 'admin';
}

export interface RefreshTokenPayload {
	sub: number; // userId
	tokenId: number; // RefreshToken.id from DB
}

const ACCESS_TOKEN_SECRET: string = (() => {
	const secret = process.env.ACCESS_TOKEN_SECRET;
	if (!secret) {
		throw new Error('ACCESS_TOKEN_SECRET is not set — check your .env file.');
	}
	return secret;
})();

const REFRESH_TOKEN_SECRET: string = (() => {
	const secret = process.env.REFRESH_TOKEN_SECRET;
	if (!secret) {
		throw new Error('REFRESH_TOKEN_SECRET is not set — check your .env file.');
	}
	return secret;
})();

export function signAccessToken(payload: AccessTokenPayload): string {
	return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
	return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	// Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on failure —
	// the auth middlewares below catch this. Double-cast is deliberate:
	// jwt.verify()'s return type doesn't know about our payload shape.
	return jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
	return jwt.verify(token, REFRESH_TOKEN_SECRET) as unknown as RefreshTokenPayload;
}

// ── Token Hash (for storing refresh tokens securely in the database)

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}
