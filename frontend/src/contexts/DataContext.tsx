import { createContext } from 'react';
import type { Photo, Album, UserProfile, FollowRelation } from '../types/index.ts';

export interface UserProfileData {
	profile: UserProfile;
	following: FollowRelation[];
	followers: FollowRelation[];
	publicPhotos: Photo[];
	publicAlbums: Album[];
	ownerPhotos: Photo[];
	ownerAlbums: Album[];
}
export interface DataContextProps {
	feedPhotos: Photo[];
	feedAlbums: Album[];
	discoveryPhotos: Photo[];
	discoveryAlbums: Album[];
	loading: boolean;
	error: string | null;
	toggleLikePhoto: (photoId: number) => void;
	toggleLikeAlbum: (albumId: number) => void;
	profilesMap: Record<number, UserProfileData>;
	toggleFollowUser: (userId: number) => void;
}

export const DataContext = createContext<DataContextProps | undefined>(undefined);
