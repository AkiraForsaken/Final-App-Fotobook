import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { contentService } from '../service/contentService.ts';
import {
	MediaFormFields,
	type MediaFormState,
	type MediaFormErrors,
} from '../components/MediaFormFields.tsx';
import { ExistingPhotoPicker } from '../components/ExistingPhotoPicker.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
import { MAX_ALBUM_PHOTOS } from '../hooks/useAlbumPhotoStaging.ts';
import type { Album, Photo } from '../types/index.ts';
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

export const EditAlbum = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const albumId = id ? parseInt(id, 10) : NaN;
	const { currentUser } = useAuth();

	const [album, setAlbum] = useState<Album | null>(null);
	const [loading, setLoading] = useState(!isNaN(albumId));
	const [loadError, setLoadError] = useState<string | null>(null);

	const [formValues, setFormValues] = useState<MediaFormState>({
		title: '',
		description: '',
		sharingMode: 'public',
		file: null,
		files: [],
	});
	// Track the ID to reset loading/error state during render
	const [prevRouteAlbumId, setPrevRouteAlbumId] = useState(albumId);
	const [prevAlbumId, setPrevAlbumId] = useState<number | null>(null);

	if (albumId !== prevRouteAlbumId) {
		setPrevRouteAlbumId(albumId);
		setAlbum(null);
		setLoading(!isNaN(albumId));
		setLoadError(null);
	}

	useEffect(() => {
		if (isNaN(albumId)) return;
		let active = true;

		contentService
			.getAlbumById(albumId)
			.then((data) => {
				if (active) setAlbum(data);
			})
			.catch((err: unknown) => {
				if (!active) return;
				setAlbum(null);
				setLoadError(err instanceof Error ? err.message : 'Could not load this album.');
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [albumId]);

	if (album && album.id !== prevAlbumId) {
		setPrevAlbumId(album.id);
		setFormValues({
			title: album.title,
			description: album.description,
			sharingMode: album.sharingMode,
			file: null,
			files: [],
		});
	}

	const canEdit = Boolean(
		currentUser && album && (album.author.id === currentUser.id || currentUser.isAdmin)
	);

	const [errors, setErrors] = useState<MediaFormErrors>({});
	const [savingInfo, setSavingInfo] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [addingPhotos, setAddingPhotos] = useState(false);
	const [addProgress, setAddProgress] = useState<{ done: number; total: number } | null>(null);
	const [removingPhotoId, setRemovingPhotoId] = useState<number | null>(null);

	const remainingSlots = album ? MAX_ALBUM_PHOTOS - album.photoIds.length : 0;

	const onSubmitInfo = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!album) return;
		const validationErrors = validate(formValues);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		setErrors({});
		setSavingInfo(true);
		try {
			const updated = await contentService.updateAlbum(album.id, {
				title: formValues.title.trim(),
				description: formValues.description.trim(),
				sharingMode: formValues.sharingMode,
			});
			setAlbum(updated);
			setToast({ message: 'Changes saved.', type: 'success' });
		} catch {
			setToast({ message: 'Failed to save changes. Please try again.', type: 'error' });
		} finally {
			setSavingInfo(false);
		}
	};

	const handleFilesPicked = useCallback(
		async (fileList: FileList | File[] | null) => {
			if (!fileList || !album) return;
			const files = Array.from(fileList).slice(0, remainingSlots);
			if (files.length === 0) return;

			setAddingPhotos(true);
			setAddProgress({ done: 0, total: files.length });
			let failures = 0;
			for (let i = 0; i < files.length; i++) {
				try {
					const updated = await contentService.addNewPhotoToAlbum(album.id, {}, files[i]);
					setAlbum(updated);
				} catch {
					failures++;
				}
				setAddProgress({ done: i + 1, total: files.length });
			}
			setAddingPhotos(false);
			setAddProgress(null);
			if (failures > 0) {
				setToast({ message: `${failures} photo(s) failed to upload.`, type: 'error' });
			}
		},
		[album, remainingSlots]
	);

	const handleAddExisting = useCallback(
		async (photos: Photo[]) => {
			if (!album) return;
			setPickerOpen(false);
			setAddingPhotos(true);
			setAddProgress({ done: 0, total: photos.length });
			let failures = 0;
			for (let i = 0; i < photos.length; i++) {
				try {
					const updated = await contentService.addExistingPhotoToAlbum(album.id, photos[i].id);
					setAlbum(updated);
				} catch {
					failures++;
				}
				setAddProgress({ done: i + 1, total: photos.length });
			}
			setAddingPhotos(false);
			setAddProgress(null);
			if (failures > 0) {
				setToast({ message: `${failures} photo(s) failed to add.`, type: 'error' });
			}
		},
		[album]
	);

	const handleRemovePhoto = useCallback(
		async (photoId: number) => {
			if (!album) return;
			setRemovingPhotoId(photoId);
			try {
				const updated = await contentService.removePhotoFromAlbum(album.id, photoId);
				setAlbum(updated);
			} catch {
				setToast({ message: 'Failed to remove photo.', type: 'error' });
			} finally {
				setRemovingPhotoId(null);
			}
		},
		[album]
	);

	const handleDelete = async () => {
		if (!album) return;
		if (!confirmingDelete) {
			setConfirmingDelete(true);
			return;
		}
		setDeleting(true);
		try {
			await contentService.deleteAlbum(album.id);
			navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`);
		} catch {
			setToast({ message: 'Failed to delete album.', type: 'error' });
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

	if (isNaN(albumId) || !album || loadError || !canEdit) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
				<i className="fa-solid fa-images text-4xl text-gray-300" />
				<p className="text-text-secondary">
					{loadError ??
						(!canEdit ? "You don't have permission to edit this album." : 'Album not found.')}
				</p>
				<Button variant="ghost" onClick={() => navigate(`${APP_ROUTE.MY_PROFILE}?tab=albums`)}>
					Back to my albums
				</Button>
			</div>
		);
	}

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
					<h1 className="text-xl font-semibold text-text-primary">Edit album</h1>
					<p className="text-sm text-text-secondary mt-0.5">
						Update your album's details and photos
					</p>
				</div>
			</div>

			<form onSubmit={onSubmitInfo} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-4">
					<MediaFormFields
						mode="album"
						values={formValues}
						errors={errors}
						onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
						onFileError={(msg) => setToast({ message: msg, type: 'error' })}
					/>
					{/* Photos Grid */}
					<div className="bg-surface rounded-xl border border-border shadow-sm p-6 mt-6">
						<MultiImageUploadZone
							label="Photos"
							existingImageUrls={album.imageUrls}
							existingPhotoIds={album.photoIds}
							onAddFiles={(files) => void handleFilesPicked(files)}
							onRemoveExisting={handleRemovePhoto}
							removingPhotoId={removingPhotoId}
							onError={(msg) => setToast({ message: msg, type: 'error' })}
							actionSlot={
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={remainingSlots === 0 || addingPhotos}
									onClick={() => setPickerOpen(true)}
								>
									<i className="fa-solid fa-images mr-1" />
									Add existing
								</Button>
							}
						/>

						{addProgress && (
							<p className="mt-3 text-sm text-text-muted text-center">
								Adding photo {addProgress.done} of {addProgress.total}…
							</p>
						)}
					</div>
					<div className="flex justify-end pt-2">
						<Button type="submit" variant="primary" disabled={savingInfo}>
							{savingInfo && <i className="fa-solid fa-spinner fa-spin" />}
							{savingInfo ? 'Saving…' : 'Save details'}
						</Button>
					</div>
				</div>
			</form>

			{/* Danger zone / done */}
			<div className="flex items-center justify-between mt-6">
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
					<Button type="button" variant="danger" onClick={handleDelete}>
						<i className="fa-solid fa-trash mr-1" />
						Delete album
					</Button>
				)}

				<Button type="button" variant="ghost" onClick={() => navigate(-1)}>
					Done
				</Button>
			</div>

			{pickerOpen && currentUser && (
				<ExistingPhotoPicker
					currentUser={currentUser}
					alreadyStagedIds={new Set(album.photoIds)}
					remainingSlots={remainingSlots}
					onConfirm={handleAddExisting}
					onClose={() => setPickerOpen(false)}
				/>
			)}

			{toast && (
				<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
			)}
		</div>
	);
};
