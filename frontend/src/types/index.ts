export type SharingMode = 'public' | 'private';

// GET /users/current/profile (own profile) and used to seed AuthContext.
export interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl?: string;
	followersCount: number;
	followingCount: number;
	photosCount: number;
	albumsCount: number;
	isActive: boolean;
	isAdmin: boolean;
	createdAt: string;
}

// The trimmed author summary embedded in every Photo/Album. Now includes
// isFollowedByMe directly (per photo.service.ts/album.service.ts's
// toPhotoDto/toAlbumDto) — Discovery reads follow status straight off each
// card's author instead of needing a separate profile lookup.
export interface AuthorSummary {
	id: number;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
	isFollowedByMe?: boolean;
}

export interface Photo {
	id: number;
	title: string;
	description: string;
	imageUrl: string;
	sharingMode: SharingMode;
	likesCount: number;
	likedByMe: boolean;
	author: AuthorSummary;
	createdAt: string;
}

export interface Album {
	id: number;
	title: string;
	description: string;
	coverImageUrl: string;
	imageUrls: string[];
	photoIds: number[]; // needed to call remove photo from album
	sharingMode: SharingMode;
	likesCount: number;
	likedByMe: boolean;
	author: AuthorSummary;
	createdAt: string;
}

export type FeedMode = 'photos' | 'albums';

// Profile
export interface UserProfile {
	id: number;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
	publicPhotoCount: number;
	publicAlbumCount: number;
	followingCount: number;
	followerCount: number;
	isFollowedByMe: boolean;
	createdAt?: string;
}

// A user card shown in the Following / Followers tab.
// NOTE: no backend endpoint returns lists of these yet
// (GET /users/:id/followers, GET /users/:id/following) — see the
// integration-blocker list. Kept here so ProfileView / follow-list UI can be
// typed ahead of that endpoint landing.
export interface FollowRelation {
	id: number;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
	isFollowedByMe: boolean;
}

export type ProfileTab = 'photos' | 'albums' | 'following' | 'followers';

// Shared shape for every cursor-paginated list endpoint
// (feed/discovery photos & albums, admin photos & albums).
export interface Page<T> {
	items: T[];
	nextCursor: number | null;
}

// Row for the admin users table — GET /admin/users.
export interface AdminUserSummary {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl?: string;
	isActive: boolean;
	isAdmin: boolean;
	createdAt: string;
	lastLoginAt: string | null;
}
