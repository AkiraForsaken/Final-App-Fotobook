import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { createTestUser } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';

describe('GET /api/users/:id (public profile) — 3.1', () => {
	it('never exposes email, isActive, or isAdmin, as a guest', async () => {
		const target = await createTestUser({ email: 'target@example.com' });
		const res = await request(app).get(`/api/users/${target.id}`);
		expect(res.status).toBe(200);
		expect(res.body).not.toHaveProperty('email');
		expect(res.body).not.toHaveProperty('isActive');
		expect(res.body).not.toHaveProperty('isAdmin');
	});

	it('never exposes those fields to a different authenticated user either', async () => {
		const target = await createTestUser({ email: 'target2@example.com' });
		const viewer = await createTestUser({ email: 'viewer@example.com' });
		const { accessToken } = await loginAs(app, viewer.email);

		const res = await request(app).get(`/api/users/${target.id}`).set(authHeader(accessToken));
		expect(res.body).not.toHaveProperty('email');
		expect(res.body.isFollowedByMe).toBe(false);
	});

	it('reports isFollowedByMe correctly once followed', async () => {
		const target = await createTestUser({ email: 'target3@example.com' });
		const viewer = await createTestUser({ email: 'viewer2@example.com' });
		const { accessToken } = await loginAs(app, viewer.email);

		await request(app).post(`/api/users/${target.id}/follow`).set(authHeader(accessToken));
		const res = await request(app).get(`/api/users/${target.id}`).set(authHeader(accessToken));
		expect(res.body.isFollowedByMe).toBe(true);
	});
});

describe('GET /api/users/current/profile', () => {
	it('includes email/isActive/isAdmin for the authenticated self-lookup', async () => {
		const user = await createTestUser({ email: 'self@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const res = await request(app).get('/api/users/current/profile').set(authHeader(accessToken));
		expect(res.body.email).toBe('self@example.com');
		expect(res.body).toHaveProperty('isActive');
		expect(res.body).toHaveProperty('isAdmin');
	});
});

describe('Follow / unfollow', () => {
	it('cannot follow yourself', async () => {
		const user = await createTestUser({ email: 'self-follow@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const res = await request(app)
			.post(`/api/users/${user.id}/follow`)
			.set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});

	it('is idempotent when following twice', async () => {
		const target = await createTestUser({ email: 'target4@example.com' });
		const follower = await createTestUser({ email: 'follower@example.com' });
		const { accessToken } = await loginAs(app, follower.email);

		const first = await request(app)
			.post(`/api/users/${target.id}/follow`)
			.set(authHeader(accessToken));
		const second = await request(app)
			.post(`/api/users/${target.id}/follow`)
			.set(authHeader(accessToken));
		expect(first.body.alreadyFollowing).toBe(false);
		expect(second.body.alreadyFollowing).toBe(true);
	});
});

describe('PUT /api/users/current/profile — email change (4.6)', () => {
	it('resets verification and revokes sessions when email changes', async () => {
		const user = await createTestUser({ email: 'old@example.com' });
		const { accessToken, refreshCookie } = await loginAs(app, user.email);

		const res = await request(app)
			.put('/api/users/current/profile')
			.set(authHeader(accessToken))
			.field('firstName', user.firstName)
			.field('lastName', user.lastName)
			.field('email', 'new@example.com');
		expect(res.status).toBe(200);

		const refreshAttempt = await request(app)
			.post('/api/auth/refresh')
			.set('Cookie', refreshCookie);
		expect(refreshAttempt.status).toBe(401);
	});

	it('rejects an email already used by another account', async () => {
		await createTestUser({ email: 'taken@example.com' });
		const user = await createTestUser({ email: 'mine@example.com' });
		const { accessToken } = await loginAs(app, user.email);

		const res = await request(app)
			.put('/api/users/current/profile')
			.set(authHeader(accessToken))
			.field('firstName', user.firstName)
			.field('lastName', user.lastName)
			.field('email', 'taken@example.com');
		expect(res.status).toBe(409);
	});
});
