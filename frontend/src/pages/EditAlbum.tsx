import { useCallback, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfile } from '../hooks/useProfile.ts';
import { useMediaForm } from '../hooks/useMediaForm.ts';
import { contentService } from '../service/contentService.ts';
import { MediaFormFields } from '../components/MediaFormFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';

/**
 * EditAlbum — /albums/:id/edit
 * Protected by RequireAuth in App.tsx.
 * Retrieves the album from the in-memory ownerAlbums list.
 */
export const EditAlbum = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const albumId = id ? parseInt(id, 10) : NaN;

	const { currentUser } = useAuth();
	const { albums, loading, refetch } = useProfile(currentUser?.id ?? null, currentUser ?? null);

	const album = albums.find((a) => a.id === albumId) ?? null;

	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const submitFn = useCallback(
		(payload: Parameters<typeof contentService.updateAlbum>[1]) =>
			contentService.updateAlbum(albumId, payload),
		[albumId]
	);
	const formOptions = useMemo(
		() => ({
			mode: 'album' as const,
			requireFile: false,
			initialValues: album
				? {
						title: album.title,
						description: album.description,
						sharingMode: album.sharingMode,
						file: null,
						files: [],
					}
				: undefined,
		}),
		[album]
	); // Only recreates if the underlying album data actually changes

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
			setTimeout(() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`), 1200);
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
			await contentService.deleteAlbum(albumId, currentUser!.id);
			await refetch();
			navigate('/my-profile?tab=albums');
		} catch {
			setToast({ message: 'Failed to delete album. Please try again.', type: 'error' });
		} finally {
			setDeleting(false);
			setConfirmingDelete(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-32 text-text-muted">Loading album…</div>
		);
	}

	if (!album || isNaN(albumId)) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
				<i className="fa-solid fa-images text-4xl text-gray-300" />
				<p className="text-text-secondary">Album not found.</p>
				<Button variant="ghost" onClick={() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`)}>
					Back to my albums
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
					<h1 className="text-xl font-semibold text-text-primary">Edit album</h1>
					<p className="text-sm text-text-secondary mt-0.5">Update your album's details</p>
				</div>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<MediaFormFields
						mode="album"
						values={values}
						errors={errors}
						// existingTitle={album.title}
						// existingDesc={album.description}
						existingImageUrls={album.imageUrls}
						imageLabel="Album"
						onChange={handleChange}
						onFileError={handleFileError}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between mt-6">
					{/* Delete — two-step confirmation */}
					{confirmingDelete ? (
						<div className="flex items-center gap-2">
							<span className="text-sm text-red-600 font-medium">Delete this album?</span>
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
							Delete album
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
