import { useState } from "react";
import { SideBar } from "../components/SideBar.tsx";
import { PhotoCard } from "../components/PhotoCard.tsx";
import { AlbumCard } from "../components/AlbumCard.tsx";
import { FeedToggle } from "../components/FeedToggle.tsx";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll.ts";
import type { FeedMode, Photo, Album, User } from "../types/index.ts";
import { FEED_ALBUMS, FEED_PHOTO_META } from "../mockData.ts";

// Local images
import fernImage from "../assets/fern.jpeg"
import frierenImage from "../assets/frieren.jpeg"
import starkImage from "../assets/stark.jpeg"
import himmelImage from "../assets/himmel.jpeg"
import heiterImage from "../assets/heiter.jpeg"
import eisenImage from "../assets/eisen.jpeg"

const ASSET_MAP: Record<number, string> = {
  1: fernImage,
  2: frierenImage,
  3: starkImage,
  4: himmelImage,
  5: heiterImage,
  6: eisenImage,
  // ids 7–12 fall back to picsum
};

const ALL_PHOTOS: Photo[] = FEED_PHOTO_META.map((meta) => ({
  ...meta,
  imageUrl: ASSET_MAP[meta.id] ?? `https://picsum.photos/seed/fp${meta.id}/600/400`,
}));


// Nav items

const NAV_ITEMS = [
  { label: "Feeds", to: "/feeds", icon: "fa-solid fa-house" },
  { label: "Discovery", to: "/discover", icon: "fa-solid fa-compass" },
];

const PAGE_SIZE = 6;

const ScrollFooter = ({ hasMore }: { hasMore: boolean; isFeeds: boolean }) => {
  return (
    hasMore ? (
      <span className="text-sm text-gray-400 flex items-center gap-2">
        <i className="fa-solid fa-spinner fa-spin" />
        Loading more…
      </span>
    ) : (
      <span className="text-sm text-gray-400">
        <i className="fa-solid fa-check-circle mr-1" />
        You're all caught up!
      </span>
    )
  )
}


export const Feeds = ({ currentUser, mobileOpen, setMobileOpen }: { currentUser: User; mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) => {
  const [feedMode, setFeedMode] = useState<FeedMode>("photos");
  const [photos, setPhotos] = useState<Photo[]>(ALL_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>(FEED_ALBUMS);

  // Separate infinite-scroll instances for each mode
  const photoScroll = useInfiniteScroll(photos, PAGE_SIZE);
  const albumScroll = useInfiniteScroll(albums, PAGE_SIZE);

  const handleLikePhoto = (photoId: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    );
  };

  const handleLikeAlbum = (albumId: number) => {
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, likedByMe: !a.likedByMe, likesCount: a.likedByMe ? a.likesCount - 1 : a.likesCount + 1 }
          : a
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex max-w-screen gap-6">
        <SideBar
          items={NAV_ITEMS}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Main content */}
        <main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
          <FeedToggle mode={feedMode} onChange={setFeedMode} />

          <div className="mt-6">
            {/* Photos grid  */}
            <div className={feedMode === "photos" ? "" : "hidden"}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {(photoScroll.visibleItems as Photo[]).map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onLike={handleLikePhoto}
                    onClickPhoto={(p) => console.log("open photo", p.id)}
                    onClickAuthor={(id) => console.log("go to profile", id)}
                  />
                ))}
              </div>
              {/* Photo sentinel */}
              <div
                ref={photoScroll.sentinelRef}
                className="mt-4 flex justify-center py-6"
              >
                <ScrollFooter hasMore={photoScroll.hasMore || photoScroll.loading} isFeeds />
              </div>
            </div>

            {/* Albums grid */}
            <div className={feedMode === "albums" ? "" : "hidden"}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {(albumScroll.visibleItems as Album[]).map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onLike={handleLikeAlbum}
                    onClickAlbum={(p) => console.log("open photo", p.id)}
                    onClickAuthor={(id) => console.log("go to profile", id)}
                  />
                ))}
              </div>
              {/* Album sentinel */}
              <div
                ref={albumScroll.sentinelRef}
                className="mt-4 flex justify-center py-6"
              >
                <ScrollFooter hasMore={albumScroll.hasMore || albumScroll.loading} isFeeds />
              </div>
            </div>
          </div>
        </main>

        {/* Right spacer */}
        <div className="hidden lg:block min-w-[13%] shrink-0 bg-gray-100" />
      </div>
    </div>
  );
};