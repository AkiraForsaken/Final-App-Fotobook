import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../prisma/client.js';
import { createTestUser } from './helpers/factories.js';
import { loginAs, authHeader } from './helpers/auth.js';

describe('Discovery pagination (4.9)', () => {
	it('does not duplicate or skip records, even with identical timestamps', async () => {
		const author = await createTestUser({ email: 'prolific@example.com' });
		const sameTimestamp = new Date('2025-01-01T00:00:00Z');
		await prisma.photo.createMany({
			data: Array.from({ length: 13 }, (_, i) => ({
				authorId: author.id,
				title: `Photo ${i}`,
				description: 'x',
				sharingMode: 'public' as const,
				imageUrl: `/uploads/p${i}.jpg`,
				imageMimeType: 'image/jpeg',
				imageSizeBytes: 100,
				createdAt: sameTimestamp, // forces the id-tiebreaker path
			})),
		});

		const seenIds = new Set<number>();
		let cursor: number | null = null;
		let pages = 0;
		do {
			const res = await request(app)
				.get('/api/discovery/photos')
				.query({ take: 5, ...(cursor ? { cursor } : {}) });
			expect(res.status).toBe(200);
			for (const item of res.body.items) {
				expect(seenIds.has(item.id)).toBe(false);
				seenIds.add(item.id);
			}
			cursor = res.body.nextCursor;
			pages++;
			expect(pages).toBeLessThan(10); // guard against an infinite loop on a bug
		} while (cursor);

		expect(seenIds.size).toBe(13);
	});

	it('rejects take over the max cap', async () => {
		const res = await request(app).get('/api/discovery/photos').query({ take: 500 });
		expect(res.status).toBe(400);
	});

	it('returns nextCursor: null on the last page', async () => {
		const author = await createTestUser({ email: 'onephoto@example.com' });
		await prisma.photo.create({
			data: {
				authorId: author.id,
				title: 'Only one',
				description: 'x',
				sharingMode: 'public',
				imageUrl: '/uploads/only.jpg',
				imageMimeType: 'image/jpeg',
				imageSizeBytes: 100,
			},
		});
		const res = await request(app).get('/api/discovery/photos').query({ take: 20 });
		expect(res.body.nextCursor).toBeNull();
	});
});
