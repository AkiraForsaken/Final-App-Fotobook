import React, { useState, useEffect } from 'react';
import type { Photo, Album } from '../types/index.ts';
import type { UserProfileData } from './DataContext.tsx';
import { DataContext } from './DataContext.tsx';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [feedPhotos, setFeedPhotos] = useState<Photo[]>([]);
	const [feedAlbums, setFeedAlbums] = useState<Album[]>([]);
	const [discoveryPhotos, setDiscoveryPhotos] = useState<Photo[]>([]);
	const [discoveryAlbums, setDiscoveryAlbums] = useState<Album[]>([]);
	const [profilesMap, setProfilesMap] = useState<Record<number, UserProfileData>>({});

	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadEcosystemData = async () => {
			try {
				setLoading(true);
				const [fPhotosRes, fAlbumsRes, dPhotosRes, dAlbumsRes, profilesRes] = await Promise.all([
					fetch('http://localhost:4000/api/feed/photos'),
					fetch('http://localhost:4000/api/feed/albums'),
					fetch('http://localhost:4000/api/discovery/photos'),
					fetch('http://localhost:4000/api/discovery/albums'),
					fetch('http://localhost:4000/api/profiles'),
				]);

				const fPhotos: Photo[] = await fPhotosRes.json();
				const fAlbums: Album[] = await fAlbumsRes.json();
				const dPhotos: Photo[] = await dPhotosRes.json();
				const dAlbums: Album[] = await dAlbumsRes.json();

				const rawProfiles: Record<number, UserProfileData> = await profilesRes.json();

				setFeedPhotos(fPhotos);
				setFeedAlbums(fAlbums);
				setDiscoveryPhotos(dPhotos);
				setDiscoveryAlbums(dAlbums);

				// COMBINE SYSTEM ARRAYS TO MIMIC 1-TO-MANY DATABASE RELATIONS
				const allPhotos = [...fPhotos, ...dPhotos];
				const allAlbums = [...fAlbums, ...dAlbums];

				// Deduplicate tracking arrays by asset ID
				const uniquePhotos = Array.from(new Map(allPhotos.map((p) => [p.id, p])).values());
				const uniqueAlbums = Array.from(new Map(allAlbums.map((a) => [a.id, a])).values());

				const hydratedProfiles: Record<number, UserProfileData> = {};

				Object.keys(rawProfiles).forEach((key) => {
					const targetUserId = Number(key);
					const rawConfig = rawProfiles[targetUserId];

					// DYNAMIC RELATION FILTERS: Emulates "SELECT * FROM photos WHERE author_id = targetUserId"
					const profilePublicPhotos = uniquePhotos.filter(
						(p) => p.author.id === targetUserId && p.sharingMode === 'public'
					);
					const profilePublicAlbums = uniqueAlbums.filter(
						(a) => a.author.id === targetUserId && a.sharingMode === 'public'
					);

					// Combine public items with user-specific private content placeholders
					const profileOwnerPhotos = [
						...profilePublicPhotos,
						...(rawConfig.ownerPhotos || []).filter((p) => p.sharingMode === 'private'),
					];
					const profileOwnerAlbums = [
						...profilePublicAlbums,
						...(rawConfig.ownerAlbums || []).filter((a) => a.sharingMode === 'private'),
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

				setProfilesMap(hydratedProfiles);
				setError(null);
			} catch (err) {
				console.error('Failed to load backend ecosystems:', err);
				setError('Could not populate system content maps.');
			} finally {
				setLoading(false);
			}
		};

		loadEcosystemData();
	}, []);

	// Intercept and synchronize states globally across columns, grids, and sidebars simultaneously
	const toggleLikePhoto = (photoId: number) => {
		const syncLike = (photo: Photo) => {
			if (photo.id !== photoId) return photo;
			return {
				...photo,
				likedByMe: !photo.likedByMe,
				likesCount: photo.likedByMe ? photo.likesCount - 1 : photo.likesCount + 1,
			};
		};

		setFeedPhotos((prev) => prev.map(syncLike));
		setDiscoveryPhotos((prev) => prev.map(syncLike));
		setProfilesMap((prev) => {
			const updated = { ...prev };
			Object.keys(updated).forEach((key) => {
				const id = Number(key);
				updated[id] = {
					...updated[id],
					publicPhotos: updated[id].publicPhotos.map(syncLike),
					ownerPhotos: updated[id].ownerPhotos.map(syncLike),
				};
			});
			return updated;
		});
	};

	const toggleLikeAlbum = (albumId: number) => {
		const syncLike = (album: Album) => {
			if (album.id !== albumId) return album;
			return {
				...album,
				likedByMe: !album.likedByMe,
				likesCount: album.likedByMe ? album.likesCount - 1 : album.likesCount + 1,
			};
		};

		setFeedAlbums((prev) => prev.map(syncLike));
		setDiscoveryAlbums((prev) => prev.map(syncLike));
		setProfilesMap((prev) => {
			const updated = { ...prev };
			Object.keys(updated).forEach((key) => {
				const id = Number(key);
				updated[id] = {
					...updated[id],
					publicAlbums: updated[id].publicAlbums.map(syncLike),
					ownerAlbums: updated[id].ownerAlbums.map(syncLike),
				};
			});
			return updated;
		});
	};

	const toggleFollowUser = (userId: number) => {
		setProfilesMap((prev) => {
			if (!prev[userId]) return prev;
			const isFollowing = prev[userId].profile.isFollowedByMe;
			return {
				...prev,
				[userId]: {
					...prev[userId],
					profile: {
						...prev[userId].profile,
						isFollowedByMe: !isFollowing,
						followerCount: isFollowing
							? prev[userId].profile.followerCount - 1
							: prev[userId].profile.followerCount + 1,
					},
				},
			};
		});
	};

	return (
		<DataContext.Provider
			value={{
				feedPhotos,
				feedAlbums,
				discoveryPhotos,
				discoveryAlbums,
				loading,
				error,
				toggleLikePhoto,
				toggleLikeAlbum,
				profilesMap,
				toggleFollowUser,
			}}
		>
			{children}
		</DataContext.Provider>
	);
};
