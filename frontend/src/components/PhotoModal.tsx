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
					<div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
						<h2 className="text-base font-semibold text-gray-900 truncate pr-4">{photo.title}</h2>
						<button
							onClick={onClose}
							aria-label="Close photo viewer"
							className="shrink-0 rounded-full p-1.5 text-gray-400 cursor-pointer
							hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							<i className="fa-solid fa-xmark text-lg" />
						</button>
					</div>

					{/* ── Image ── */}
					<div className="overflow-auto flex items-center justify-center bg-gray-50 min-h-0 flex-1">
						<img
							src={photo.imageUrl}
							alt={photo.title}
							className="max-w-full max-h-[65vh] object-contain"
						/>
					</div>

					{/* ── Description ── */}
					{photo.description && (
						<div className="px-5 py-3 border-t border-gray-100 shrink-0">
							<p className="text-sm text-gray-600 leading-relaxed">{photo.description}</p>
						</div>
					)}
				</>
			)}
		</Modal>
	);
};
