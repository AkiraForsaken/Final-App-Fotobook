import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMediaForm, type MediaPayload } from '../hooks/useMediaForm.ts';
import { contentService } from '../service/contentService.ts';
import { MediaFormFields } from '../components/MediaFormFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';

/**
 * AddPhotoPage — /photos/add
 */
export const AddPhoto = () => {
	const navigate = useNavigate();

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	const submitFn = useCallback((payload: MediaPayload, file: File | null) => {
		// requireFile: true below guarantees `file` is non-null at run time
		if (!file) throw new Error('Please select an image.');
		return contentService.createPhoto(payload, file);
	}, []);

	const { values, errors, submitting, handleChange, handleFileError, handleSubmit } = useMediaForm(
		submitFn,
		{ mode: 'photo', requireFile: true }
	);

	const onSubmit = async (e: React.SubmitEvent) => {
		const result = await handleSubmit(e);
		if (result) {
			setToast({ message: 'Photo uploaded successfully.', type: 'success' });
			// Brief delay so the user sees the toast before navigating away
			// MyProfile's photo list reloads fresh on its own next mount.
			setTimeout(() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=photos`), 1200);
		} else {
			setToast({ message: 'Failed to upload photo. Please try again.', type: 'error' });
		}
	};

	return (
		<div className="w-full mx-auto">
			{/* Page header */}
			<div className="flex items-center gap-3 mb-8">
				<button
					aria-label="Go back"
					onClick={() => navigate(-1)}
					className="p-2 rounded-lg text-text-secondary cursor-pointer hover:bg-bg-page hover:text-text-secondary transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-text-primary">Add a photo</h1>
					<p className="text-sm text-text-secondary mt-0.5">Share a moment with your followers</p>
				</div>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<MediaFormFields
						values={values}
						errors={errors}
						imageLabel="Photo"
						onChange={handleChange}
						onFileError={handleFileError}
					/>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 mt-6">
					<Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={submitting}>
						{submitting && <i className="fa-solid fa-spinner fa-spin" />}
						{submitting ? 'Uploading…' : 'Save photo'}
					</Button>
				</div>
			</form>

			{toast && (
				<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
			)}
		</div>
	);
};
