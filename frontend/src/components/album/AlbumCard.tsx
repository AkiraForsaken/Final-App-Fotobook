import { Avatar } from '../myUI/Avatar.tsx';
import type { Album } from '../../types/index.ts';
import { useState } from 'react';
import { cn } from '../../utils/cn.ts';

interface AlbumCardProps {
	album: Album;
	onLike?: (albumId: number) => void;
	onClickAlbum?: (album: Album) => void;
	onClickAuthor?: (authorId: number) => void;
}

export const AlbumCard = ({ album, onLike, onClickAlbum, onClickAuthor }: AlbumCardProps) => {
	const { author } = album;
	const formattedDate = new Date(album.createdAt).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
	const imageCount = album.imageUrls.length;
	const [imgError, setImgError] = useState(false);

	return (
		<article className="flex items-stretch overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow duration-150">
			{/* Cover thumbnail with image count badge */}
			<button
				className="relative w-64 shrink-0 cursor-pointer
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
				onClick={() => onClickAlbum?.(album)}
				aria-label={`View album: ${album.title}`}
			>
				{album.coverImageUrl && !imgError ? (
					<img
						src={album.coverImageUrl}
						alt={album.title}
						className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
						onError={() => setImgError(true)}
					/>
				) : (
					<img
						src={'/assets/fallback.png'}
						alt={'Error fallback image'}
						className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
					/>
				)}
				{/* Image count badge */}
				<span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 p-1 text-sm text-white">
					<i className="fa-solid fa-images text-lg" />
					{imageCount}
				</span>
			</button>

			{/* Content */}
			<div className="flex flex-col gap-2 px-4 py-3 min-w-0 flex-1">
				{/* Author */}
				<button
					className="flex items-center gap-2 w-fit cursor-pointer
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
					onClick={() => onClickAuthor?.(author.id)}
					aria-label={`View ${author.firstName} ${author.lastName}'s profile`}
				>
					<Avatar
						src={author.avatarUrl}
						firstName={author.firstName}
						lastName={author.lastName}
						size="w-10 h-10"
					/>
					<span className="text-sm font-medium truncate max-w-36 text-text-primary hover:underline">
						{author.firstName} {author.lastName}
					</span>
				</button>

				{/* Title */}
				<p className="font-semibold text-text-primary truncate">{album.title}</p>

				{/* Description */}
				<p className="text-sm text-text-secondary line-clamp-2">{album.description}</p>

				{/* Date */}
				<p className="text-xs text-text-muted">{formattedDate}</p>

				{/* Like */}
				<div className="mt-auto flex items-center gap-1.5">
					<button
						onClick={() => onLike?.(album.id)}
						aria-label={album.likedByMe ? `Unlike ${album.title}` : `Like ${album.title}`}
						className={cn(
							'flex items-center gap-1.5 transition-colors focus-visible:outline-none',
							album.likedByMe ? 'text-red-500' : 'text-text-muted hover:text-red-400'
						)}
					>
						<i className={cn(album.likedByMe ? 'fa-solid' : 'fa-regular', 'fa-heart')} />
						<span>{album.likesCount}</span>
					</button>
				</div>
			</div>
		</article>
	);
};
