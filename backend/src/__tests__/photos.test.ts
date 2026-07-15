import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { createTestUser, createTestPhoto } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';

describe('Photo ownership', () => {
	it('forbids a non-owner from editing', async () => {
		const owner = await createTestUser({ email: 'owner@example.com' });
		const other = await createTestUser({ email: 'other2@example.com' });
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, other.email);

		const res = await request(app)
			.put(`/api/photos/${photo.id}`)
			.set(authHeader(accessToken))
			.field('title', 'Hacked')
			.field('description', 'x')
			.field('sharingMode', 'public');
		expect(res.status).toBe(403);
	});

	it('forbids a non-owner, non-admin from deleting', async () => {
		const owner = await createTestUser({ email: 'owner2@example.com' });
		const other = await createTestUser({ email: 'other3@example.com' });
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, other.email);

		const res = await request(app).delete(`/api/photos/${photo.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});

	it("allows an admin to delete someone else's photo", async () => {
		const owner = await createTestUser({ email: 'owner3@example.com' });
		const admin = await createTestUser({ email: 'admin3@example.com', role: 'admin' });
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, admin.email);

		const res = await request(app).delete(`/api/photos/${photo.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(204);
	});
});

describe('Like / unlike — idempotent (4.8)', () => {
	it('PUT :id/like twice does not error and stays liked', async () => {
		const owner = await createTestUser({ email: 'liker@example.com' });
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, owner.email);

		const first = await request(app)
			.put(`/api/photos/${photo.id}/like`)
			.set(authHeader(accessToken));
		const second = await request(app)
			.put(`/api/photos/${photo.id}/like`)
			.set(authHeader(accessToken));
		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(second.body.likedByMe).toBe(true);
	});

	it('DELETE :id/like on something never liked still succeeds', async () => {
		const owner = await createTestUser({ email: 'unliker@example.com' });
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, owner.email);

		const res = await request(app)
			.delete(`/api/photos/${photo.id}/like`)
			.set(authHeader(accessToken));
		expect(res.status).toBe(200);
		expect(res.body.likedByMe).toBe(false);
	});

	it('liking a nonexistent photo returns 404', async () => {
		const user = await createTestUser({ email: 'liker2@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const res = await request(app).put('/api/photos/999999/like').set(authHeader(accessToken));
		expect(res.status).toBe(404);
	});
});

describe('Params validation', () => {
	it('rejects a non-numeric :id', async () => {
		const user = await createTestUser({ email: 'validator@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const res = await request(app).delete('/api/photos/not-a-number').set(authHeader(accessToken));
		expect(res.status).toBe(400);
	});
});
