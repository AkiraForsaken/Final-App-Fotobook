import { useState } from 'react';
import { Avatar } from '../myUI/Avatar.tsx';
import type { Photo } from '../../types/index.ts';
import { cn } from '../../utils/cn.ts';

interface PhotoCardProps {
	photo: Photo;
	onLike?: (photoId: number) => void;
	onClickPhoto?: (photo: Photo) => void;
	onClickAuthor?: (authorId: number) => void;
}

export const PhotoCard = ({ photo, onLike, onClickPhoto, onClickAuthor }: PhotoCardProps) => {
	const { author } = photo;
	const [imgError, setImgError] = useState(false);
	const formattedDate = new Date(photo.createdAt).toLocaleDateString('en-US', {
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
				className="hidden w-full max-w-none shrink-0 cursor-pointer md:block md:w-64
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
				onClick={() => onClickPhoto?.(photo)}
				aria-label={`View photo: ${photo.title}`}
			>
				{photo.imageUrl && !imgError ? (
					<img
						src={photo.imageUrl}
						alt={photo.title}
						className="aspect-square w-full object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<img
						src={'/assets/fallback.png'}
						alt={'Error Fallback image'}
						className="aspect-square w-full object-cover"
					/>
				)}
			</button>

			{/* Author on top for small screens, content / right side on large screens */}
			<div className="flex flex-col gap-2 px-4 py-3 min-w-0 flex-1">
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
					<span className="text-sm font-medium truncate text-text-primary hover:underline">
						{author.firstName} {author.lastName}
					</span>
				</button>

				{/* Thumbnail for small screens */}
				<button
					className="relative w-full overflow-hidden rounded-lg cursor-pointer md:hidden mx-auto"
					onClick={() => onClickPhoto?.(photo)}
					aria-label={`View photo: ${photo.title}`}
				>
					{photo.imageUrl && !imgError ? (
						<img
							src={photo.imageUrl}
							alt={photo.title}
							className="aspect-[4/3] w-full object-cover"
							onError={() => setImgError(true)}
						/>
					) : (
						<img
							src={'/assets/fallback.png'}
							alt={'Error Fallback image'}
							className="aspect-[4/3] w-full object-cover"
						/>
					)}
				</button>

				{/* Title */}
				<p className="font-semibold text-text-primary truncate">{photo.title}</p>

				{/* Description */}
				<p className="text-sm text-text-secondary line-clamp-2">{photo.description}</p>

				{/* Date */}
				<p className="text-xs text-text-muted">{formattedDate}</p>

				{/* Like */}
				<div className="mt-auto flex items-center gap-1.5">
					<button
						onClick={() => onLike?.(photo.id)}
						aria-label={photo.likedByMe ? `Unlike ${photo.title}` : `Like ${photo.title}`}
						className={cn(
							'flex items-center gap-1.5 transition-colors focus-visible:outline-none',
							photo.likedByMe ? 'text-red-500' : 'text-text-muted hover:text-red-400'
						)}
					>
						<i className={cn(photo.likedByMe ? 'fa-solid' : 'fa-regular', 'fa-heart')} />
						<span>{photo.likesCount}</span>
					</button>
				</div>
			</div>
		</article>
	);
};
