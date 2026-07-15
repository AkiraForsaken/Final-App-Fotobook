import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../schemas/env.js';

/**
 * Singleton pattern. Without this, `tsx watch`'s hot-reload would create a
 * fresh PrismaClient (and a fresh connection pool) on every file save,
 * eventually exhausting Postgres's max_connections in dev.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const adapter = new PrismaPg({
	connectionString: env.DATABASE_URL,
});

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
	});

globalForPrisma.prisma = prisma;
