import request from 'supertest';
import type { Express } from 'express';
import { RAW_PASSWORD } from './factories.js';

export async function loginAs(app: Express, email: string, password = RAW_PASSWORD) {
	const res = await request(app).post('/api/auth/login').send({ email, password });
	if (res.status !== 200)
		throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
	const setCookie = res.headers['set-cookie'] as unknown as string[];
	const refreshCookie = setCookie?.find((c) => c.startsWith('refreshToken='));
	return {
		accessToken: res.body.accessToken as string,
		refreshCookie: refreshCookie?.split(';')[0] ?? '',
		user: res.body.user,
	};
}

export function authHeader(accessToken: string) {
	return { Authorization: `Bearer ${accessToken}` };
}
