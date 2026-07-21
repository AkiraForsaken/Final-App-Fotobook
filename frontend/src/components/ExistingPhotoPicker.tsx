import { useCallback, useState } from 'react';
import { usePaginatedContent } from '../hooks/usePaginatedContent.ts';
import { userService } from '../service/userService.ts';
import type { Photo, User } from '../types/index.ts';
import { Button } from './myUI/Button.tsx';

interface ExistingPhotoPickerProps {
	currentUser: User;
	/** Photo ids already staged for this album — shown as disabled, can't double-add. */
	alreadyStagedIds: Set<number>;
	remainingSlots: number;
	onConfirm: (photos: Photo[]) => void;
	onClose: () => void;
}

/**
 * ExistingPhotoPicker — lets the user browse their own already-posted
 * standalone photos (GET /users/:id/photos, isStandalone-only per the
 * backend) and select some to attach to the album being created.
 */
export const ExistingPhotoPicker = ({
	currentUser,
	alreadyStagedIds,
	remainingSlots,
	onConfirm,
	onClose,
}: ExistingPhotoPickerProps) => {
	const fetchPhotos = useCallback(
		(cursor: number | undefined, take: number) =>
			userService.getUserPhotos(currentUser.id, cursor, take),
		[currentUser.id]
	);
	const { items, loading, loadingMore, sentinelRef } = usePaginatedContent<Photo>(fetchPhotos, 20);

	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	const toggle = (photoId: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(photoId)) {
				next.delete(photoId);
			} else if (next.size < remainingSlots) {
				next.add(photoId);
			}
			return next;
		});
	};

	const confirm = () => {
		onConfirm(items.filter((p) => selectedIds.has(p.id)));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-surface rounded-xl shadow-lg">
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-lg font-semibold text-text-primary">Add existing photos</h2>
					<button onClick={onClose} aria-label="Close" className="p-2 text-text-secondary">
						<i className="fa-solid fa-xmark" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					{loading ? (
						<div className="py-12 text-center text-text-muted">Loading your photos…</div>
					) : items.length === 0 ? (
						<div className="py-12 text-center text-text-muted">
							You don't have any standalone photos to add yet.
						</div>
					) : (
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
							{items.map((photo) => {
								const disabled = alreadyStagedIds.has(photo.id);
								const selected = selectedIds.has(photo.id);
								return (
									<button
										key={photo.id}
										type="button"
										disabled={disabled}
										onClick={() => toggle(photo.id)}
										className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
											selected ? 'border-blue-600' : 'border-transparent'
										} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
									>
										<img
											src={photo.imageUrl}
											alt={photo.title}
											className="w-full h-full object-cover"
										/>
										{selected && (
											<div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
												<i className="fa-solid fa-check" />
											</div>
										)}
										{disabled && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs">
												Added
											</div>
										)}
									</button>
								);
							})}
						</div>
					)}
					<div ref={(node) => sentinelRef(node)} className="flex justify-center py-4">
						{loadingMore && <i className="fa-solid fa-spinner fa-spin text-text-muted" />}
					</div>
				</div>

				<div className="flex items-center justify-between p-4 border-t border-border">
					<span className="text-sm text-text-muted">
						{selectedIds.size} selected · {remainingSlots} slot{remainingSlots === 1 ? '' : 's'}{' '}
						left
					</span>
					<div className="flex gap-2">
						<Button variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button variant="primary" onClick={confirm} disabled={selectedIds.size === 0}>
							Add{selectedIds.size > 0 ? ` ${selectedIds.size}` : ''}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
