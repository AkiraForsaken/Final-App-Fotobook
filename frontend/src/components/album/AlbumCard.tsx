import { Avatar } from '../myUI/Avatar.tsx';
import type { Album } from '../../types/index.ts';
import { cn } from '../../utils/cn.ts';
import { FannedCovers } from '../myUI/FannedCover.tsx';

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

	return (
		<article
			className="flex flex-col md:flex-row overflow-hidden rounded-lg bg-surface shadow-sm 
		ring-1 ring-gray-200 hover:shadow-md transition-shadow duration-150"
		>
			{/* Thumbnail for larger screens */}
			<button
				className="group hidden w-full max-w-none shrink-0 cursor-pointer md:block md:w-64
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
				onClick={() => onClickAlbum?.(album)}
				aria-label={`View album: ${album.title}`}
			>
				<FannedCovers album={album} />
			</button>

			{/* Author on top for small screens, content / right side on large screens */}
			<div className="flex flex-col gap-2 px-4 py-3 min-w-0 flex-1">
				<button
					className="flex items-center gap-2 w-fit cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
					onClick={() => onClickAuthor?.(author.id)}
					aria-label={`View ${author.firstName} ${author.lastName}'s profile`}
				>
					<Avatar
						src={author.avatarUrl}
						firstName={author.firstName}
						lastName={author.lastName}
						size="w-10 h-10"
					/>
					<span className="text-sm font-medium truncate text-text-primary hover:underline">
						{author.firstName} {author.lastName}
					</span>
				</button>

				{/* Thumbnail for small screens */}
				<button
					className="group relative w-full overflow-hidden rounded-lg cursor-pointer md:hidden mx-auto"
					onClick={() => onClickAlbum?.(album)}
					aria-label={`View album: ${album.title}`}
				>
					<FannedCovers album={album} />
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
