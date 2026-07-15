import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { env } from '../schemas/env.js';

const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const baseCookieOptions = {
	httpOnly: true,
	secure: env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
};

function setRefreshTokenCookie(res: Response, token: string, expiresAt?: Date) {
	const maxAge = expiresAt
		? Math.max(0, new Date(expiresAt).getTime() - Date.now())
		: REFRESH_TOKEN_COOKIE_MAX_AGE;
	res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, { ...baseCookieOptions, maxAge });
}

function clearRefreshTokenCookie(res: Response) {
	res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, baseCookieOptions);
}

export async function signup(req: Request, res: Response) {
	const result = await authService.signup(req.body);
	setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

	// Return user and access token (no refresh token in body for security)
	res.status(201).json({
		user: result.user,
		accessToken: result.accessToken,
	});
}

export async function login(req: Request, res: Response) {
	const result = await authService.login(req.body);
	setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

	res.json({
		user: result.user,
		accessToken: result.accessToken,
	});
}

export async function logout(req: Request, res: Response) {
	const refreshToken = req.cookies.refreshToken;
	if (refreshToken) {
		await authService.logout(refreshToken);
	}

	clearRefreshTokenCookie(res);
	res.json({ message: 'Logged out successfully.' });
}

export async function refresh(req: Request, res: Response) {
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) {
		return res.status(401).json({ error: 'Refresh token not found. Please log in again.' });
	}
	try {
		const result = await authService.refreshAccessToken(refreshToken);
		setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
		res.json({ user: result.user, accessToken: result.accessToken });
	} catch (err) {
		clearRefreshTokenCookie(res);
		throw err;
	}
}

export async function verifyEmail(req: Request, res: Response) {
	const result = await authService.verifyEmail(req.body);
	res.json(result);
}

export async function forgotPassword(req: Request, res: Response) {
	const result = await authService.forgotPassword(req.body);
	res.json(result);
}

export async function resetPassword(req: Request, res: Response) {
	const result = await authService.resetPassword(req.body);
	res.json(result);
}
