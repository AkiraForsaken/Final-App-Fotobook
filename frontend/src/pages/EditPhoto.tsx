import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useMediaForm } from '../hooks/useMediaForm.ts';
import { contentService } from '../service/contentService.ts';
import { MediaFormFields } from '../components/MediaFormFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
import type { Photo } from '../types/index.ts';

/**
 * EditPhoto — /photos/:id/edit
 * Protected by RequireAuth in App.tsx.
 * NEW: Loads the photo directly by id (GET /api/photos/:id)
 */
export const EditPhoto = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const photoId = id ? parseInt(id, 10) : NaN;
	const { currentUser } = useAuth();

	const [photo, setPhoto] = useState<Photo | null>(null);
	const [loading, setLoading] = useState(!isNaN(photoId));
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		if (isNaN(photoId)) {
			return;
		}
		let active = true;
		const fetchPhoto = async () => {
			// Wrap in async function to keep logic clean and avoid synchronous render warnings
			setLoading(true);
			setLoadError(null);

			try {
				const data = await contentService.getPhotoById(photoId);
				if (active) setPhoto(data);
			} catch (err: unknown) {
				if (!active) return;
				setPhoto(null);
				setLoadError(err instanceof Error ? err.message : 'Could not load this photo.');
			} finally {
				if (active) setLoading(false);
			}
		};

		void fetchPhoto();
		return () => {
			active = false;
		};
	}, [photoId]);

	// Owner can edit their own photo; admin can edit anyone
	const canEdit = Boolean(
		currentUser && photo && (photo.author.id === currentUser.id || currentUser.isAdmin)
	);

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const submitFn = useCallback(
		(payload: Parameters<typeof contentService.updatePhoto>[1], file: File | null) =>
			contentService.updatePhoto(photoId, payload, file),
		[photoId]
	);

	const formOptions = useMemo(
		() => ({
			requireFile: false, // existing image is already saved; a new upload is optional
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
		formOptions
	);

	// ── Submit (save changes) ──────────────────────────────────────────────
	const onSubmit = async (e: React.SubmitEvent) => {
		const result = await handleSubmit(e);
		if (result) {
			setToast({ message: 'Changes saved.', type: 'success' });
			setTimeout(() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=photos`), 1200);
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
			await contentService.deletePhoto(photoId);
			navigate(`${APP_ROUTE.MY_PROFILE}?tab=photos`);
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

	if (isNaN(photoId) || !photo || loadError || !canEdit) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
				<i className="fa-solid fa-image-slash text-4xl text-gray-300" />
				<p className="text-text-secondary">
					{loadError ??
						(!canEdit && photo
							? "You don't have permission to edit this photo."
							: 'Photo not found.')}
				</p>
				<Button variant="ghost" onClick={() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=photos`)}>
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
					className="p-2 rounded-lg text-text-secondary cursor-pointer hover:bg-bg-page hover:text-text-secondary transition-colors"
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
