import { useRef } from 'react';
import { cn } from '../utils/cn.ts';
import { ACCEPTED_EXT, validateImageFile } from '../utils/imageValidation.ts';
import {
	MAX_ALBUM_PHOTOS,
	type StagedPhoto,
	type StagedPhotoResult,
} from '../hooks/useAlbumPhotoStaging.ts';

interface MultiImageUploadZoneProps {
	files?: File[];
	staged?: StagedPhoto[];
	results?: StagedPhotoResult[];
	existingImageUrls?: string[];
	existingPhotoIds?: number[]; // ids -> urls
	removingPhotoId?: number | null;
	onRemoveExisting?: (photoId: number) => void;
	onChange?: (files: File[]) => void;
	onAddFiles?: (files: File[]) => void;
	onRemoveStaged?: (key: string) => void;
	onRemoveFile?: (index: number) => void;
	onError: (message: string) => void;
	label?: string;
	actionSlot?: React.ReactNode;
}

/**
 * MultiImageUploadZone — grid-based multi-image upload for album forms.
 */
export const MultiImageUploadZone = ({
	files = [],
	staged,
	results = [],
	existingImageUrls = [],
	existingPhotoIds,
	removingPhotoId,
	onRemoveExisting,
	onChange,
	onAddFiles,
	onRemoveStaged,
	onRemoveFile,
	onError,
	label = 'Album',
	actionSlot,
}: MultiImageUploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const totalCount = staged ? staged.length : existingImageUrls.length + files.length;
	const isFull = totalCount >= MAX_ALBUM_PHOTOS;

	const handleIncomingFiles = (incoming: FileList | File[]) => {
		const candidates = Array.from(incoming);
		const accepted: File[] = [];
		let count = totalCount;

		for (const candidate of candidates) {
			if (count >= MAX_ALBUM_PHOTOS) {
				onError(`You can add up to ${MAX_ALBUM_PHOTOS} images per album.`);
				break;
			}
			const err = validateImageFile(candidate);
			if (err) {
				onError(err);
				continue;
			}
			accepted.push(candidate);
			count++;
		}

		if (accepted.length > 0) {
			if (onAddFiles) onAddFiles(accepted);
			else if (onChange) onChange([...files, ...accepted]);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		handleIncomingFiles(e.dataTransfer.files);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) handleIncomingFiles(e.target.files);
		e.target.value = '';
	};

	const sharedTileClasses = 'relative aspect-square rounded-xl overflow-hidden select-none';

	return (
		<div className="flex flex-col gap-3">
			{/* Label row */}
			<div className="flex items-center justify-between">
				<label className="block text-sm font-medium text-text-secondary">
					{label}
					<span className="text-red-500 ml-0.5">*</span>
				</label>
				<div className="flex items-center gap-3">
					{actionSlot}
					<span className="text-xs text-text-muted tabular-nums">
						{totalCount}/{MAX_ALBUM_PHOTOS}
					</span>
				</div>
			</div>

			{/* Grid — thumbnails + "+" slot */}
			<div
				className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				{/* Saved image URLs */}
				{existingImageUrls.map((url, i) => {
					const photoId = existingPhotoIds?.[i];
					const isRemoving = photoId !== undefined && removingPhotoId === photoId;

					return (
						<div
							key={`existing-${i}`}
							className={cn(sharedTileClasses, 'bg-bg-page ring-1 ring-gray-200 group')}
						>
							<img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />

							{onRemoveExisting && photoId !== undefined && (
								<button
									type="button"
									aria-label="Remove image"
									onClick={() => onRemoveExisting(photoId)}
									disabled={isRemoving}
									className={cn(
										'absolute top-2 right-2 flex items-center justify-center z-10',
										'w-6 h-6 rounded-full bg-black/60 text-white cursor-pointer',
										'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
									)}
								>
									{isRemoving ? (
										<i className="fa-solid fa-spinner fa-spin" />
									) : (
										<i className="fa-solid fa-xmark" />
									)}
								</button>
							)}
						</div>
					);
				})}

				{/* Staged photos flow (AddAlbum) */}
				{staged
					? staged.map((item) => {
							const src = item.kind === 'new' ? item.previewUrl : item.photo.imageUrl;
							const failed = results.find((r) => r.key === item.key && r.status === 'error');
							return (
								<div
									key={item.key}
									className={cn(sharedTileClasses, 'bg-bg-page ring-1 ring-blue-200 group')}
								>
									<img src={src} alt="" className="w-full h-full object-cover" />
									<button
										type="button"
										aria-label="Remove image"
										onClick={() => onRemoveStaged?.(item.key)}
										className={cn(
											'absolute top-1.5 right-1.5 flex items-center justify-center',
											'w-6 h-6 rounded-full bg-black/60 text-white text-xs',
											'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
										)}
									>
										<i className="fa-solid fa-xmark" />
									</button>
									{failed && (
										<div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-[10px] text-center py-0.5">
											Failed
										</div>
									)}
								</div>
							);
						})
					: files.map((file, i) => {
							const previewUrl = URL.createObjectURL(file);
							return (
								<div
									key={`new-${i}`}
									className={cn(sharedTileClasses, 'bg-bg-page ring-1 ring-blue-200 group')}
								>
									<img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
									<button
										type="button"
										aria-label={`Remove ${file.name}`}
										onClick={() => onRemoveFile?.(i)}
										className={cn(
											'absolute top-1.5 right-1.5 flex items-center justify-center',
											'w-6 h-6 rounded-full bg-black/60 text-white text-xs',
											'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
										)}
									>
										<i className="fa-solid fa-xmark" />
									</button>
								</div>
							);
						})}

				{/* "+" add slot */}
				{!isFull && (
					<button
						type="button"
						aria-label="Add image"
						onClick={() => inputRef.current?.click()}
						className={cn(
							sharedTileClasses,
							'border-2 border-dashed border-border-strong bg-surface-secondary',
							'flex items-center justify-center cursor-pointer',
							'text-text-muted hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500',
							'transition-colors'
						)}
					>
						<i className="fa-solid fa-plus text-xl" />
					</button>
				)}
			</div>

			{isFull && (
				<p className="text-xs text-amber-600 font-medium">
					Album is full ({MAX_ALBUM_PHOTOS}/{MAX_ALBUM_PHOTOS} images).
				</p>
			)}

			<p className="text-xs text-text-muted">JPEG, PNG, GIF · max 5 MB each</p>

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED_EXT.join(',')}
				multiple
				className="sr-only"
				onChange={handleInputChange}
			/>
		</div>
	);
};
