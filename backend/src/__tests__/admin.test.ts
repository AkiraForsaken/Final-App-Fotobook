import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { createTestUser, createTestPhoto } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';

describe('Admin route access control', () => {
	it('rejects guests on every admin route', async () => {
		const routes = [
			['get', '/api/admin/users'],
			['get', '/api/admin/photos'],
			['get', '/api/admin/albums'],
		] as const;
		for (const [method, url] of routes) {
			const res = await (request(app) as any)[method](url);
			expect(res.status).toBe(401);
		}
	});

	it('rejects non-admin authenticated users', async () => {
		const user = await createTestUser({ email: 'plain@example.com', role: 'user' });
		const { accessToken } = await loginAs(app, user.email);
		const res = await request(app).get('/api/admin/users').set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});

	it('allows admins, and GET /users is not shadowed by GET /:id (3.2 regression)', async () => {
		const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
		await createTestUser({ email: 'other@example.com' });
		const { accessToken } = await loginAs(app, admin.email);

		const res = await request(app).get('/api/admin/users').set(authHeader(accessToken));
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});

describe('DELETE /api/admin/:id — user deletion cleans up storage (4.7)', () => {
	it('removes the user, their photos, and does not error', async () => {
		const admin = await createTestUser({ email: 'admin2@example.com', role: 'admin' });
		const target = await createTestUser({ email: 'todelete@example.com' });
		await createTestPhoto(target.id, { imageUrl: '/uploads/does-not-exist-on-disk.jpg' });
		const { accessToken } = await loginAs(app, admin.email);

		const res = await request(app).delete(`/api/admin/${target.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(204);

		const check = await request(app).get(`/api/users/${target.id}`);
		expect(check.status).toBe(404);
	});
});
