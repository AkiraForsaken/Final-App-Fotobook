// src/context/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { Photo, Album } from "../types/index.ts";

// Local Asset Imports
import fernImage from "../assets/fern.jpeg";
import frierenImage from "../assets/frieren.jpeg";
import starkImage from "../assets/stark.jpeg";
import himmelImage from "../assets/himmel.jpeg";
import heiterImage from "../assets/heiter.jpeg";
import eisenImage from "../assets/eisen.jpeg";
import serieImage from "../assets/serie.jpeg";
import flammeImage from "../assets/flamme.jpeg";

const ASSET_MAP: Record<string, string> = {
  "/assets/fern.jpeg": fernImage,
  "/assets/frieren.jpeg": frierenImage,
  "/assets/stark.jpeg": starkImage,
  "/assets/himmel.jpeg": himmelImage,
  "/assets/heiter.jpeg": heiterImage,
  "/assets/eisen.jpeg": eisenImage,
  "/assets/serie.jpeg": serieImage,
  "/assets/flamme.jpeg": flammeImage,
};

const mapPhotos = (photos: Photo[]): Photo[] => {
  return photos.map(photo => {
    const avatarKey = photo.author.avatarUrl || "";
    return {
      ...photo,
      imageUrl: ASSET_MAP[photo.imageUrl] ?? photo.imageUrl,
      author: {
        ...photo.author,
        avatarUrl: ASSET_MAP[avatarKey] ?? photo.author.avatarUrl
      }
    }
  });
};

const mapAlbums = (albums: Album[]): Album[] => {
  return albums.map(album => {
    const avatarKey = album.author.avatarUrl || "";
    return {
      ...album,
      coverImageUrl: ASSET_MAP[album.coverImageUrl] ?? album.coverImageUrl,
      author: {
        ...album.author,
        avatarUrl: ASSET_MAP[avatarKey] ?? album.author.avatarUrl
      }
    }
  });
};

// Define the types of state our Context will provide
interface DataContextProps {
  feedPhotos: Photo[];
  feedAlbums: Album[];
  discoveryPhotos: Photo[];
  discoveryAlbums: Album[];
  loading: boolean;
  error: string | null;
  toggleLikePhoto: (photoId: number) => void;
  toggleLikeAlbum: (albumId: number) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

// The Provider component that loads and maps everything
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedPhotos, setFeedPhotos] = useState<Photo[]>([]);
  const [feedAlbums, setFeedAlbums] = useState<Album[]>([]);
  const [discoveryPhotos, setDiscoveryPhotos] = useState<Photo[]>([]);
  const [discoveryAlbums, setDiscoveryAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndMapAllData = async () => {
      try {
        setLoading(true);

        // Fetch all 4 endpoints concurrently
        const [feedPhotosRes, feedAlbumsRes, discoverPhotosRes, discoverAlbumsRes] = await Promise.all([
          fetch("http://localhost:4000/api/feed/photos"),
          fetch("http://localhost:4000/api/feed/albums"),
          fetch("http://localhost:4000/api/discovery/photos"),
          fetch("http://localhost:4000/api/discovery/albums"),
        ]);

        const feedPhotosRaw: Photo[] = await feedPhotosRes.json();
        const feedAlbumsRaw: Album[] = await feedAlbumsRes.json();
        const discoverPhotosRaw: Photo[] = await discoverPhotosRes.json();
        const discoverAlbumsRaw: Album[] = await discoverAlbumsRes.json();

        // Intercept data and map image/avatar to local assets
        setFeedPhotos(mapPhotos(feedPhotosRaw));
        setFeedAlbums(mapAlbums(feedAlbumsRaw));
        setDiscoveryPhotos(mapPhotos(discoverPhotosRaw));
        setDiscoveryAlbums(mapAlbums(discoverAlbumsRaw));

        setError(null);
      } catch (err) {
        console.error("Failed to load backend mock metadata:", err);
        setError("Could not load media items.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndMapAllData();
  }, []);

  const toggleLikePhoto = (photoId: number) => {
    const updatePhoto = (photo: Photo) => {
      if (photo.id !== photoId) return photo;
      return {
        ...photo,
        likedByMe: !photo.likedByMe,
        likesCount: photo.likedByMe ? photo.likesCount - 1 : photo.likesCount + 1,
      };
    };

    setFeedPhotos((prev) => prev.map(updatePhoto));
    setDiscoveryPhotos((prev) => prev.map(updatePhoto));
  };

  const toggleLikeAlbum = (albumId: number) => {
    const updateAlbum = (album: Album) => {
      if (album.id !== albumId) return album;
      return {
        ...album,
        likedByMe: !album.likedByMe,
        likesCount: album.likedByMe ? album.likesCount - 1 : album.likesCount + 1,
      };
    };

    setFeedAlbums((prev) => prev.map(updateAlbum));
    setDiscoveryAlbums((prev) => prev.map(updateAlbum));
  };

  return (
    <DataContext.Provider value={{
      feedPhotos,
      feedAlbums,
      discoveryPhotos,
      discoveryAlbums,
      loading,
      error,
      toggleLikePhoto,
      toggleLikeAlbum
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to consume the data cleanly
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};