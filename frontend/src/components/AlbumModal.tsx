import { useState, useEffect } from 'react';
import { Modal } from './myUI/Modal';
import type { Album } from '../types/index';
import { cn } from '../utils/cn.ts';

interface AlbumModalProps {
	album: Album | null;
	onClose: () => void;
}

interface CarouselProps {
	album: Album;
	onClose: () => void;
}

/**
 * Carousel is keyed on album.id in AlbumModal, so React remounts it
 * fresh whenever a different album is opened — currentIndex resets to 0
 * automatically without any synchronous setState-in-effect.
 */
const Carousel = ({ album, onClose }: CarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const total = album.imageUrls.length;

	// Arrow-key navigation
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1));
			if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(total - 1, i + 1));
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [total]);

	const goBack = () => setCurrentIndex((i) => Math.max(0, i - 1));
	const goForward = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

	return (
		<>
			{/* ── Header ── */}
			<div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
				<h2 className="text-base font-semibold text-text-primary truncate pr-4">{album.title}</h2>
				<button
					onClick={onClose}
					aria-label="Close album viewer"
					className="shrink-0 rounded-full p-1.5 text-text-muted cursor-pointer
					hover:text-text-secondary hover:bg-bg-page transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
				>
					<i className="fa-solid fa-xmark text-lg" />
				</button>
			</div>

			{/* ── Carousel ── */}
			<div className="relative flex items-center justify-center bg-surface-secondary min-h-0 flex-1 select-none">
				<button
					onClick={goBack}
					disabled={currentIndex === 0}
					aria-label="Previous image"
					className="absolute left-3 z-10 rounded-full bg-white/80 p-2 shadow hover:bg-surface cursor-pointer
					disabled:opacity-30 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none 
					focus-visible:ring-2 focus-visible:ring-blue-500"
				>
					<i className="fa-solid fa-chevron-left text-text-secondary" />
				</button>

				<img
					src={album.imageUrls[currentIndex]}
					alt={`${album.title} — image ${currentIndex + 1} of ${total}`}
					className="max-w-full max-h-[60vh] object-contain"
				/>

				<button
					onClick={goForward}
					disabled={currentIndex === total - 1}
					aria-label="Next image"
					className="absolute right-3 z-10 rounded-full bg-white/80 p-2 shadow hover:bg-surface cursor-pointer
					disabled:opacity-30 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none 
					focus-visible:ring-2 focus-visible:ring-blue-500"
				>
					<i className="fa-solid fa-chevron-right text-text-secondary" />
				</button>
			</div>

			{/* ── Slide counter + dot strip ── */}
			<div className="flex flex-col items-center gap-2 py-2 shrink-0">
				<span className="text-xs text-text-muted tabular-nums">
					{currentIndex + 1} / {total}
				</span>
				{total > 1 && (
					<div className="flex gap-1.5">
						{album.imageUrls.map((_, i) => (
							<button
								key={i}
								onClick={() => setCurrentIndex(i)}
								aria-label={`Go to image ${i + 1}`}
								className={cn(
									'w-2 h-2 rounded-full transition-colors focus-visible:outline-none',
									i === currentIndex ? 'bg-blue-600' : 'bg-border-strong hover:bg-gray-400'
								)}
							/>
						))}
					</div>
				)}
			</div>

			{/* ── Description ── */}
			{album.description && (
				<div className="px-5 py-3 border-t border-border shrink-0">
					<p className="text-sm text-text-secondary leading-relaxed">{album.description}</p>
				</div>
			)}
		</>
	);
};

/**
 * AlbumModal — wraps Carousel in the base Modal.
 * The `key={album.id}` on Carousel ensures a clean remount (index → 0)
 * whenever a different album is opened, avoiding setState-in-effect.
 */
export const AlbumModal = ({ album, onClose }: AlbumModalProps) => {
	return (
		<Modal
			isOpen={!!album}
			onClose={onClose}
			ariaLabel={album ? `Album: ${album.title}` : 'Album viewer'}
			panelClassName="w-full max-w-3xl max-h-[90vh]"
		>
			{album && <Carousel key={album.id} album={album} onClose={onClose} />}
		</Modal>
	);
};
