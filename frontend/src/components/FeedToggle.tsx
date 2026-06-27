import type { FeedMode } from '../types/index.ts';
import { cn } from '../utils/cn.ts';

interface FeedToggleProps {
	mode: FeedMode;
	onChange: (mode: FeedMode) => void;
}

export const FeedToggle = ({ mode, onChange }: FeedToggleProps) => {
	return (
		<div
			className="flex self-center border border-gray-300 rounded overflow-hidden select-none"
			role="group"
			aria-label="Feed type"
		>
			<button
				onClick={() => onChange('photos')}
				className={cn(
					'px-4 py-2 text-sm font-bold cursor-pointer transition-colors duration-150',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
					mode === 'photos' ? 'bg-blue-800 text-white' : 'bg-white text-blue-800 hover:bg-blue-50'
				)}
				aria-pressed={mode === 'photos'}
			>
				PHOTOS
			</button>
			<button
				onClick={() => onChange('albums')}
				className={cn(
					'px-4 py-2 text-sm font-bold cursor-pointer transition-colors duration-150',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
					mode === 'albums' ? 'bg-blue-800 text-white' : 'bg-white text-blue-800 hover:bg-blue-50'
				)}
				aria-pressed={mode === 'albums'}
			>
				ALBUMS
			</button>
		</div>
	);
};
