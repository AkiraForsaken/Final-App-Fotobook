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

describe('GET /api/photos/:id — Single Photo Visibility Rules', () => {
	it('allows a guest to view a public photo', async () => {
		const owner = await createTestUser({ email: 'powner1@example.com' });
		// assuming factory defaults or explicit field mapping sets public sharing
		const photo = await createTestPhoto(owner.id);

		const res = await request(app).get(`/api/photos/${photo.id}`);
		expect(res.status).toBe(200);
		expect(res.body.id).toBe(photo.id);
	});

	it('returns 403 when a guest or non-owner views a private photo', async () => {
		const owner = await createTestUser({ email: 'powner2@example.com' });
		// Pass the override option so the factory creates a private photo
		const photo = await createTestPhoto(owner.id, { sharingMode: 'private' });

		const other = await createTestUser({ email: 'pviewer2@example.com' });
		const { accessToken } = await loginAs(app, other.email);

		// Test as authenticated non-owner
		const res = await request(app).get(`/api/photos/${photo.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});

	it('allows the owner or an admin to view a private photo', async () => {
		const owner = await createTestUser({ email: 'powner3@example.com' });
		const admin = await createTestUser({ email: 'padmin3@example.com', role: 'admin' });
		const photo = await createTestPhoto(owner.id);

		// Owner check
		const { accessToken: ownerToken } = await loginAs(app, owner.email);
		const ownerRes = await request(app).get(`/api/photos/${photo.id}`).set(authHeader(ownerToken));
		expect(ownerRes.status).toBe(200);

		// Admin check
		const { accessToken: adminToken } = await loginAs(app, admin.email);
		const adminRes = await request(app).get(`/api/photos/${photo.id}`).set(authHeader(adminToken));
		expect(adminRes.status).toBe(200);
	});

	it('returns 404 for a nonexistent photo id', async () => {
		const res = await request(app).get('/api/photos/999999');
		expect(res.status).toBe(404);
	});
});
