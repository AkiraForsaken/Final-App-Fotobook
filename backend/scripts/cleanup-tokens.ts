import { prisma } from '../src/prisma/client.js';

async function cleanupExpiredTokens() {
	const now = new Date();

	const [refreshTokens, resetTokens, verificationTokens] = await Promise.all([
		prisma.refreshToken.deleteMany({
			where: {
				OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
			},
		}),
		prisma.passwordResetToken.deleteMany({
			where: {
				OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
			},
		}),
		prisma.emailVerificationToken.deleteMany({
			where: {
				OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
			},
		}),
	]);

	console.log(
		`Cleanup done — refreshTokens: ${refreshTokens.count}, resetTokens: ${resetTokens.count}, verificationTokens: ${verificationTokens.count}`
	);
}

cleanupExpiredTokens()
	.catch((err) => {
		console.error('Token cleanup failed:', err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
