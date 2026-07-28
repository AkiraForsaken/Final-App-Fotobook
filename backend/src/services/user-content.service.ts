import { prisma } from '../prisma/client.js';
import { PaginatedUserListOptions, listUserContent } from '../utils/list-user-content.js';
import { PhotoRow, photoWithRelations, toPhotoDto } from '../utils/dto/photo.dto.js';
import { AlbumRow, albumWithRelations, toAlbumDto } from '../utils/dto/album.dto.js';
/**
 * Paginate and list public or all photos for a user based on permissions.
 */
export async function listUserPhotos(options: PaginatedUserListOptions) {
	return listUserContent(options, {
		findMany: (args) => prisma.photo.findMany(args) as Promise<PhotoRow[]>,
		findLikedIds: async (userId, photoIds) => {
			const likes = await prisma.photoLike.findMany({
				where: { userId, photoId: { in: photoIds } },
				select: { photoId: true },
			});
			return likes.map((l) => l.photoId);
		},
		include: photoWithRelations,
		extraWhere: { isStandalone: true },
		toDto: toPhotoDto,
	});
}

/**
 * Paginate and list public or all albums for a user based on permissions.
 */
export async function listUserAlbums(options: PaginatedUserListOptions) {
	return listUserContent(options, {
		findMany: (args) => prisma.album.findMany(args) as Promise<AlbumRow[]>,
		findLikedIds: async (userId, albumIds) => {
			const likes = await prisma.albumLike.findMany({
				where: { userId, albumId: { in: albumIds } },
				select: { albumId: true },
			});
			return likes.map((l) => l.albumId);
		},
		include: albumWithRelations,
		toDto: toAlbumDto,
	});
}
