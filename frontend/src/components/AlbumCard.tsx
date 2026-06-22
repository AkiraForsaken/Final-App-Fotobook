import { Avatar } from "./myUI/Avatar.tsx";
import type { Album } from "../types/index.ts";

interface AlbumCardProps {
  album: Album;
  onLike?: (albumId: number) => void;
  onClickAlbum?: (album: Album) => void;
  onClickAuthor?: (authorId: number) => void;
}

export const AlbumCard = ({ album, onLike, onClickAlbum, onClickAuthor }: AlbumCardProps) => {
  const { author } = album;
  const formattedDate = new Date(album.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const imageCount = album.imageUrls.length;

  return (
    <article className="flex items-stretch overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow duration-150">
      {/* Cover thumbnail with image count badge */}
      <button
        className="relative w-2/5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        onClick={() => onClickAlbum?.(album)}
        aria-label={`View album: ${album.title}`}
      >
        <img
          src={album.coverImageUrl}
          alt={album.title}
          className="aspect-square w-full object-cover"
        />
        {/* Image count badge */}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          <i className="fa-solid fa-images text-[10px]" />
          {imageCount}
        </span>
      </button>

      {/* Content */}
      <div className="flex flex-col gap-2 px-4 py-3 min-w-0 flex-1">
        {/* Author */}
        <button
          className="flex items-center gap-2 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          onClick={() => onClickAuthor?.(author.id)}
          aria-label={`View ${author.firstName} ${author.lastName}'s profile`}
        >
          <Avatar
            src={author.avatarUrl}
            firstName={author.firstName}
            lastName={author.lastName}
            size="sm"
          />
          <span className="text-sm font-medium text-gray-900 hover:underline">
            {author.firstName} {author.lastName}
          </span>
        </button>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-900 truncate">
          {album.title}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{album.description}</p>

        {/* Date */}
        <p className="text-xs text-gray-400">{formattedDate}</p>

        {/* Like */}
        <div className="mt-auto flex items-center gap-1.5">
          <button
            onClick={() => onLike?.(album.id)}
            aria-label={album.likedByMe ? "Unlike" : "Like"}
            className={`flex items-center gap-1.5 text-sm transition-colors focus-visible:outline-none ${album.likedByMe
              ? "text-red-500"
              : "text-gray-400 hover:text-red-400"
              }`}
          >
            <i
              className={`${album.likedByMe ? "fa-solid" : "fa-regular"
                } fa-heart`}
            />
            <span>{album.likesCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
};