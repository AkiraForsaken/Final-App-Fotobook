import { beforeEach, afterAll } from 'vitest';
import { truncateAll } from './db.js';
import { prisma } from '../../prisma/client.js';

beforeEach(async () => {
	await truncateAll();
});

afterAll(async () => {
	await prisma.$disconnect();
});
