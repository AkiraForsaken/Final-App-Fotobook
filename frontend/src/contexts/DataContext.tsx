import { createContext } from 'react';
import type { Photo, Album } from '../types/index.ts';

export interface DataContextProps {
	feedPhotos: Photo[];
	feedAlbums: Album[];
	discoveryPhotos: Photo[];
	discoveryAlbums: Album[];
	loading: boolean;
	error: string | null;
	toggleLikePhoto: (photoId: number) => void;
	toggleLikeAlbum: (albumId: number) => void;
}

export const DataContext = createContext<DataContextProps | undefined>(undefined);
