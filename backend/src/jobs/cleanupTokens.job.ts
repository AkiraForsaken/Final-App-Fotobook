import cron from 'node-cron';
import { prisma } from '../prisma/client.js';

let isRunning = false; // guard against overlapping runs if one takes longer than the interval

export async function cleanupExpiredTokens(): Promise<void> {
	if (isRunning) {
		console.warn('[cleanupTokens] Previous run still in progress, skipping this tick.');
		return;
	}
	isRunning = true;
	const startedAt = new Date();

	try {
		const now = new Date();

		const [refreshTokens, resetTokens, verificationTokens] = await Promise.all([
			prisma.refreshToken.deleteMany({
				where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] },
			}),
			prisma.passwordResetToken.deleteMany({
				where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
			}),
			prisma.emailVerificationToken.deleteMany({
				where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
			}),
		]);

		console.log(
			`[cleanupTokens] ${startedAt.toISOString()} — removed ${refreshTokens.count} refresh, ` +
				`${resetTokens.count} reset, ${verificationTokens.count} verification tokens.`
		);
	} catch (err) {
		console.error('[cleanupTokens] Failed:', err);
	} finally {
		isRunning = false;
	}
}

export function scheduleTokenCleanup(): void {
	// Runs once at 03:00 server time every day — light traffic hour, avoids
	// competing with real user requests for DB connections.
	cron.schedule('0 3 * * *', () => {
		void cleanupExpiredTokens();
	});

	// Also run once at boot, in case the process was down when the last
	// scheduled run should have fired (Render/Railway restarts, deploys, etc.)
	void cleanupExpiredTokens();
}
