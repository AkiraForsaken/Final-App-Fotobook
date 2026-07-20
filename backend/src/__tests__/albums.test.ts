import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { createTestUser, createTestAlbum, createTestPhoto } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';

describe('Album ownership', () => {
	it('forbids a non-owner from deleting', async () => {
		const owner = await createTestUser({ email: 'aowner@example.com' });
		const other = await createTestUser({ email: 'aother@example.com' });
		const album = await createTestAlbum(owner.id);
		const { accessToken } = await loginAs(app, other.email);

		const res = await request(app).delete(`/api/albums/${album.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});
});

describe('Adding an existing photo to an album', () => {
	it("forbids adding another user's photo", async () => {
		const owner = await createTestUser({ email: 'aowner2@example.com' });
		const otherUser = await createTestUser({ email: 'aother2@example.com' });
		const album = await createTestAlbum(owner.id);
		const otherPhoto = await createTestPhoto(otherUser.id);
		const { accessToken } = await loginAs(app, owner.email);

		const res = await request(app)
			.post(`/api/albums/${album.id}/photos/existing`)
			.set(authHeader(accessToken))
			.send({ photoId: otherPhoto.id });
		expect(res.status).toBe(403);
	});

	it('rejects adding the same photo twice', async () => {
		const owner = await createTestUser({ email: 'aowner3@example.com' });
		const album = await createTestAlbum(owner.id);
		const photo = await createTestPhoto(owner.id);
		const { accessToken } = await loginAs(app, owner.email);

		await request(app)
			.post(`/api/albums/${album.id}/photos/existing`)
			.set(authHeader(accessToken))
			.send({ photoId: photo.id });
		const res = await request(app)
			.post(`/api/albums/${album.id}/photos/existing`)
			.set(authHeader(accessToken))
			.send({ photoId: photo.id });
		expect(res.status).toBe(409);
	});
});

describe('Like / unlike — idempotent (4.8)', () => {
	it('is safe to call repeatedly', async () => {
		const owner = await createTestUser({ email: 'aliker@example.com' });
		const album = await createTestAlbum(owner.id);
		const { accessToken } = await loginAs(app, owner.email);

		await request(app).put(`/api/albums/${album.id}/like`).set(authHeader(accessToken));
		const res = await request(app).put(`/api/albums/${album.id}/like`).set(authHeader(accessToken));
		expect(res.status).toBe(200);
	});
});

describe('GET /api/albums/:id — Single Album Visibility Rules', () => {
	it('allows a guest to view a public album', async () => {
		const owner = await createTestUser({ email: 'aowner1@example.com' });
		const album = await createTestAlbum(owner.id);

		const res = await request(app).get(`/api/albums/${album.id}`);
		expect(res.status).toBe(200);
		expect(res.body.id).toBe(album.id);
	});

	it('forbids a foreign user from viewing a private album', async () => {
		const owner = await createTestUser({ email: 'aowner2@example.com' });
		const other = await createTestUser({ email: 'aviewer2@example.com' });

		// Pass the override option so the factory creates a private album
		const album = await createTestAlbum(owner.id, { sharingMode: 'private' });
		const { accessToken } = await loginAs(app, other.email);

		const res = await request(app).get(`/api/albums/${album.id}`).set(authHeader(accessToken));
		expect(res.status).toBe(403);
	});
});
