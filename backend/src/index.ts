import 'dotenv/config';
import { app } from './app.js';
import { env } from './schemas/env.js';
import { prisma } from './prisma/client.js';

const PORT = env.PORT || 4000;
const server = app.listen(PORT, () => {
	console.log(`API server running on http://localhost:${PORT}`);
});

async function shutdown(signal: string) {
	console.log(`${signal} received, shutting down gracefully...`);
	server.close(async () => {
		try {
			await prisma.$disconnect();
		} finally {
			process.exit(0);
		}
	});
	setTimeout(() => process.exit(1), 1000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
