import 'dotenv/config';
import { app } from './app.js';
import { env } from './schemas/env.js';
import { prisma } from './prisma/client.js';
import { scheduleTokenCleanup } from './jobs/cleanupTokens.job.js';

const PORT = env.PORT || 4000;
const server = app.listen(PORT, () => {
	console.log(
		env.NODE_ENV === 'production'
			? `API server running on production on port ${PORT}`
			: `API server running on http://localhost:${PORT}`
	);
	scheduleTokenCleanup();
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
