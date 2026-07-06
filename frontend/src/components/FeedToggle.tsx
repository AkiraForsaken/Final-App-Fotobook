import type { FeedMode } from '../types/index.ts';
import { cn } from '../utils/cn.ts';
import { Button } from './myUI/Button.tsx';

interface FeedToggleProps {
	mode: FeedMode;
	onChange: (mode: FeedMode) => void;
}

export const FeedToggle = ({ mode, onChange }: FeedToggleProps) => {
	return (
		<div
			className="flex self-center border border-border-strong rounded-lg overflow-hidden select-none"
			role="group"
			aria-label="Feed type"
		>
			<Button
				onClick={() => onChange('photos')}
				className={cn(
					'rounded-none',
					mode === 'photos'
						? 'bg-blue-800 text-white'
						: 'bg-surface text-text-primary hover:bg-blue-50'
				)}
				aria-pressed={mode === 'photos'}
			>
				PHOTOS
			</Button>
			<Button
				onClick={() => onChange('albums')}
				className={cn(
					'rounded-none',
					mode === 'albums'
						? 'bg-blue-800 text-white'
						: 'bg-surface text-text-primary hover:bg-blue-50'
				)}
				aria-pressed={mode === 'albums'}
			>
				ALBUMS
			</Button>
		</div>
	);
};
