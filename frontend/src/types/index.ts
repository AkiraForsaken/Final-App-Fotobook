export type SharingMode = "public" | "private";

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
  author: Pick<User, "id" | "firstName" | "lastName" | "avatarUrl">;
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
  author: Pick<User, "id" | "firstName" | "lastName" | "avatarUrl">;
  createdAt: string;
}

export type FeedMode = "photos" | "albums";
