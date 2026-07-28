import { PrismaClient, SharingMode, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

	// 2. Setup reusable password hash ('Password123!')
	const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

	// 3. Insert 8 Users with explicit IDs
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
			lastName: 'The Living Grimoire',
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
				role: u.id === 7 ? UserRole.admin : UserRole.user, // Serie as Admin
				isEmailVerified: true,
				isActive: true,
			},
		});
	}

	// 4. Seed Rich Follow Graph
	console.log('Seeding follows...');
	await prisma.follow.createMany({
		data: [
			// Frieren (1)
			{ followerId: 1, followingId: 2 }, // -> Fern
			{ followerId: 1, followingId: 3 }, // -> Stark
			{ followerId: 1, followingId: 4 }, // -> Himmel
			{ followerId: 1, followingId: 6 }, // -> Eisen
			{ followerId: 1, followingId: 8 }, // -> Flamme

			// Fern (2)
			{ followerId: 2, followingId: 1 }, // -> Frieren
			{ followerId: 2, followingId: 3 }, // -> Stark
			{ followerId: 2, followingId: 5 }, // -> Heiter

			// Stark (3)
			{ followerId: 3, followingId: 1 }, // -> Frieren
			{ followerId: 3, followingId: 2 }, // -> Fern
			{ followerId: 3, followingId: 6 }, // -> Eisen

			// Himmel (4)
			{ followerId: 4, followingId: 1 }, // -> Frieren
			{ followerId: 4, followingId: 5 }, // -> Heiter
			{ followerId: 4, followingId: 6 }, // -> Eisen

			// Heiter (5)
			{ followerId: 5, followingId: 1 }, // -> Frieren
			{ followerId: 5, followingId: 4 }, // -> Himmel
			{ followerId: 5, followingId: 2 }, // -> Fern

			// Eisen (6)
			{ followerId: 6, followingId: 3 }, // -> Stark
			{ followerId: 6, followingId: 4 }, // -> Himmel
			{ followerId: 6, followingId: 5 }, // -> Heiter

			// Serie (7)
			{ followerId: 7, followingId: 1 }, // -> Frieren
			{ followerId: 7, followingId: 8 }, // -> Flamme

			// Flamme (8)
			{ followerId: 8, followingId: 1 }, // -> Frieren
			{ followerId: 8, followingId: 7 }, // -> Serie
		],
	});

	// 5. Seed Standalone Photos (Ensuring ALL 8 users have local asset photos)
	console.log('Seeding standalone photos...');
	const photosData = [
		{
			id: 1,
			authorId: 1,
			title: 'Above the Clouds',
			description: 'Portrait at sunset after a long day of traveling.',
			imageUrl: '/assets/frieren.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-10T10:00:00Z'),
		},
		{
			id: 2,
			authorId: 2,
			title: 'Magic in the Forest',
			description: 'A serene view from our adventure in the ancient woods.',
			imageUrl: '/assets/fern.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-10T09:00:00Z'),
		},
		{
			id: 3,
			authorId: 3,
			title: 'Battle Ready',
			description: 'Stark in his finest armor, ready for practice.',
			imageUrl: '/assets/stark.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-09T14:00:00Z'),
		},
		{
			id: 4,
			authorId: 4,
			title: 'A Hero’s Stance',
			description: 'Posing for the statue carvers once again.',
			imageUrl: '/assets/himmel.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-08T11:30:00Z'),
		},
		{
			id: 5,
			authorId: 5,
			title: 'Quiet Reflection',
			description: 'Enjoying a peaceful moment and a fine vintage.',
			imageUrl: '/assets/heiter.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-07T16:20:00Z'),
		},
		{
			id: 6,
			authorId: 6,
			title: 'Unwavering Vanguard',
			description: 'Standing guard over the northern pass.',
			imageUrl: '/assets/eisen.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-06T08:15:00Z'),
		},
		{
			id: 7,
			authorId: 7,
			title: 'The Great Sanctuary',
			description: 'Overseeing the Continental Magic Association.',
			imageUrl: '/assets/serie.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-05T19:00:00Z'),
		},
		{
			id: 8,
			authorId: 8,
			title: 'Fields of Flowers',
			description: 'A spell that creates a field of blue flowers.',
			imageUrl: '/assets/flamme.jpeg',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-04T12:00:00Z'),
		},
		// Additional feed/testing photos
		{
			id: 9,
			authorId: 1,
			title: 'Library of the Ancients',
			description: 'Frieren browsing grimoires older than most civilizations.',
			imageUrl: 'https://picsum.photos/seed/frieren_lib/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-03T11:20:00Z'),
		},
		{
			id: 10,
			authorId: 2,
			title: 'Spellweaving at Dusk',
			description: 'An experimental spell gone beautifully right.',
			imageUrl: 'https://picsum.photos/seed/fern_dusk/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-02T20:00:00Z'),
		},
		{
			id: 11,
			authorId: 3,
			title: 'The Silent Summit',
			description: 'After three days of climbing, silence was the reward.',
			imageUrl: 'https://picsum.photos/seed/stark_summit/736/736',
			sharingMode: SharingMode.public,
			createdAt: new Date('2024-06-01T07:45:00Z'),
		},
		{
			id: 12,
			authorId: 1,
			title: 'Private Grimoire Study',
			description: 'Deciphering secret scripts alone in the evening.',
			imageUrl: 'https://picsum.photos/seed/frieren_priv/600/600',
			sharingMode: SharingMode.private, // Private test photo
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
				imageMimeType: 'image/jpeg',
				imageSizeBytes: 1024 * 500,
				isStandalone: true,
				createdAt: p.createdAt,
			},
		});
	}

	// 6. Seed Albums (All 8 users own at least 1 album)
	console.log('📖 Seeding Discovery Albums & generating inline photos...');
	const structuralAlbums = [
		{
			id: 1,
			authorId: 1,
			title: 'Stars and Spells',
			description: "A mage's collection of celestial magic and grimoires.",
			coverImageUrl: '/assets/frieren.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb1a/400/400',
				'https://picsum.photos/seed/alb1b/400/400',
			],
			createdAt: '2024-06-11T10:00:00Z',
		},
		{
			id: 2,
			authorId: 2,
			title: 'Magic in Practice',
			description: "Fern's field notes and defensive spell observations.",
			coverImageUrl: '/assets/fern.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb2a/400/400',
				'https://picsum.photos/seed/alb2b/400/400',
			],
			createdAt: '2024-06-10T14:00:00Z',
		},
		{
			id: 3,
			authorId: 3,
			title: 'Hero in Training',
			description: "Stark's records of training drills and martial progress.",
			coverImageUrl: '/assets/stark.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb3a/400/400',
				'https://picsum.photos/seed/alb3b/400/400',
			],
			createdAt: '2024-06-09T08:00:00Z',
		},
		{
			id: 4,
			authorId: 4,
			title: 'Battles We Won',
			description: 'Himmel insisted on documenting every victory and statue.',
			coverImageUrl: '/assets/himmel.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb4a/400/400',
				'https://picsum.photos/seed/alb4b/400/400',
			],
			createdAt: '2024-06-08T16:00:00Z',
		},
		{
			id: 5,
			authorId: 5,
			title: 'Blessings and Beyond',
			description: "Heiter's travels to remote sanctuaries and shrines.",
			coverImageUrl: '/assets/heiter.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb5a/400/400',
				'https://picsum.photos/seed/alb5b/400/400',
			],
			createdAt: '2024-06-07T07:30:00Z',
		},
		{
			id: 6,
			authorId: 6,
			title: 'Northern Wilds',
			description: "Eisen's solo expeditions into mountain territory.",
			coverImageUrl: '/assets/eisen.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb6a/400/400',
				'https://picsum.photos/seed/alb6b/400/400',
			],
			createdAt: '2024-06-06T10:00:00Z',
		},
		{
			id: 7,
			authorId: 7,
			title: 'The Great Library',
			description: "Serie's personal archive of forbidden magic.",
			coverImageUrl: '/assets/serie.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb7a/400/400',
				'https://picsum.photos/seed/alb7b/400/400',
			],
			createdAt: '2024-06-05T12:00:00Z',
		},
		{
			id: 8,
			authorId: 8,
			title: "Flamme's Travels",
			description: 'Before she became a legend, she was just a traveller.',
			coverImageUrl: '/assets/flamme.jpeg',
			imageUrls: [
				'https://picsum.photos/seed/alb8a/400/400',
				'https://picsum.photos/seed/alb8b/400/400',
			],
			createdAt: '2024-06-04T17:00:00Z',
		},
		{
			id: 9,
			authorId: 7,
			title: 'Knowledge Preserved',
			description: 'Cataloguing ancient spells lost to human memory.',
			coverImageUrl: 'https://picsum.photos/seed/alb9_cov/736/736',
			imageUrls: [
				'https://picsum.photos/seed/alb9a/400/400',
				'https://picsum.photos/seed/alb9b/400/400',
			],
			createdAt: '2024-06-03T09:00:00Z',
		},
		{
			id: 10,
			authorId: 8,
			title: 'Embers of the Past',
			description: 'Reflections on human potential and magic.',
			coverImageUrl: 'https://picsum.photos/seed/alb10_cov/736/736',
			imageUrls: [
				'https://picsum.photos/seed/alb10a/400/400',
				'https://picsum.photos/seed/alb10b/400/400',
			],
			createdAt: '2024-06-02T15:00:00Z',
		},
	];

	// Start inline album photo IDs at 100 to keep IDs organized
	let inlinePhotoIdCounter = 100;

	for (const a of structuralAlbums) {
		// Create Cover Photo record
		const coverPhotoRecord = await prisma.photo.create({
			data: {
				id: inlinePhotoIdCounter++,
				authorId: a.authorId,
				title: null,
				description: null,
				imageUrl: a.coverImageUrl,
				imageMimeType: 'image/jpeg',
				imageSizeBytes: 420000,
				sharingMode: SharingMode.public,
				isStandalone: false,
				createdAt: new Date(a.createdAt),
			},
		});

		// Create Album record
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

		// Link Cover Photo to Album
		await prisma.albumPhoto.create({
			data: {
				albumId: albumRecord.id,
				photoId: coverPhotoRecord.id,
				position: 0,
				addedAt: new Date(a.createdAt),
			},
		});

		// Create and link supplemental inline photos
		let internalPosition = 1;
		for (const url of a.imageUrls) {
			const internalPhoto = await prisma.photo.create({
				data: {
					id: inlinePhotoIdCounter++,
					authorId: a.authorId,
					title: null,
					description: null,
					imageUrl: url,
					imageMimeType: 'image/jpeg',
					imageSizeBytes: 350000,
					sharingMode: SharingMode.public,
					isStandalone: false,
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

	// 7. Reset SQL Auto-increment sequences for all core entities
	console.log('Resetting database auto-increment sequences...');
	await prisma.$executeRawUnsafe(
		`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;`
	);
	await prisma.$executeRawUnsafe(
		`SELECT setval(pg_get_serial_sequence('photos', 'id'), COALESCE(MAX(id), 1)) FROM photos;`
	);
	await prisma.$executeRawUnsafe(
		`SELECT setval(pg_get_serial_sequence('albums', 'id'), COALESCE(MAX(id), 1)) FROM albums;`
	);

	console.log('✅ Database successfully populated with testing data!');
}

main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
