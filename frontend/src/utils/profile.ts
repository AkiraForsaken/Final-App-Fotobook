import type { Album, Photo, RawProfiles, UserProfileData } from '../types/index.ts';

export const buildHydratedProfiles = (
	rawProfiles: RawProfiles,
	feedPhotos: Photo[],
	feedAlbums: Album[],
	discoveryPhotos: Photo[],
	discoveryAlbums: Album[]
): Record<number, UserProfileData> => {
	const allPhotos = [...feedPhotos, ...discoveryPhotos];
	const allAlbums = [...feedAlbums, ...discoveryAlbums];

	const uniquePhotos = Array.from(new Map(allPhotos.map((photo) => [photo.id, photo])).values());
	const uniqueAlbums = Array.from(new Map(allAlbums.map((album) => [album.id, album])).values());

	const hydratedProfiles: Record<number, UserProfileData> = {};

	Object.keys(rawProfiles).forEach((key) => {
		const targetUserId = Number(key);
		const rawConfig = rawProfiles[targetUserId];

		const profilePublicPhotos = uniquePhotos.filter(
			(photo) => photo.author.id === targetUserId && photo.sharingMode === 'public'
		);
		const profilePublicAlbums = uniqueAlbums.filter(
			(album) => album.author.id === targetUserId && album.sharingMode === 'public'
		);

		const profileOwnerPhotos = [
			...profilePublicPhotos,
			...(rawConfig.ownerPhotos || []).filter((photo: Photo) => photo.sharingMode === 'private'),
		];
		const profileOwnerAlbums = [
			...profilePublicAlbums,
			...(rawConfig.ownerAlbums || []).filter((album: Album) => album.sharingMode === 'private'),
		];

		hydratedProfiles[targetUserId] = {
			profile: rawConfig.profile,
			following: rawConfig.following ?? [],
			followers: rawConfig.followers ?? [],
			publicPhotos: profilePublicPhotos,
			publicAlbums: profilePublicAlbums,
			ownerPhotos: profileOwnerPhotos,
			ownerAlbums: profileOwnerAlbums,
		};
	});

	return hydratedProfiles;
};
