import { cn } from '../utils/cn.ts';
import { ImageUploadZone } from './ImageUploadZone.tsx';
import type { SharingMode } from '../types/index.ts';
import { MultiImageUploadZone } from './MultiImageUploadZone.tsx';

export interface MediaFormState {
	title: string;
	description: string;
	sharingMode: SharingMode;
	file: File | null; // photos
	files: File[]; // albums
}

export interface MediaFormErrors {
	title?: string;
	description?: string;
	sharingMode?: string;
	file?: string;
}

interface MediaFormFieldsProps {
	mode?: 'photo' | 'album';
	values: MediaFormState;
	errors: MediaFormErrors;
	existingTitle?: string;
	existingDesc?: string;
	existingImageUrl?: string; // photos
	existingImageUrls?: string[]; // albums
	imageLabel?: string;
	onChange: (patch: Partial<MediaFormState>) => void;
	onFileError: (message: string) => void;
}

const TITLE_MAX = 140;
const DESC_MAX = 300;

/**
 * MediaFormFields — shared controlled fields for Photo and Album create/edit forms.
 * The parent page owns state and submission; this component is purely presentational.
 */
export const MediaFormFields = ({
	mode = 'photo',
	values,
	errors,
	existingTitle = '',
	existingDesc = '',
	existingImageUrl,
	existingImageUrls,
	imageLabel = 'Photo',
	onChange,
	onFileError,
}: MediaFormFieldsProps) => {
	return (
		<div className="flex flex-col gap-6">
			{/* Title */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<label htmlFor="media-title" className="block text-sm font-medium text-gray-700">
						Title <span className="text-red-500">*</span>
					</label>
					<span
						className={cn(
							'text-xs tabular-nums',
							values.title.length >= TITLE_MAX ? 'text-red-500 font-medium' : 'text-gray-400'
						)}
					>
						{values.title.length}/{TITLE_MAX}
					</span>
				</div>
				<input
					id="media-title"
					type="text"
					placeholder="Give your photo a title"
					defaultValue={existingTitle ?? ''}
					maxLength={TITLE_MAX}
					value={values.title}
					onChange={(e) => onChange({ title: e.target.value })}
					className={cn(
						'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
						'focus:outline-none focus:ring-1',
						errors.title
							? 'border-red-400 focus:border-red-500 focus:ring-red-400'
							: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
					)}
				/>
				{errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
			</div>

			{/* Description */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<label htmlFor="media-description" className="block text-sm font-medium text-gray-700">
						Description <span className="text-red-500">*</span>
					</label>
					<span
						className={cn(
							'text-xs tabular-nums',
							values.description.length >= DESC_MAX ? 'text-red-500 font-medium' : 'text-gray-400'
						)}
					>
						{values.description.length}/{DESC_MAX}
					</span>
				</div>
				<textarea
					id="media-description"
					placeholder="Tell the story behind this photo"
					defaultValue={existingDesc}
					maxLength={DESC_MAX}
					rows={4}
					value={values.description}
					onChange={(e) => onChange({ description: e.target.value })}
					className={cn(
						'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none',
						'focus:outline-none focus:ring-1',
						errors.description
							? 'border-red-400 focus:border-red-500 focus:ring-red-400'
							: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
					)}
				/>
				{errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
			</div>

			{/* Sharing mode */}
			<fieldset>
				<legend className="block text-sm font-medium text-gray-700 mb-2">
					Sharing mode <span className="text-red-500">*</span>
				</legend>
				<div className="flex gap-4">
					{(['public', 'private'] as SharingMode[]).map((mode) => (
						<label
							key={mode}
							className={cn(
								'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none',
								'text-sm font-medium transition-colors',
								values.sharingMode === mode
									? 'border-blue-600 bg-blue-50 text-blue-700'
									: 'border-gray-300 text-gray-600 hover:border-gray-400'
							)}
						>
							<input
								type="radio"
								name="sharingMode"
								value={mode}
								checked={values.sharingMode === mode}
								onChange={() => onChange({ sharingMode: mode })}
								className="sr-only"
							/>
							<i
								className={cn(
									'text-sm',
									mode === 'public' ? 'fa-solid fa-earth-americas' : 'fa-solid fa-lock'
								)}
							/>
							{mode.charAt(0).toUpperCase() + mode.slice(1)}
						</label>
					))}
				</div>
				{errors.sharingMode && <p className="mt-1 text-xs text-red-600">{errors.sharingMode}</p>}
			</fieldset>

			{/* Image upload */}
			<div>
				{mode === 'album' ? (
					<MultiImageUploadZone
						files={values.files}
						existingImageUrls={existingImageUrls}
						onChange={(files) => onChange({ files })}
						onError={onFileError}
						label={imageLabel}
					/>
				) : (
					<ImageUploadZone
						file={values.file}
						existingImageUrl={existingImageUrl}
						onChange={(file) => onChange({ file })}
						onError={onFileError}
						label={imageLabel}
					/>
				)}
				{errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
			</div>
		</div>
	);
};
