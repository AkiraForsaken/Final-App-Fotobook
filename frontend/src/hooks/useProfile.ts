import { useCallback, useEffect, useMemo, useState } from 'react';
import { contentService } from '../service/contentService.ts';
import { buildHydratedProfiles } from '../utils/profile.ts';
import type { User, Album, FollowRelation, Photo, UserProfileData } from '../types/index.ts';

export const useProfile = (userId: number | null, currentUser: User | null) => {
	const [profiles, setProfiles] = useState<Record<number, UserProfileData>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadProfileData = useCallback(async () => {
		try {
			setLoading(true);
			const [feedPhotos, feedAlbums, discoveryPhotos, discoveryAlbums, rawProfiles] =
				await Promise.all([
					contentService.getFeedPhotos(),
					contentService.getFeedAlbums(),
					contentService.getDiscoveryPhotos(),
					contentService.getDiscoveryAlbums(),
					contentService.getProfiles(),
				]);

			setProfiles(
				buildHydratedProfiles(rawProfiles, feedPhotos, feedAlbums, discoveryPhotos, discoveryAlbums)
			);
			setError(null);
		} catch (err) {
			console.error('Failed to load profile content:', err);
			setError('Could not load profile content.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadProfileData();
	}, [loadProfileData]);

	const toggleFollowUser = useCallback((targetUserId: number) => {
		setProfiles((prev) => {
			if (!prev[targetUserId]) return prev;
			const isFollowing = prev[targetUserId].profile.isFollowedByMe;
			return {
				...prev,
				[targetUserId]: {
					...prev[targetUserId],
					profile: {
						...prev[targetUserId].profile,
						isFollowedByMe: !isFollowing,
						followerCount: isFollowing
							? prev[targetUserId].profile.followerCount - 1
							: prev[targetUserId].profile.followerCount + 1,
					},
					following: prev[targetUserId].following.map((relation) =>
						relation.id === targetUserId ? { ...relation, isFollowedByMe: !isFollowing } : relation
					),
					followers: prev[targetUserId].followers.map((relation) =>
						relation.id === targetUserId ? { ...relation, isFollowedByMe: !isFollowing } : relation
					),
				},
			};
		});
	}, []);

	const profileInfo = useMemo(() => {
		if (!userId) return undefined;
		return profiles[userId];
	}, [profiles, userId]);

	const ownerId = currentUser?.id ?? null;
	const photos: Photo[] = profileInfo
		? ownerId === userId
			? profileInfo.ownerPhotos
			: profileInfo.publicPhotos
		: [];
	const albums: Album[] = profileInfo
		? ownerId === userId
			? profileInfo.ownerAlbums
			: profileInfo.publicAlbums
		: [];
	const following: FollowRelation[] = profileInfo?.following ?? [];
	const followers: FollowRelation[] = profileInfo?.followers ?? [];

	return {
		profile: profileInfo?.profile ?? null,
		photos,
		albums,
		following,
		followers,
		profilesMap: profiles,
		loading,
		error,
		toggleFollowUser,
	};
};
