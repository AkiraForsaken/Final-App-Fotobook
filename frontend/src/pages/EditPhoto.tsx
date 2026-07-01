import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfile } from '../hooks/useProfile.ts';
import { useMediaForm } from '../hooks/useMediaForm.ts';
import { contentService } from '../service/contentService.ts';
import { MediaFormFields } from '../components/MediaFormFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';

/**
 * EditPhoto — /photos/:id/edit
 * Protected by RequireAuth in App.tsx.
 * Retrieves the photo from the in-memory ownerPhotos list.
 */
export const EditPhoto = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const photoId = id ? parseInt(id, 10) : NaN;

	const { currentUser } = useAuth();
	const { photos, loading, refetch } = useProfile(currentUser?.id ?? null, currentUser ?? null);

	const photo = photos.find((p) => p.id === photoId) ?? null;

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const submitFn = useCallback(
		(payload: Parameters<typeof contentService.updatePhoto>[1]) =>
			contentService.updatePhoto(photoId, payload),
		[photoId]
	);
	const formOptions = useMemo(
		() => ({
			requireFile: false, // existing image is already saved; new upload is optional
			initialValues: photo
				? {
						title: photo.title,
						description: photo.description,
						sharingMode: photo.sharingMode,
						file: null,
					}
				: undefined,
		}),
		[photo]
	);

	const { values, errors, submitting, handleChange, handleFileError, handleSubmit } = useMediaForm(
		submitFn,
		currentUser!.id, // non-null assertion (by force - High risk)
		formOptions
	);

	// ── Submit (save changes) ──────────────────────────────────────────────
	const onSubmit = async (e: React.SubmitEvent) => {
		const result = await handleSubmit(e);
		if (result) {
			setToast({ message: 'Changes saved.', type: 'success' });
			await refetch();
			setTimeout(() => navigate('/my-profile?tab=photos'), 1200);
		} else {
			setToast({ message: 'Failed to save changes. Please try again.', type: 'error' });
		}
	};

	// ── Delete ─────────────────────────────────────────────────────────────
	const handleDelete = async () => {
		if (!confirmingDelete) {
			setConfirmingDelete(true);
			return;
		}
		setDeleting(true);
		try {
			await contentService.deletePhoto(photoId, currentUser!.id);
			await refetch();
			navigate('/my-profile?tab=photos');
		} catch {
			setToast({ message: 'Failed to delete photo. Please try again.', type: 'error' });
		} finally {
			setDeleting(false);
			setConfirmingDelete(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-32 text-text-muted">Loading photo…</div>
		);
	}

	if (!photo || isNaN(photoId)) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
				<i className="fa-solid fa-image-slash text-4xl text-gray-300" />
				<p className="text-text-secondary">Photo not found.</p>
				<Button variant="ghost" onClick={() => navigate('/my-profile?tab=photos')}>
					Back to my photos
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full mx-auto">
			{/* Page header */}
			<div className="flex items-center gap-3 mb-8">
				<button
					aria-label="Go back"
					onClick={() => navigate(-1)}
					className="p-2 rounded-lg text-text-secondary hover:bg-bg-page hover:text-text-secondary transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-text-primary">Edit photo</h1>
					<p className="text-sm text-text-secondary mt-0.5">Update your photo's details</p>
				</div>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<MediaFormFields
						values={values}
						errors={errors}
						// existingTitle={photo.title}
						// existingDesc={photo.description}
						existingImageUrl={photo.imageUrl}
						imageLabel="Photo"
						onChange={handleChange}
						onFileError={handleFileError}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between mt-6">
					{/* Delete — two-step confirmation */}
					{confirmingDelete ? (
						<div className="flex items-center gap-2">
							<span className="text-sm text-red-600 font-medium">Delete this photo?</span>
							<Button
								type="button"
								variant="danger"
								size="sm"
								onClick={handleDelete}
								disabled={deleting}
							>
								{deleting && <i className="fa-solid fa-spinner fa-spin" />}
								{deleting ? 'Deleting…' : 'Yes, delete'}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setConfirmingDelete(false)}
								disabled={deleting}
							>
								Cancel
							</Button>
						</div>
					) : (
						<Button type="button" variant="danger" onClick={handleDelete} disabled={submitting}>
							<i className="fa-solid fa-trash" />
							Delete photo
						</Button>
					)}

					<div className="flex gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={() => navigate(-1)}
							disabled={submitting || deleting}
						>
							Cancel
						</Button>
						<Button type="submit" variant="primary" disabled={submitting || deleting}>
							{submitting && <i className="fa-solid fa-spinner fa-spin" />}
							{submitting ? 'Saving…' : 'Save changes'}
						</Button>
					</div>
				</div>
			</form>

			{toast && (
				<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
			)}
		</div>
	);
};
