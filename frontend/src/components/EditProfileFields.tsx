import { cn } from '../utils/cn.ts';
import { AvatarUploadZone } from './AvatarUploadZone.tsx';
import type { ProfileInfoValues, ProfileInfoErrors } from '../hooks/useProfileInfoForm.ts';

interface EditProfileFieldsProps {
	values: ProfileInfoValues;
	errors: ProfileInfoErrors;
	existingAvatarUrl?: string;
	onChange: (patch: Partial<ProfileInfoValues>) => void;
	onAvatarError: (message: string) => void;
}

const FIRST_LAST_MAX = 25;
const EMAIL_MAX = 255;

/**
 * EditProfileFields — shared controlled fields for the Basic Info form.
 */
export const EditProfileFields = ({
	values,
	errors,
	existingAvatarUrl,
	onChange,
	onAvatarError,
}: EditProfileFieldsProps) => {
	return (
		<div className="flex flex-col gap-6">
			<div className="self-center">
				<AvatarUploadZone
					file={values.avatarFile}
					existingAvatarUrl={existingAvatarUrl}
					firstName={values.firstName}
					lastName={values.lastName}
					onChange={(avatarFile) => onChange({ avatarFile })}
					onError={onAvatarError}
				/>
				{errors.avatar && <p className="mt-1 text-xs text-red-600">{errors.avatar}</p>}
			</div>

			{/* First / Last name */}
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label
						htmlFor="edit-firstName"
						className="block text-sm font-medium text-text-secondary mb-1"
					>
						First name <span className="text-red-500">*</span>
					</label>
					<input
						id="edit-firstName"
						type="text"
						placeholder="John"
						maxLength={FIRST_LAST_MAX}
						value={values.firstName}
						onChange={(e) => onChange({ firstName: e.target.value })}
						className={cn(
							'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
							'focus:outline-none focus:ring-1',
							errors.firstName
								? 'border-input-border-error focus:border-red-500 focus:ring-red-400'
								: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
						)}
					/>
					{errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
				</div>

				<div>
					<label
						htmlFor="edit-lastName"
						className="block text-sm font-medium text-text-secondary mb-1"
					>
						Last name <span className="text-red-500">*</span>
					</label>
					<input
						id="edit-lastName"
						type="text"
						placeholder="Smith"
						maxLength={FIRST_LAST_MAX}
						value={values.lastName}
						onChange={(e) => onChange({ lastName: e.target.value })}
						className={cn(
							'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
							'focus:outline-none focus:ring-1',
							errors.lastName
								? 'border-input-border-error focus:border-red-500 focus:ring-red-400'
								: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
						)}
					/>
					{errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
				</div>
			</div>

			{/* Email */}
			<div>
				<label htmlFor="edit-email" className="block text-sm font-medium text-text-secondary mb-1">
					Email <span className="text-red-500">*</span>
				</label>
				<input
					id="edit-email"
					type="email"
					placeholder="john@example.com"
					maxLength={EMAIL_MAX}
					value={values.email}
					onChange={(e) => onChange({ email: e.target.value })}
					className={cn(
						'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
						'focus:outline-none focus:ring-1',
						errors.email
							? 'border-input-border-error focus:border-red-500 focus:ring-red-400'
							: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
					)}
				/>
				{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
			</div>
		</div>
	);
};
