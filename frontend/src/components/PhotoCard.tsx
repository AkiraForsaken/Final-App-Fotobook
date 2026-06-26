import { useState } from 'react';
import { Avatar } from './myUI/Avatar.tsx';
import type { Photo } from '../types/index.ts';

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
		<article className="flex items-stretch overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow duration-150">
			{/* Thumbnail */}
			<button
				className="w-64 shrink-0 cursor-pointer
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
					<span className="text-sm font-medium text-gray-900 hover:underline">
						{author.firstName} {author.lastName}
					</span>
				</button>

				{/* Title */}
				<p className="font-semibold text-gray-900 truncate">{photo.title}</p>

				{/* Description */}
				<p className="text-sm text-gray-600 line-clamp-2">{photo.description}</p>

				{/* Date */}
				<p className="text-xs text-gray-400">{formattedDate}</p>

				{/* Like */}
				<div className="mt-auto flex items-center gap-1.5">
					<button
						onClick={() => onLike?.(photo.id)}
						aria-label={photo.likedByMe ? `Unlike ${photo.title}` : `Like ${photo.title}`}
						className={`flex items-center gap-1.5 transition-colors focus-visible:outline-none ${
							photo.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
						}`}
					>
						<i className={`${photo.likedByMe ? 'fa-solid' : 'fa-regular'} fa-heart`} />
						<span>{photo.likesCount}</span>
					</button>
				</div>
			</div>
		</article>
	);
};
