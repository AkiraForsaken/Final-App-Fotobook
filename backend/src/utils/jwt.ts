import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../schemas/env.js';

export interface AccessTokenPayload {
	sub: number; // userId
	role: 'user' | 'admin';
}

const ACCESS_TOKEN_SECRET: string = (() => {
	const secret = env.ACCESS_TOKEN_SECRET;
	if (!secret) {
		throw new Error('ACCESS_TOKEN_SECRET is not set — check your .env file.');
	}
	return secret;
})();

const REFRESH_TOKEN_SECRET: string = (() => {
	const secret = env.REFRESH_TOKEN_SECRET;
	if (!secret) {
		throw new Error('REFRESH_TOKEN_SECRET is not set — check your .env file.');
	}
	return secret;
})();

export function generateOpaqueToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export function signAccessToken(payload: AccessTokenPayload): string {
	return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	// Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on failure
	// jwt.verify()'s return type doesn't know about our payload shape.
	return jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
}

// Token Hash (for storing refresh tokens securely in the database)
export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}
