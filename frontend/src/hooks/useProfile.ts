import { useCallback, useEffect, useState } from 'react';
import { userService } from '../service/userService.ts';
import { usePaginatedContent } from './usePaginatedContent.ts';
import { useAuth } from './useAuth.ts';
import type { User, UserProfile, Photo, Album, FollowRelation } from '../types/index.ts';

const TAB_PAGE_SIZE = 12;

const EMPTY_PAGE = { items: [], nextCursor: null };

/**
 * useProfile — drives a single profile page (MyProfile or PublicProfile).
 */
// For owner's profile page
function ownerToProfileHeader(user: User): UserProfile {
	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		avatarUrl: user.avatarUrl,
		// For the owner, photosCount / albumsCount includes total items (public + private).
		// Map them directly to publicPhotoCount / publicAlbumCount so ProfileHeader displays the total:
		publicPhotoCount: user.photosCount ?? 0,
		publicAlbumCount: user.albumsCount ?? 0,
		followingCount: user.followingCount ?? 0,
		// Map plural followersCount from User DTO to singular followerCount on UserProfile:
		followerCount: user.followersCount ?? 0,
		isFollowedByMe: false,
		createdAt: user.createdAt,
	};
}

export const useProfile = (userId: number | null, currentUser: User | null) => {
	const { updateCurrentUser } = useAuth();
	const isOwner =
		currentUser !== null && userId !== null && String(currentUser.id) === String(userId);

	// ── Profile header ──────────────────────────────────────────────────
	const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
	const [profileLoading, setProfileLoading] = useState(true);
	const [profileError, setProfileError] = useState<string | null>(null);

	const profile: UserProfile | null =
		isOwner && currentUser ? ownerToProfileHeader(currentUser) : publicProfile;

	const loadProfile = useCallback(async () => {
		if (userId === null) {
			setPublicProfile(null);
			setProfileLoading(false);
			return;
		}

		if (isOwner) {
			// Owner profile is managed locally by AuthContext + useEffect above
			setProfileLoading(false);
			setProfileError(null);
			return;
		}

		setProfileLoading(true);
		setProfileError(null);

		try {
			const publicData = await userService.getPublicProfile(userId);
			setPublicProfile(publicData);
		} catch (err) {
			console.error('Failed to load profile:', err);
			setProfileError('Could not load profile.');
		} finally {
			setProfileLoading(false);
		}
	}, [userId, isOwner]);

	useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	// Guarded so an invalid/missing userId never fires a request with a bad id.
	const fetchPhotos = useCallback(
		(cursor: number | undefined, take: number) =>
			userId === null
				? Promise.resolve(EMPTY_PAGE)
				: userService.getUserPhotos(userId, cursor, take),
		[userId]
	);
	const fetchAlbums = useCallback(
		(cursor: number | undefined, take: number) =>
			userId === null
				? Promise.resolve(EMPTY_PAGE)
				: userService.getUserAlbums(userId, cursor, take),
		[userId]
	);
	const fetchFollowers = useCallback(
		(cursor: number | undefined, take: number) =>
			userId === null
				? Promise.resolve(EMPTY_PAGE)
				: userService.getUserFollowers(userId, cursor, take),
		[userId]
	);
	const fetchFollowing = useCallback(
		(cursor: number | undefined, take: number) =>
			userId === null
				? Promise.resolve(EMPTY_PAGE)
				: userService.getUserFollowing(userId, cursor, take),
		[userId]
	);

	const photos = usePaginatedContent<Photo>(fetchPhotos, TAB_PAGE_SIZE);
	const albums = usePaginatedContent<Album>(fetchAlbums, TAB_PAGE_SIZE);
	const followers = usePaginatedContent<FollowRelation>(fetchFollowers, TAB_PAGE_SIZE);
	const following = usePaginatedContent<FollowRelation>(fetchFollowing, TAB_PAGE_SIZE);

	// Follow / unfollow ANY user currently visible on this page — the
	// profile subject itself, or a card in the followers/following lists.
	const findCurrentlyFollowing = useCallback(
		(targetUserId: number): boolean | undefined => {
			if (profile && profile.id === targetUserId) return profile.isFollowedByMe;
			const inFollowers = followers.items.find((u) => u.id === targetUserId);
			if (inFollowers) return inFollowers.isFollowedByMe;
			const inFollowing = following.items.find((u) => u.id === targetUserId);
			if (inFollowing) return inFollowing.isFollowedByMe;
			return undefined;
		},
		[profile, followers.items, following.items]
	);

	const toggleFollow = useCallback(
		(targetUserId: number) => {
			const currentlyFollowing = findCurrentlyFollowing(targetUserId);
			if (currentlyFollowing === undefined) return;
			const willFollow = !currentlyFollowing;
			const delta = willFollow ? 1 : -1;

			const applyProfile = (followed: boolean) => {
				if (!profile || profile.id !== targetUserId) return;
				setPublicProfile((prev) =>
					prev
						? {
								...prev,
								isFollowedByMe: followed,
								followerCount: Math.max(0, prev.followerCount + delta),
							}
						: prev
				);
			};

			const applyLists = (followed: boolean) => {
				followers.updateItem(targetUserId, (u) => ({ ...u, isFollowedByMe: followed }));
				following.updateItem(targetUserId, (u) => ({ ...u, isFollowedByMe: followed }));
			};

			updateCurrentUser((user) => ({
				...user,
				followingCount: Math.max(0, (user.followingCount ?? 0) + delta),
			}));

			applyProfile(willFollow);
			applyLists(willFollow);

			const call = willFollow
				? userService.followUser(targetUserId)
				: userService.unfollowUser(targetUserId);

			call.catch(() => {
				// Revert only if network request actually fails
				updateCurrentUser((user) => ({
					...user,
					followingCount: Math.max(0, (user.followingCount ?? 0) - delta),
				}));
				applyProfile(currentlyFollowing);
				applyLists(currentlyFollowing);
			});
		},
		[profile, followers, following, findCurrentlyFollowing, updateCurrentUser]
	);

	return {
		profile,
		isOwner,
		loading: profileLoading,
		error: profileError,
		photos, // { items, loading, loadingMore, hasMore, sentinelRef, refetch, updateItem }
		albums,
		followers,
		following,
		toggleFollow,
		refetch: loadProfile, // profile header only — call photos.refetch() etc. for a specific tab
	};
};
