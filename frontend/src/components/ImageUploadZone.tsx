import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn.ts';
import { ACCEPTED_EXT, validateImageFile } from '../utils/imageValidation.ts';

interface ImageUploadZoneProps {
	file: File | null;
	existingImageUrl?: string;
	onChange: (file: File) => void;
	onError: (message: string) => void;
	label?: string;
}

/**
 * ImageUploadZone — single-image upload for the photo form.
 */
export const ImageUploadZone = ({
	file,
	existingImageUrl,
	onChange,
	onError,
	label = 'Photo',
}: ImageUploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const previewUrl = file ? URL.createObjectURL(file) : (existingImageUrl ?? null);

	useEffect(() => {
		if (!file) return;

		// Clean up the generated Object URL when `file` changes or on unmount
		return () => {
			URL.revokeObjectURL(previewUrl!);
		};
	}, [file, previewUrl]);

	const handleFile = (candidate: File) => {
		const err = validateImageFile(candidate);
		if (err) {
			onError(err);
			return;
		}
		onChange(candidate);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const dropped = e.dataTransfer.files[0];
		if (dropped) handleFile(dropped);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		if (picked) handleFile(picked);
		e.target.value = '';
	};

	return (
		<div className="flex flex-col gap-2">
			{/* Label row */}
			<label className="block text-sm font-medium text-text-secondary">
				{label}
				<span className="text-red-500 ml-0.5">*</span>
			</label>

			{/* Single tile — same square proportion as the multi-zone grid cells */}
			<div className="grid grid-cols-4 gap-2">
				{previewUrl ? (
					/* Filled tile */
					<div className="relative aspect-square rounded-xl overflow-hidden bg-bg-page ring-1 ring-gray-200 group">
						<img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
						{/* Replace button (×) — top-right, always visible on hover */}
						<button
							type="button"
							aria-label="Remove image"
							onClick={() => inputRef.current?.click()}
							className={cn(
								'absolute top-2 right-2 flex items-center justify-center z-10',
								'w-6 h-6 rounded-full bg-black/60 text-white cursor-pointer',
								'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
							)}
						>
							<i className="fa-solid fa-xmark" />
						</button>

						{/* Drop-to-replace overlay */}
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
							className="absolute inset-0"
							aria-hidden="true"
						/>
					</div>
				) : (
					/* Empty placeholder tile — "+" to add */
					<button
						type="button"
						aria-label={`Upload ${label.toLowerCase()}`}
						onClick={() => inputRef.current?.click()}
						onDragOver={(e) => e.preventDefault()}
						onDrop={() => handleDrop}
						className={cn(
							'aspect-square rounded-xl border-2 border-dashed border-border-strong bg-surface-secondary',
							'flex items-center justify-center cursor-pointer select-none',
							'text-text-muted hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500',
							'transition-colors'
						)}
					>
						<i className="fa-solid fa-plus text-xl" />
					</button>
				)}
			</div>

			<p className="text-xs text-text-muted">JPEG, PNG, GIF - max 5 MB</p>

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED_EXT.join(',')}
				className="sr-only"
				onChange={handleInputChange}
			/>
		</div>
	);
};
