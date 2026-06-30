import { useRef } from 'react';
import { cn } from '../utils/cn.ts';
import { ACCEPTED_EXT, validateImageFile } from '../utils/imageValidation.ts';

const MAX_FILES = 20;

interface MultiImageUploadZoneProps {
	files: File[];
	existingImageUrls?: string[];
	onChange: (files: File[]) => void;
	onError: (message: string) => void;
	label?: string;
}

/**
 * MultiImageUploadZone — grid-based multi-image upload for the album form.
 */
export const MultiImageUploadZone = ({
	files,
	existingImageUrls = [],
	onChange,
	onError,
	label = 'Album',
}: MultiImageUploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const totalCount = existingImageUrls.length + files.length;
	const isFull = totalCount >= MAX_FILES;

	const addFiles = (incoming: FileList | File[]) => {
		const candidates = Array.from(incoming);
		const accepted: File[] = [];
		let count = totalCount;

		for (const candidate of candidates) {
			if (count >= MAX_FILES) {
				onError(`You can add up to ${MAX_FILES} images per album.`);
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

		if (accepted.length > 0) onChange([...files, ...accepted]);
	};

	const removeNewFile = (index: number) => onChange(files.filter((_, i) => i !== index));

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		addFiles(e.dataTransfer.files);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) addFiles(e.target.files);
		e.target.value = '';
	};

	const sharedTileClasses = 'relative aspect-square rounded-xl overflow-hidden select-none';

	return (
		<div className="flex flex-col gap-3">
			{/* Label row */}
			<div className="flex items-center justify-between">
				<label className="block text-sm font-medium text-gray-700">
					{label}
					<span className="text-red-500 ml-0.5">*</span>
				</label>
				<span className="text-xs text-gray-400 tabular-nums">
					{totalCount}/{MAX_FILES}
				</span>
			</div>

			{/* Grid — thumbnails + "+" slot */}
			<div
				className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				{/* Existing saved images */}
				{existingImageUrls.map((url, i) => (
					<div
						key={`existing-${i}`}
						className={cn(sharedTileClasses, 'bg-gray-100 ring-1 ring-gray-200 group')}
					>
						<img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
						<span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white font-medium leading-none pointer-events-none">
							Saved
						</span>
					</div>
				))}

				{/* Newly added files */}
				{files.map((file, i) => {
					const previewUrl = URL.createObjectURL(file);
					return (
						<div
							key={`new-${i}`}
							className={cn(sharedTileClasses, 'bg-gray-100 ring-1 ring-blue-200 group')}
						>
							<img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
							{/* × remove button — top-right, appears on hover */}
							<button
								type="button"
								aria-label={`Remove ${file.name}`}
								onClick={() => removeNewFile(i)}
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

				{/* "+" add-next slot — only shown when under the cap */}
				{!isFull && (
					<button
						type="button"
						aria-label="Add image"
						onClick={() => inputRef.current?.click()}
						className={cn(
							sharedTileClasses,
							'border-2 border-dashed border-gray-300 bg-gray-50',
							'flex items-center justify-center cursor-pointer',
							'text-gray-400 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500',
							'transition-colors'
						)}
					>
						<i className="fa-solid fa-plus text-xl" />
					</button>
				)}
			</div>

			{isFull && (
				<p className="text-xs text-amber-600 font-medium">
					Album is full ({MAX_FILES}/{MAX_FILES} images).
				</p>
			)}

			<p className="text-xs text-gray-400">JPEG, PNG, GIF · max 5 MB each</p>

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
