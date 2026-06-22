import { useState } from "react";
import { TopBar } from "../components/TopBar.tsx";
import { SideBar } from "../components/SideBar.tsx";
import { PhotoCard } from "../components/PhotoCard.tsx";
import { AlbumCard } from "../components/AlbumCard.tsx";
import { FeedToggle } from "../components/FeedToggle.tsx";
import type { FeedMode, Photo, Album, User } from "../types/index.ts";
import fernImage from "../assets/fern.jpeg"
import frierenImage from "../assets/frieren.jpeg"
import starkImage from "../assets/stark.jpeg"
import himmelImage from "../assets/himmel.jpeg"
import heiterImage from "../assets/heiter.jpeg"
import eisenImage from "../assets/eisen.jpeg"

// Mock data - Replace with real API Calls

const MOCK_USER: User = {
  id: 1,
  firstName: "Frieren",
  lastName: "The Mage",
  email: "frieren@example.com",
  avatarUrl: undefined, // will show initials "FE"
  isActive: true,
  isAdmin: false,
  createdAt: "2026-05-17",
};

const MOCK_PHOTOS: Photo[] = [
  {
    id: 1,
    title: "Magic in the Forest",
    description: "A serene view from our adventure in the ancient woods.",
    imageUrl: fernImage,
    sharingMode: "public",
    likesCount: 128,
    likedByMe: true,
    author: {
      id: 2,
      firstName: "Fern",
      lastName: "The Mage",
      avatarUrl: fernImage,
    },
    createdAt: "2024-06-10T09:00:00Z",
  },
  {
    id: 2,
    title: "Above the Clouds",
    description: "Portrait at sunset after a long day of traveling.",
    imageUrl: frierenImage,
    sharingMode: "public",
    likesCount: 214,
    likedByMe: false,
    author: {
      id: 1,
      firstName: "Frieren",
      lastName: "The Mage",
      avatarUrl: frierenImage,
    },
    createdAt: "2024-06-09T17:30:00Z",
  },
  {
    id: 3,
    title: "Battle Ready",
    description: "Stark in his finest armor, just before the big fight.",
    imageUrl: starkImage,
    sharingMode: "public",
    likesCount: 89,
    likedByMe: false,
    author: {
      id: 3,
      firstName: "Stark",
      lastName: "The Warrior",
      avatarUrl: starkImage,
    },
    createdAt: "2024-06-08T12:00:00Z",
  },
  {
    id: 4,
    title: "Eternal Hero",
    description: "Himmel posing for what he called 'posterity'.",
    imageUrl: himmelImage,
    sharingMode: "public",
    likesCount: 312,
    likedByMe: true,
    author: {
      id: 4,
      firstName: "Himmel",
      lastName: "The Hero",
      avatarUrl: himmelImage,
    },
    createdAt: "2024-06-07T08:15:00Z",
  },
  {
    id: 5,
    title: "Morning Prayer",
    description: "Heiter at dawn, blessing the road ahead.",
    imageUrl: heiterImage,
    sharingMode: "public",
    likesCount: 55,
    likedByMe: false,
    author: {
      id: 5,
      firstName: "Heiter",
      lastName: "The Priest",
      avatarUrl: heiterImage,
    },
    createdAt: "2024-06-06T06:00:00Z",
  },
  {
    id: 6,
    title: "Iron Fist",
    description: "Eisen practicing his craft at the forge.",
    imageUrl: eisenImage,
    sharingMode: "public",
    likesCount: 73,
    likedByMe: false,
    author: {
      id: 6,
      firstName: "Eisen",
      lastName: "The Warrior",
      avatarUrl: eisenImage,
    },
    createdAt: "2024-06-05T14:00:00Z",
  },
];

const MOCK_ALBUMS: Album[] = [
  {
    id: 1,
    title: "Journey Through the North",
    description: "A collection of our travels across the northern frontier.",
    coverImageUrl: "https://picsum.photos/seed/album1/400/400",
    imageUrls: [
      "https://picsum.photos/seed/a1/400/400",
      "https://picsum.photos/seed/a2/400/400",
      "https://picsum.photos/seed/a3/400/400",
    ],
    sharingMode: "public",
    likesCount: 45,
    likedByMe: false,
    author: {
      id: 2,
      firstName: "Fern",
      lastName: "Mage",
      avatarUrl: "https://picsum.photos/seed/fern/40/40",
    },
    createdAt: "2024-06-10T10:00:00Z",
  },
  {
    id: 2,
    title: "Memories of the Party",
    description: "Candid shots from our adventures together as a group.",
    coverImageUrl: "https://picsum.photos/seed/album2/400/400",
    imageUrls: [
      "https://picsum.photos/seed/b1/400/400",
      "https://picsum.photos/seed/b2/400/400",
      "https://picsum.photos/seed/b3/400/400",
      "https://picsum.photos/seed/b4/400/400",
    ],
    sharingMode: "public",
    likesCount: 182,
    likedByMe: true,
    author: {
      id: 4,
      firstName: "Himmel",
      lastName: "Hero",
      avatarUrl: "https://picsum.photos/seed/himmel/40/40",
    },
    createdAt: "2024-06-08T16:00:00Z",
  },
];

// Nav items

const NAV_ITEMS = [
  {
    label: "Feeds",
    to: "/feeds",
    icon: "fa-solid fa-house",
  },
  {
    label: "Discovery",
    to: "/discover",
    icon: "fa-solid fa-compass",
  },
];

export const Feeds = () => {
  const [feedMode, setFeedMode] = useState<FeedMode>("photos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>(MOCK_ALBUMS);

  const handleLikePhoto = (photoId: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
            ...p,
            likedByMe: !p.likedByMe,
            likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
          }
          : p
      )
    );
  };

  const handleLikeAlbum = (albumId: number) => {
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? {
            ...a,
            likedByMe: !a.likedByMe,
            likesCount: a.likedByMe ? a.likesCount - 1 : a.likesCount + 1,
          }
          : a
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        currentUser={MOCK_USER}
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={() => console.log("logout")}
      />

      <div className="mx-auto flex max-w-screen gap-6">
        <SideBar
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
          <FeedToggle mode={feedMode} onChange={setFeedMode} />

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {feedMode === "photos"
              ? photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onLike={handleLikePhoto}
                  onClickPhoto={(p) => console.log("open photo", p.id)}
                  onClickAuthor={(id) => console.log("go to profile", id)}
                />
              ))
              : albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onLike={handleLikeAlbum}
                  onClickAlbum={(a) => console.log("open album", a.id)}
                  onClickAuthor={(id) => console.log("go to profile", id)}
                />
              ))}
          </div>
        </main>

        {/* Right spacer - mirrors sidebar width on desktop */}
        <div className="hidden sm:block min-w-56 shrink-0 bg-gray-100" />
      </div>
    </div>
  );
};