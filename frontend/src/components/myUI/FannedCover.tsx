import type { Album } from '../../types';
import { useState } from 'react';

export const FannedCovers = ({ album }: { album: Album }) => {
	const [imgErrors, setImgErrors] = useState<boolean[]>([false, false, false]);
	const imageCount = album.imageUrls.length;

	const rawUrls = album.imageUrls || [];
	const covers = [
		rawUrls[0] || album.coverImageUrl || '/assets/fallback.png',
		rawUrls[1] || rawUrls[0] || album.coverImageUrl || '/assets/fallback.png',
		rawUrls[2] || rawUrls[0] || album.coverImageUrl || '/assets/fallback.png',
	];

	const handleErr = (idx: number) => {
		setImgErrors((prev) => {
			const next = [...prev];
			next[idx] = true;
			return next;
		});
	};

	return (
		<div className="relative w-full aspect-[4/3] sm:aspect-square flex items-center justify-center overflow-hidden">
			{/* 3rd Image */}
			<img
				src={imgErrors[2] ? '/assets/fallback.png' : covers[2]}
				alt={`${album.title} 3`}
				onError={() => handleErr(2)}
				className="absolute w-[85%] h-[85%] object-cover rounded-md shadow origin-center 
        rotate-[12deg] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[15deg]"
			/>

			{/* 2nd Image */}
			<img
				src={imgErrors[1] ? '/assets/fallback.png' : covers[1]}
				alt={`${album.title} 2`}
				onError={() => handleErr(1)}
				className="absolute w-[87%] h-[87%] object-cover rounded-md shadow-md origin-center 
        rotate-[6deg] transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[8deg]"
			/>

			{/* 1st Image */}
			<img
				src={imgErrors[0] ? '/assets/fallback.png' : covers[0]}
				alt={album.title}
				onError={() => handleErr(0)}
				className="absolute w-[90%] h-[90%] object-cover rounded-md shadow-lg origin-center 
        rotate-0 transition-transform duration-200 group-hover:scale-105"
			/>
			{/* Image count badge */}
			<span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded bg-black/60 p-1 text-sm text-white">
				<i className="fa-solid fa-images text-lg" />
				{imageCount}
			</span>
		</div>
	);
};
