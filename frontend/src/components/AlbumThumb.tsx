import { useState } from 'react';
import type { Album } from '../types/index';

interface AlbumThumbProps {
	album: Album;
	isOwner?: boolean;
	onOpen: (album: Album) => void;
	onEdit?: (album: Album) => void;
}

/**
 * AlbumThumb — square thumbnail card for the profile album grid.
 * Shows image count badge, lock badge for private albums, and Edit for owners.
 */
export const AlbumThumb = ({ album, isOwner = false, onOpen, onEdit }: AlbumThumbProps) => {
	const isPrivate = album.sharingMode === 'private';
	const [imgError, setImgError] = useState(false);

	return (
		<div className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer">
			{album.coverImageUrl && !imgError ? (
				<img
					src={album.coverImageUrl}
					alt={album.title}
					className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
					onClick={() => onOpen(album)}
					onError={() => setImgError(true)}
				/>
			) : (
				<img
					src={'/assets/fallback.png'}
					alt={'Error fallback image'}
					className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
				/>
			)}

			{/* Private badge */}
			{isPrivate && (
				<span className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 leading-none">
					<i className="fa-solid fa-lock text-xs" />
				</span>
			)}

			{/* Image count badge */}
			<span className="absolute top-2 right-2 bg-black/60 text-white text-sm rounded-full px-2 py-0.5 font-medium">
				<i className="fa-solid fa-images mr-1" />
				{album.imageUrls.length}
			</span>

			{/* Likes + title overlay on hover */}
			<div
				className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white pointer-events-none"
				onClick={() => onOpen(album)}
			>
				<span className="text-sm font-semibold px-2 text-center line-clamp-2">{album.title}</span>
				<span className="text-xs flex items-center gap-1">
					<i className="fa-solid fa-heart" />
					{album.likesCount}
				</span>
			</div>

			{/* Owner edit button */}
			{isOwner && onEdit && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(album);
					}}
					className="absolute bottom-2 right-2 bg-white/90 text-gray-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
					title="Edit album"
				>
					<i className="fa-solid fa-pen text-xs" />
				</button>
			)}
		</div>
	);
};
