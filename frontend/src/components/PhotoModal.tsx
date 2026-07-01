import { Modal } from './myUI/Modal';
import type { Photo } from '../types/index';

interface PhotoModalProps {
	photo: Photo | null;
	onClose: () => void;
}

/**
 * PhotoModal — displays a single photo with its title and description.
 * Pass `photo={null}` (or don't pass) to keep it closed.
 */
export const PhotoModal = ({ photo, onClose }: PhotoModalProps) => {
	return (
		<Modal
			isOpen={!!photo}
			onClose={onClose}
			ariaLabel={photo ? `Photo: ${photo.title}` : 'Photo viewer'}
			panelClassName="w-full max-w-3xl max-h-[90vh]"
		>
			{photo && (
				<>
					{/* ── Header ── */}
					<div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
						<h2 className="text-base font-semibold text-text-primary truncate pr-4">
							{photo.title}
						</h2>
						<button
							onClick={onClose}
							aria-label="Close photo viewer"
							className="shrink-0 rounded-full p-1.5 text-text-muted cursor-pointer
							hover:text-text-secondary hover:bg-bg-page transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							<i className="fa-solid fa-xmark text-lg" />
						</button>
					</div>

					{/* ── Image ── */}
					<div className="overflow-auto flex items-center justify-center bg-surface-secondary min-h-0 flex-1">
						<img
							src={photo.imageUrl}
							alt={photo.title}
							className="max-w-full max-h-[65vh] object-contain"
						/>
					</div>

					{/* ── Description ── */}
					{photo.description && (
						<div className="px-5 py-3 border-t border-border shrink-0">
							<p className="text-sm text-text-secondary leading-relaxed">{photo.description}</p>
						</div>
					)}
				</>
			)}
		</Modal>
	);
};
