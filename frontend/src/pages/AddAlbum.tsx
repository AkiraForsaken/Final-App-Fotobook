import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfile } from '../hooks/useProfile.ts';
import { useMediaForm } from '../hooks/useMediaForm.ts';
import { contentService } from '../service/contentService.ts';
import { MediaFormFields } from '../components/MediaFormFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';

/**
 * AddAlbum — /albums/add
 */
export const AddAlbum = () => {
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const { refetch } = useProfile(currentUser?.id ?? null, currentUser ?? null);

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	const submitFn = useCallback(
		(payload: Parameters<typeof contentService.createAlbum>[0]) =>
			contentService.createAlbum(payload),
		[]
	);

	const { values, errors, submitting, handleChange, handleFileError, handleSubmit } = useMediaForm(
		submitFn,
		currentUser!.id, // non-null assertion (by force - High risk)
		{ mode: 'album', requireFile: true }
	);

	const onSubmit = async (e: React.SubmitEvent) => {
		const result = await handleSubmit(e);
		if (result) {
			setToast({ message: 'Album created successfully.', type: 'success' });
			await refetch();
			setTimeout(() => navigate('/my-profile?tab=albums'), 1200);
		} else {
			setToast({ message: 'Failed to create album. Please try again.', type: 'error' });
		}
	};

	return (
		<div className="w-full mx-auto">
			{/* Page header */}
			<div className="flex items-center gap-3 mb-8">
				<button
					aria-label="Go back"
					onClick={() => navigate(-1)}
					className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-gray-900">Create an album</h1>
					<p className="text-sm text-gray-500 mt-0.5">Group your photos into a collection</p>
				</div>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
					<MediaFormFields
						mode="album"
						values={values}
						errors={errors}
						imageLabel="Album"
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
						{submitting ? 'Creating…' : 'Create album'}
					</Button>
				</div>
			</form>

			{toast && (
				<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
			)}
		</div>
	);
};
