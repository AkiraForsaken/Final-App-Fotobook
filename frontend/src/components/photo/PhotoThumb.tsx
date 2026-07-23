import { useState } from 'react';
import type { Photo } from '../../types/index';

interface PhotoThumbProps {
	photo: Photo;
	isOwner?: boolean;
	onOpen: (photo: Photo) => void;
	onEdit?: (photo: Photo) => void;
}

/**
 * PhotoThumb — square thumbnail card for the profile photo grid.
 * Shows a lock badge for private photos and an Edit overlay for owners.
 */
export const PhotoThumb = ({ photo, isOwner = false, onOpen, onEdit }: PhotoThumbProps) => {
	const isPrivate = photo.sharingMode === 'private';
	const [imgError, setImgError] = useState(false);

	return (
		<div className="relative group aspect-square bg-bg-page rounded-md overflow-hidden cursor-pointer">
			{photo.imageUrl && !imgError ? (
				<img
					src={photo.imageUrl}
					alt={photo.title}
					className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
					onClick={() => onOpen(photo)}
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

			{/* Likes + Title overlay on hover */}
			<div
				className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white pointer-events-none"
				onClick={() => onOpen(photo)}
			>
				<span className="text-sm font-semibold px-2 text-center line-clamp-2">{photo.title}</span>
				<span className="text-xs flex items-center gap-1">
					<i className="fa-solid fa-heart" />
					{photo.likesCount}
				</span>
			</div>

			{/* Owner edit button */}
			{isOwner && onEdit && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(photo);
					}}
					className="absolute bottom-2 right-2 z-10 bg-white/90 text-text-secondary cursor-pointer
					rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
					title="Edit photo"
				>
					<i className="fa-solid fa-pen text-xs" />
				</button>
			)}
		</div>
	);
};
