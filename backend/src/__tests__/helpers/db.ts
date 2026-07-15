import { prisma } from '../../prisma/client.js';

const TABLES = [
	'photo_likes',
	'album_likes',
	'album_photos',
	'photos',
	'albums',
	'follows',
	'refresh_tokens',
	'password_reset_tokens',
	'email_verification_tokens',
	'social_accounts',
	'users',
];

export async function truncateAll() {
	await prisma.$executeRawUnsafe(
		`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
	);
}
