import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useAlbumPhotoStaging, type StagedPhoto } from '../hooks/useAlbumPhotoStaging.ts';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { ExistingPhotoPicker } from '../components/ExistingPhotoPicker.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
// import { cn } from '../utils/cn.ts';
// import type { SharingMode } from '../types/index.ts';
import {
	MediaFormFields,
	type MediaFormErrors,
	type MediaFormState,
} from '../components/MediaFormFields.tsx';
import { MultiImageUploadZone } from '../components/MultiImageUploadZone.tsx';

const TITLE_MAX = 140;
const DESC_MAX = 300;

function validate(values: MediaFormState): MediaFormErrors {
	const errors: MediaFormErrors = {};
	if (!values.title.trim()) errors.title = 'Title is required.';
	else if (values.title.length > TITLE_MAX)
		errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;

	if (!values.description.trim()) errors.description = 'Description is required.';
	else if (values.description.length > DESC_MAX)
		errors.description = `Description must be ${DESC_MAX} characters or fewer.`;

	return errors;
}

/**
 * AddAlbum — /albums/add
 *
 * Lets the user attach up to MAX_ALBUM_PHOTOS photos — newly uploaded
 * and/or already-posted standalone photos — directly during creation instead
 * of only afterward. Flow: fill basic info + stage photos -> submit creates
 * the album, then attaches every staged photo one at a time. On partial
 * failure the album is kept and only the failed photos remain staged, so
 * "Retry failed photos" only re-attempts those.
 */
export const AddAlbum = () => {
	const navigate = useNavigate();
	const { currentUser } = useAuth();

	const [formValues, setFormValues] = useState<MediaFormState>({
		title: '',
		description: '',
		sharingMode: 'public',
		file: null,
		files: [],
	});

	const [errors, setErrors] = useState<MediaFormErrors>({});
	const [pickerOpen, setPickerOpen] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	const {
		staged,
		results,
		submitting,
		progress,
		remainingSlots,
		createdAlbumId,
		addNewFiles,
		addExistingPhotos,
		removeStaged,
		submit,
	} = useAlbumPhotoStaging();

	const stagedExistingIds = useMemo(
		() =>
			new Set(
				staged
					.filter((s): s is Extract<StagedPhoto, { kind: 'existing' }> => s.kind === 'existing')
					.map((s) => s.photo.id)
			),
		[staged]
	);

	const onSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();

		if (createdAlbumId === null) {
			const validationErrors = validate(formValues);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}
			setErrors({});
		}

		const { allSucceeded } = await submit({
			title: formValues.title.trim(),
			description: formValues.description.trim(),
			sharingMode: formValues.sharingMode,
		});

		if (allSucceeded) {
			setToast({ message: 'Album created successfully.', type: 'success' });
			setTimeout(() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`), 1200);
		} else {
			setToast({
				message: 'Album created, but some photos failed to attach. You can retry below.',
				type: 'error',
			});
		}
	};

	const finishAnyway = () => navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`);

	if (!currentUser) return null;

	return (
		<div className="w-full mx-auto">
			<div className="flex items-center gap-3 mb-8">
				<button
					aria-label="Go back"
					onClick={() => navigate(-1)}
					className="p-2 rounded-lg text-text-secondary cursor-pointer hover:bg-bg-page hover:text-text-secondary transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-text-primary">Create an album</h1>
					<p className="text-sm text-text-secondary mt-0.5">
						Add a title, description, and up to {staged.length + remainingSlots} photos
					</p>
				</div>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-6">
					<MediaFormFields
						mode="album"
						values={formValues}
						errors={errors}
						onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
						onFileError={(msg) => setToast({ message: msg, type: 'error' })}
					/>

					{/* Custom staging UI integrated cleanly */}
					<MultiImageUploadZone
						staged={staged}
						results={results}
						onAddFiles={addNewFiles}
						onRemoveStaged={removeStaged}
						onError={(msg) => setToast({ message: msg, type: 'error' })}
						label="Album Photos"
						actionSlot={
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={remainingSlots === 0}
								onClick={() => setPickerOpen(true)}
							>
								<i className="fa-solid fa-images mr-1" />
								Add existing
							</Button>
						}
					/>

					{progress && (
						<p className="text-sm text-text-muted text-center">
							Adding photo {progress.done} of {progress.total}…
						</p>
					)}
				</div>

				<div className="flex justify-end gap-3 mt-6">
					{createdAlbumId !== null && staged.length > 0 && (
						<Button type="button" variant="ghost" onClick={finishAnyway} disabled={submitting}>
							Finish without these
						</Button>
					)}
					<Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={submitting}>
						{submitting && <i className="fa-solid fa-spinner fa-spin" />}
						{submitting
							? 'Saving…'
							: createdAlbumId !== null
								? 'Retry failed photos'
								: 'Create album'}
					</Button>
				</div>
			</form>

			{pickerOpen && (
				<ExistingPhotoPicker
					currentUser={currentUser}
					alreadyStagedIds={stagedExistingIds}
					remainingSlots={remainingSlots}
					onConfirm={(photos) => {
						addExistingPhotos(photos);
						setPickerOpen(false);
					}}
					onClose={() => setPickerOpen(false)}
				/>
			)}

			{toast && (
				<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
			)}
		</div>
	);
};
