import { useRef } from 'react';
import { cn } from '../utils/cn.ts';
import { AVATAR_ACCEPTED_EXT, validateAvatarFile } from '../utils/imageValidation.ts';
import { Avatar } from './myUI/Avatar.tsx';

interface AvatarUploadZoneProps {
	file: File | null;
	existingAvatarUrl?: string;
	firstName: string;
	lastName: string;
	onChange: (file: File) => void;
	onError: (message: string) => void;
}

/**
 * AvatarUploadZone — circular single-image upload for the profile avatar.
 * Falls back to initials (via the shared Avatar component) when there's
 * no local file and no existing avatarUrl.
 */
export const AvatarUploadZone = ({
	file,
	existingAvatarUrl,
	firstName,
	lastName,
	onChange,
	onError,
}: AvatarUploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const previewUrl = file ? URL.createObjectURL(file) : existingAvatarUrl;

	const handleFile = (candidate: File) => {
		const err = validateAvatarFile(candidate);
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
		<div className="flex flex-col items-center gap-2">
			<label className="block font-medium text-text-secondary">Avatar</label>

			<div
				role="button"
				tabIndex={0}
				aria-label="Upload avatar"
				className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full group cursor-pointer"
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
				}}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				<Avatar
					firstName={firstName}
					lastName={lastName}
					src={previewUrl}
					size="w-24 h-24 sm:w-32 sm:h-32"
					className="ring-1 ring-gray-200"
				/>

				<div
					className={cn(
						'absolute inset-0 rounded-full flex items-center justify-center',
						'bg-black/0 group-hover:bg-black/40 transition-colors'
					)}
				>
					<i className="fa-solid fa-camera text-white opacity-0 group-hover:opacity-100 transition-opacity" />
				</div>
			</div>

			<p className="text-sm text-text-muted">JPEG or PNG - max 2 MB</p>

			<input
				ref={inputRef}
				type="file"
				accept={AVATAR_ACCEPTED_EXT.join(',')}
				className="sr-only"
				onChange={handleInputChange}
			/>
		</div>
	);
};
