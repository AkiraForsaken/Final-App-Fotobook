export type SharingMode = 'public' | 'private';

export interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl?: string;
	isActive: boolean;
	isAdmin: boolean;
	createdAt: string;
}

export interface Photo {
	id: number;
	title: string;
	description: string;
	imageUrl: string;
	sharingMode: SharingMode;
	likesCount: number;
	likedByMe: boolean;
	author: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
	createdAt: string;
}

export interface Album {
	id: number;
	title: string;
	description: string;
	coverImageUrl: string;
	imageUrls: string[];
	sharingMode: SharingMode;
	likesCount: number;
	likedByMe: boolean;
	author: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
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
}

export interface UserProfileData {
	profile: UserProfile;
	following: FollowRelation[];
	followers: FollowRelation[];
	publicPhotos: Photo[];
	publicAlbums: Album[];
	ownerPhotos: Photo[];
	ownerAlbums: Album[];
}

// A user card shown in the Following / Followers tab
export interface FollowRelation {
	id: number;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
	isFollowedByMe: boolean;
}

export type ProfileTab = 'photos' | 'albums' | 'following' | 'followers';

// Add these to your types/index.ts
export interface RawProfileEntry {
	profile: {
		id: number;
		firstName: string;
		lastName: string;
		avatarUrl?: string;
		publicPhotoCount: number;
		publicAlbumCount: number;
		followingCount: number;
		followerCount: number;
		isFollowedByMe: boolean;
	};
	following?: FollowRelation[];
	followers?: FollowRelation[];
	publicPhotos?: Photo[];
	publicAlbums?: Album[];
	ownerPhotos?: Photo[];
	ownerAlbums?: Album[];
}

export type RawProfiles = Record<number, RawProfileEntry>;
