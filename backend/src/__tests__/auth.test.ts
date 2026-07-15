import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../prisma/client.js';
import { createTestUser, RAW_PASSWORD } from './helpers/factories.js';
import { loginAs } from './helpers/auth.js';
import crypto from 'node:crypto';

function hashToken(token: string) {
	return crypto.createHash('sha256').update(token).digest('hex');
}

describe('POST /api/auth/signup', () => {
	it('creates a user and returns an access token + refresh cookie', async () => {
		const res = await request(app).post('/api/auth/signup').send({
			firstName: 'New',
			lastName: 'User',
			email: 'new@example.com',
			password: 'Password123!',
		});
		expect(res.status).toBe(201);
		expect(res.body.user.email).toBe('new@example.com');
		expect(res.body.accessToken).toBeTruthy();
		expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
	});

	it('rejects a duplicate email', async () => {
		await createTestUser({ email: 'dupe@example.com' });
		const res = await request(app).post('/api/auth/signup').send({
			firstName: 'New',
			lastName: 'User',
			email: 'dupe@example.com',
			password: 'Password123!',
		});
		expect(res.status).toBe(409);
	});

	it('rejects an invalid payload', async () => {
		const res = await request(app).post('/api/auth/signup').send({ email: 'not-an-email' });
		expect(res.status).toBe(400);
	});
});

describe('POST /api/auth/login', () => {
	it('logs in with correct credentials', async () => {
		await createTestUser({ email: 'login@example.com' });
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: 'login@example.com', password: RAW_PASSWORD });
		expect(res.status).toBe(200);
		expect(res.body.accessToken).toBeTruthy();
	});

	it('rejects a wrong password', async () => {
		await createTestUser({ email: 'login2@example.com' });
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: 'login2@example.com', password: 'WrongPass1!' });
		expect(res.status).toBe(401);
	});

	it('rejects a deactivated user', async () => {
		await createTestUser({ email: 'inactive@example.com', isActive: false });
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: 'inactive@example.com', password: RAW_PASSWORD });
		expect(res.status).toBe(401);
	});
});

describe('POST /api/auth/refresh', () => {
	it('returns a new access token and rotates the refresh cookie', async () => {
		const user = await createTestUser({ email: 'refresh@example.com' });
		const { refreshCookie } = await loginAs(app, user.email);

		const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
		expect(res.status).toBe(200);
		expect(res.body.accessToken).toBeTruthy();
		expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
	});

	it('rejects a missing refresh token', async () => {
		const res = await request(app).post('/api/auth/refresh');
		expect(res.status).toBe(401);
	});

	it('detects reuse of a rotated-away refresh token and revokes all sessions (3.3/3.4)', async () => {
		const user = await createTestUser({ email: 'reuse@example.com' });
		const { refreshCookie: tokenA } = await loginAs(app, user.email);

		const firstRefresh = await request(app).post('/api/auth/refresh').set('Cookie', tokenA);
		expect(firstRefresh.status).toBe(200);
		const tokenB = (firstRefresh.headers['set-cookie'] as unknown as string[])
			.find((c) => c.startsWith('refreshToken='))!
			.split(';')[0];

		// Reusing the now-rotated-away token A should fail...
		const reuseAttempt = await request(app).post('/api/auth/refresh').set('Cookie', tokenA);
		expect(reuseAttempt.status).toBe(401);

		// ...and should have revoked token B too (mass session revocation on reuse detection).
		const tokenBAttempt = await request(app).post('/api/auth/refresh').set('Cookie', tokenB);
		expect(tokenBAttempt.status).toBe(401);
	});

	it('allows exactly one winner under concurrent refresh of the same token (3.4)', async () => {
		const user = await createTestUser({ email: 'concurrent@example.com' });
		const { refreshCookie } = await loginAs(app, user.email);

		const [res1, res2] = await Promise.all([
			request(app).post('/api/auth/refresh').set('Cookie', refreshCookie),
			request(app).post('/api/auth/refresh').set('Cookie', refreshCookie),
		]);

		const statuses = [res1.status, res2.status].sort();
		expect(statuses).toEqual([200, 401]);
	});
});

describe('POST /api/auth/logout', () => {
	it('revokes the refresh token so it can no longer be used', async () => {
		const user = await createTestUser({ email: 'logout@example.com' });
		const { refreshCookie } = await loginAs(app, user.email);

		await request(app).post('/api/auth/logout').set('Cookie', refreshCookie);
		const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
		expect(res.status).toBe(401);
	});
});

describe('POST /api/auth/forgot-password + reset-password', () => {
	it('returns the same generic message whether or not the email exists (no enumeration)', async () => {
		await createTestUser({ email: 'exists@example.com' });
		const res1 = await request(app)
			.post('/api/auth/forgot-password')
			.send({ email: 'exists@example.com' });
		const res2 = await request(app)
			.post('/api/auth/forgot-password')
			.send({ email: 'doesnotexist@example.com' });
		expect(res1.status).toBe(200);
		expect(res2.status).toBe(200);
		expect(res1.body.message).toBe(res2.body.message);
	});

	it('allows a token to be used exactly once, even under concurrent requests', async () => {
		const rawToken = crypto.randomBytes(20).toString('hex');
		const tokenHash = hashToken(rawToken);
		const user = await createTestUser({ email: 'reset-race@example.com' });

		await prisma.passwordResetToken.create({
			data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
		});

		const [res1, res2] = await Promise.all([
			request(app)
				.post('/api/auth/reset-password')
				.send({ token: rawToken, newPassword: 'NewPassword1!' }),
			request(app)
				.post('/api/auth/reset-password')
				.send({ token: rawToken, newPassword: 'StolenPassword2!' }),
		]);

		const statuses = [res1.status, res2.status];
		expect(statuses).toContain(200);
		expect(statuses.some((s) => s >= 400)).toBe(true);

		const updated = await prisma.passwordResetToken.findFirst({ where: { tokenHash } });
		expect(updated?.usedAt).not.toBeNull();
	});

	it('rejects an already-used token on a subsequent request', async () => {
		const rawToken = crypto.randomBytes(20).toString('hex');
		const tokenHash = hashToken(rawToken);
		const user = await createTestUser({ email: 'reset-reuse@example.com' });
		await prisma.passwordResetToken.create({
			data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
		});

		const first = await request(app)
			.post('/api/auth/reset-password')
			.send({ token: rawToken, newPassword: 'NewPassword1!' });
		expect(first.status).toBe(200);

		const second = await request(app)
			.post('/api/auth/reset-password')
			.send({ token: rawToken, newPassword: 'AnotherPassword1!' });
		expect(second.status).toBe(409);
	});

	it('rejects an expired token', async () => {
		const rawToken = crypto.randomBytes(20).toString('hex');
		const tokenHash = hashToken(rawToken);
		const user = await createTestUser({ email: 'reset-expired@example.com' });
		await prisma.passwordResetToken.create({
			data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() - 1000) },
		});

		const res = await request(app)
			.post('/api/auth/reset-password')
			.send({ token: rawToken, newPassword: 'NewPassword1!' });
		expect(res.status).toBe(401);
	});
});
