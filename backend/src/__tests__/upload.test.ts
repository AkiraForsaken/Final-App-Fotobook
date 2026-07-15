import { describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import { app } from '../app.js';
import { createTestUser } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';
import { env } from '../schemas/env.js';

const TINY_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
	'base64'
);

function uploadDirCount() {
	return fs.existsSync(env.UPLOAD_DIR) ? fs.readdirSync(env.UPLOAD_DIR).length : 0;
}

describe('Photo upload validation', () => {
	it('rejects a wrong MIME type / extension', async () => {
		const user = await createTestUser({ email: 'uploader@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const before = uploadDirCount();

		const res = await request(app)
			.post('/api/photos')
			.set(authHeader(accessToken))
			.field('title', 'Bad file')
			.field('description', 'x')
			.field('sharingMode', 'public')
			.attach('image', Buffer.from('not an image'), {
				filename: 'test.txt',
				contentType: 'text/plain',
			});

		expect(res.status).toBe(400);
		expect(uploadDirCount()).toBe(before);
	});

	it('rejects a file over the size limit', async () => {
		const user = await createTestUser({ email: 'uploader2@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const oversized = Buffer.alloc(6 * 1024 * 1024); // 6MB > 5MB PHOTO_MAX_SIZE_BYTES

		const res = await request(app)
			.post('/api/photos')
			.set(authHeader(accessToken))
			.field('title', 'Too big')
			.field('description', 'x')
			.field('sharingMode', 'public')
			.attach('image', oversized, { filename: 'big.jpg', contentType: 'image/jpeg' });

		expect(res.status).toBe(400);
	});

	it('leaves no orphaned file when body validation fails after a valid file (3.8)', async () => {
		const user = await createTestUser({ email: 'uploader3@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const before = uploadDirCount();

		const res = await request(app)
			.post('/api/photos')
			.set(authHeader(accessToken))
			.field('title', '') // fails createPhotoRequestSchema's min-length check
			.field('description', 'x')
			.field('sharingMode', 'public')
			.attach('image', TINY_PNG, { filename: 'ok.png', contentType: 'image/png' });

		expect(res.status).toBe(400);
		expect(uploadDirCount()).toBe(before);
	});

	it('succeeds with a valid image and creates exactly one file', async () => {
		const user = await createTestUser({ email: 'uploader4@example.com' });
		const { accessToken } = await loginAs(app, user.email);
		const before = uploadDirCount();

		const res = await request(app)
			.post('/api/photos')
			.set(authHeader(accessToken))
			.field('title', 'Good photo')
			.field('description', 'A real one')
			.field('sharingMode', 'public')
			.attach('image', TINY_PNG, { filename: 'ok.png', contentType: 'image/png' });

		expect(res.status).toBe(201);
		expect(uploadDirCount()).toBe(before + 1);
	});
});
