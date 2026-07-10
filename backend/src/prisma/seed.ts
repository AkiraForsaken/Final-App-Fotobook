import { PrismaClient, SharingMode, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { env } from 'process';

const adapter = new PrismaPg({
	connectionString: env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Starting database seeding using Frieren & co. mock data...');

	// 1. Clean up old data in correct dependency order
	console.log('Cleaning existing data...');
	await prisma.albumPhoto.deleteMany({});
	await prisma.albumLike.deleteMany({});
	await prisma.photoLike.deleteMany({});
	await prisma.follow.deleteMany({});
	await prisma.album.deleteMany({});
	await prisma.photo.deleteMany({});
	await prisma.user.deleteMany({});

	// 2. Setup reusable password hash (Use 'Password123!' to log in as anyone)
	const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

	// 3. Insert Users matching specified explicit IDs
	console.log('Seeding users...');
	const usersData = [
		{
			id: 1,
			firstName: 'Frieren',
			lastName: 'The Mage',
			email: 'frieren@example.com',
			avatarUrl: '/assets/frieren.jpeg',
		},
		{
			id: 2,
			firstName: 'Fern',
			lastName: 'The Mage',
			email: 'fern@example.com',
			avatarUrl: '/assets/fern.jpeg',
		},
		{
			id: 3,
			firstName: 'Stark',
			lastName: 'The Warrior',
			email: 'stark@example.com',
			avatarUrl: '/assets/stark.jpeg',
		},
		{
			id: 4,
			firstName: 'Himmel',
			lastName: 'The Hero',
			email: 'himmel@example.com',
			avatarUrl: '/assets/himmel.jpeg',
		},
		{
			id: 5,
			firstName: 'Heiter',
			lastName: 'The Priest',
			email: 'heiter@example.com',
			avatarUrl: '/assets/heiter.jpeg',
		},
		{
			id: 6,
			firstName: 'Eisen',
			lastName: 'The Warrior',
			email: 'eisen@example.com',
			avatarUrl: '/assets/eisen.jpeg',
		},
		{
			id: 7,
			firstName: 'Serie',
			lastName: 'The Living Grimmoir',
			email: 'serie@example.com',
			avatarUrl: '/assets/serie.jpeg',
		},
		{
			id: 8,
			firstName: 'Flamme',
			lastName: 'The Great Mage',
			email: 'flamme@example.com',
			avatarUrl: '/assets/flamme.jpeg',
		},
	];

	for (const u of usersData) {
		await prisma.user.create({
			data: {
				id: u.id,
				firstName: u.firstName,
				lastName: u.lastName,
				email: u.email,
				passwordHash: defaultPasswordHash,
				avatarUrl: u.avatarUrl,
				role: u.id === 7 ? UserRole.admin : UserRole.user, // Let Serie be the admin
				isEmailVerified: true,
				isActive: true,
			},
		});
	}

	// 4. Seed Follows graph from Profile 1 data
	console.log('Seeding follows...');
	await prisma.follow.createMany({
		data: [
			// Frieren's followings
			{ followerId: 1, followingId: 3 }, // Frieren follows Stark
			{ followerId: 1, followingId: 2 }, // Frieren follows Fern
			{ followerId: 1, followingId: 6 }, // Frieren follows Eisen
			// Frieren's followers
			{ followerId: 5, followingId: 1 }, // Heiter follows Frieren
			{ followerId: 7, followingId: 1 }, // Serie follows Frieren
			{ followerId: 3, followingId: 1 }, // Stark follows Frieren
			{ followerId: 4, followingId: 1 }, // Himmel follows Frieren
		],
	});

	// 5. Seed Photos (Feed photos + Profile 1 private photo)
	console.log('Seeding photos...');
	const photosData = [
		{
			id: 1,
			authorId: 2,
			title: 'Magic in the Forest',
			description: 'A serene view from our adventure in the ancient woods.',
			imageUrl: '/assets/fern.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-10T09:00:00Z'),
		},
		{
			id: 2,
			authorId: 1,
			title: 'Above the Clouds',
			description: 'Portrait at sunset after a long day of traveling.',
			imageUrl: '/assets/frieren.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-09T17:30:00Z'),
		},
		{
			id: 3,
			authorId: 3,
			title: 'Battle Ready',
			description: 'Stark in his finest armor, just before the big fight.',
			imageUrl: '/assets/stark.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-08T12:00:00Z'),
		},
		{
			id: 7,
			authorId: 2,
			title: 'Spellweaving at Dusk',
			description: 'An experimental spell gone beautifully wrong.',
			imageUrl: 'https://picsum.photos/seed/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-04T20:00:00Z'),
		},
		{
			id: 8,
			authorId: 3,
			title: 'The Silent Summit',
			description: 'After three days of climbing, silence was the reward.',
			imageUrl: 'https://picsum.photos/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-03T07:45:00Z'),
		},
		{
			id: 9,
			authorId: 1,
			title: 'Library of the Ancients',
			description: 'Frieren browsing grimoires older than most civilizations.',
			imageUrl: 'https://picsum.photos/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-02T11:20:00Z'),
		},
		{
			id: 199,
			authorId: 1,
			title: 'Private Spellbook Study',
			description: 'Deciphering scripts alone in the evening. (Private to me)',
			imageUrl: 'https://picsum.photos/seed/priv/600/600',
			sharingMode: SharingMode.private,
			createdAt: new Date('2026-06-10T08:00:00Z'),
		},
	];

	for (const p of photosData) {
		await prisma.photo.create({
			data: {
				id: p.id,
				authorId: p.authorId,
				title: p.title,
				description: p.description,
				sharingMode: p.sharingMode,
				imageUrl: p.imageUrl,
				imageMimeType: 'image/jpeg', // Default schema requirement fallback
				imageSizeBytes: 1024 * 500, // Standard 500kb placeholder size
				createdAt: p.createdAt,
			},
		});
	}

	console.log('📖 Seeding Discovery Albums & handling inline Photo generation...');
	const structuralAlbums = [
		{
			id: 201,
			authorId: 7,
			title: 'The Great Library',
			description: "Serie's personal archive of forbidden knowledge.",
			coverImageUrl: 'https://picsum.photos/seed/da201/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da201a/400/400',
				'https://picsum.photos/seed/da201b/400/400',
			],
			createdAt: '2024-06-11T10:00:00Z',
		},
		{
			id: 202,
			authorId: 8,
			title: "Flamme's Travels",
			description: 'Before she became a legend, she was just a traveller.',
			coverImageUrl: 'https://picsum.photos/seed/da202/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da202a/400/400',
				'https://picsum.photos/seed/da202b/400/400',
				'https://picsum.photos/seed/da202c/400/400',
			],
			createdAt: '2024-06-09T14:00:00Z',
		},
		{
			id: 203,
			authorId: 2,
			title: 'Magic in Practice',
			description: "Fern's field notes, illustrated.",
			coverImageUrl: 'https://picsum.photos/seed/da203/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da203a/400/400',
				'https://picsum.photos/seed/da203b/400/400',
			],
			createdAt: '2024-06-07T08:00:00Z',
		},
		{
			id: 204,
			authorId: 4,
			title: 'Battles We Won',
			description: 'Himmel insisted on documenting every victory.',
			coverImageUrl: 'https://picsum.photos/seed/da204/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da204a/400/400',
				'https://picsum.photos/seed/da204b/400/400',
				'https://picsum.photos/seed/da204c/400/400',
				'https://picsum.photos/seed/da204d/400/400',
			],
			createdAt: '2024-06-05T16:00:00Z',
		},
		{
			id: 205,
			authorId: 6,
			title: 'Northern Wilds',
			description: "Eisen's solo expedition into uncharted mountain territory.",
			coverImageUrl: 'https://picsum.photos/seed/da205/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da205a/400/400',
				'https://picsum.photos/seed/da205b/400/400',
			],
			createdAt: '2024-06-03T10:00:00Z',
		},
		{
			id: 206,
			authorId: 5,
			title: 'Blessings and Beyond',
			description: "Heiter's travels to the most remote shrines.",
			coverImageUrl: 'https://picsum.photos/seed/da206/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da206a/400/400',
				'https://picsum.photos/seed/da206b/400/400',
			],
			createdAt: '2024-06-01T07:30:00Z',
		},
		{
			id: 207,
			authorId: 1,
			title: 'Stars and Spells',
			description: "A mage's guide to celestial magic.",
			coverImageUrl: 'https://picsum.photos/seed/da207/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da207a/400/400',
				'https://picsum.photos/seed/da207b/400/400',
				'https://picsum.photos/seed/da207c/400/400',
			],
			createdAt: '2024-05-30T22:00:00Z',
		},
		{
			id: 208,
			authorId: 3,
			title: 'Hero in Training',
			description: "Stark's first year as a proper adventurer.",
			coverImageUrl: 'https://picsum.photos/seed/da208/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da208a/400/400',
				'https://picsum.photos/seed/da208b/400/400',
			],
			createdAt: '2024-05-28T13:00:00Z',
		},
		{
			id: 209,
			authorId: 7,
			title: 'Knowledge Preserved',
			description: 'Serie cataloguing spells lost to time.',
			coverImageUrl: 'https://picsum.photos/seed/da209/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da209a/400/400',
				'https://picsum.photos/seed/da209b/400/400',
				'https://picsum.photos/seed/da209c/400/400',
			],
			createdAt: '2024-05-26T09:00:00Z',
		},
		{
			id: 210,
			authorId: 8,
			title: 'Embers of the Past',
			description: 'Flamme revisited, through those she inspired.',
			coverImageUrl: 'https://picsum.photos/seed/736/736',
			imageUrls: [
				'https://picsum.photos/seed/da210a/400/400',
				'https://picsum.photos/seed/da210b/400/400',
				'https://picsum.photos/seed/da210c/400/400',
			],
			createdAt: '2024-05-24T17:00:00Z',
		},
	];

	// Global counter tracking inline photo IDs dynamically to avoid sequence stepping conflicts
	let inlinePhotoIdCounter = 1000;

	for (const a of structuralAlbums) {
		// Build the Cover Photo as an isolated record first to satisfy the 1:1 schema mapping context
		const coverPhotoRecord = await prisma.photo.create({
			data: {
				id: inlinePhotoIdCounter++,
				authorId: a.authorId,
				title: `${a.title} - Cover`,
				description: `Cover photo for ${a.title}`,
				imageUrl: a.coverImageUrl,
				imageMimeType: 'image/jpeg',
				imageSizeBytes: 420000,
				sharingMode: SharingMode.public,
				createdAt: new Date(a.createdAt),
			},
		});

		// Build the Album record linked to the cover photo's unique identifier
		const albumRecord = await prisma.album.create({
			data: {
				id: a.id,
				authorId: a.authorId,
				title: a.title,
				description: a.description,
				sharingMode: SharingMode.public,
				coverPhotoId: coverPhotoRecord.id,
				createdAt: new Date(a.createdAt),
			},
		});

		// Associate the Cover Photo with the Album in the many-to-many junction model
		await prisma.albumPhoto.create({
			data: {
				albumId: albumRecord.id,
				photoId: coverPhotoRecord.id,
				position: 0,
				addedAt: new Date(a.createdAt),
			},
		});

		// Iterate over the supplemental sub-images array, producing individual records and link structures
		let internalPosition = 1;
		for (const url of a.imageUrls) {
			const internalPhoto = await prisma.photo.create({
				data: {
					id: inlinePhotoIdCounter++,
					authorId: a.authorId,
					title: `${a.title} - Image content`,
					description: `Gallery image inside album "${a.title}"`,
					imageUrl: url,
					imageMimeType: 'image/jpeg',
					imageSizeBytes: 350000,
					sharingMode: SharingMode.public,
					createdAt: new Date(a.createdAt),
				},
			});

			await prisma.albumPhoto.create({
				data: {
					albumId: albumRecord.id,
					photoId: internalPhoto.id,
					position: internalPosition++,
					addedAt: new Date(a.createdAt),
				},
			});
		}
	}

	// 6. Reset SQL Auto-increment sequences (Crucial for Postgres)
	// Since we forced hardcoded Int IDs, Postgres' internal counter needs to update
	// so future app registrations or uploads don't trip on "Duplicate Key" errors.
	console.log('Resetting database auto-increment sequences...');
	await prisma.$executeRawUnsafe(
		`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;`
	);
	await prisma.$executeRawUnsafe(
		`SELECT setval(pg_get_serial_sequence('photos', 'id'), COALESCE(MAX(id), 1)) FROM photos;`
	);

	console.log('✅ Database successfully populated with anime-tier mock data!');
}

main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
