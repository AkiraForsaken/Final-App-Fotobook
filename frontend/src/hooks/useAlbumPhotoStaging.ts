import { useCallback, useState } from 'react';
import {
	contentService,
	type MediaPayload,
	type CloudinaryPhotoInput,
} from '../service/contentService.ts';
import { uploadFileToCloudinary } from '../service/cloudinaryUpload.ts';
import type { Photo, Album } from '../types/index.ts';

export const MAX_ALBUM_PHOTOS = 25;

interface NewStagedPhoto {
	kind: 'new';
	key: string;
	file: File;
	previewUrl: string;
}
interface ExistingStagedPhoto {
	kind: 'existing';
	key: string;
	photo: Photo;
}
export type StagedPhoto = NewStagedPhoto | ExistingStagedPhoto;
export type StagedPhotoStatus = 'success' | 'error';
export interface StagedPhotoResult {
	key: string;
	status: StagedPhotoStatus;
	error?: string;
}

let keyCounter = 0;
const nextKey = () => `staged-${++keyCounter}`;

/**
 * useAlbumPhotoStaging — lets the user build up a list of photos (new
 * uploads and/or already-posted existing photos) BEFORE the album exists,
 * then submits them:
 *   1. create the album (if not already created on a previous partial submit)
 *   2. link every staged EXISTING photo one at a time
 *   3. request ONE signed Cloudinary upload for this album
 *   4. upload every staged NEW file directly to Cloudinary
 *   5. persist every successful upload in a SINGLE batch request
 *
 * On partial failure the album is kept (with whatever succeeded) and only
 * the failed items remain staged, so a retry only re-attempts those.
 */
export function useAlbumPhotoStaging() {
	const [staged, setStaged] = useState<StagedPhoto[]>([]);
	const [results, setResults] = useState<StagedPhotoResult[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
	const [createdAlbumId, setCreatedAlbumId] = useState<number | null>(null);

	const remainingSlots = MAX_ALBUM_PHOTOS - staged.length;

	const addNewFiles = useCallback((files: File[]) => {
		setStaged((prev) => {
			const room = MAX_ALBUM_PHOTOS - prev.length;
			const toAdd = files.slice(0, room).map<NewStagedPhoto>((file) => ({
				kind: 'new',
				key: nextKey(),
				file,
				previewUrl: URL.createObjectURL(file),
			}));
			return [...prev, ...toAdd];
		});
	}, []);

	const addExistingPhotos = useCallback((photos: Photo[]) => {
		setStaged((prev) => {
			const alreadyStagedIds = new Set(
				prev.filter((p): p is ExistingStagedPhoto => p.kind === 'existing').map((p) => p.photo.id)
			);
			const room = MAX_ALBUM_PHOTOS - prev.length;
			const toAdd = photos
				.filter((p) => !alreadyStagedIds.has(p.id))
				.slice(0, room)
				.map<ExistingStagedPhoto>((photo) => ({ kind: 'existing', key: nextKey(), photo }));
			return [...prev, ...toAdd];
		});
	}, []);

	const removeStaged = useCallback((key: string) => {
		setStaged((prev) => {
			const target = prev.find((p) => p.key === key);
			if (target?.kind === 'new') URL.revokeObjectURL(target.previewUrl);
			return prev.filter((p) => p.key !== key);
		});
		setResults((prev) => prev.filter((r) => r.key !== key));
	}, []);

	const submit = useCallback(
		async (basicInfo: MediaPayload): Promise<{ albumId: number; allSucceeded: boolean }> => {
			setSubmitting(true);
			try {
				let albumId = createdAlbumId;
				if (albumId === null) {
					const album: Album = await contentService.createAlbum(basicInfo);
					albumId = album.id;
					setCreatedAlbumId(albumId);
				}

				const toAttach = staged; // snapshot — retries only see what's still staged
				const existingItems = toAttach.filter(
					(p): p is ExistingStagedPhoto => p.kind === 'existing'
				);
				const newItems = toAttach.filter((p): p is NewStagedPhoto => p.kind === 'new');

				const nextResults: StagedPhotoResult[] = [];
				const stillStaged: StagedPhoto[] = [];
				let done = 0;
				const total = toAttach.length;
				setProgress({ done, total });

				// ── Existing photos: cheap DB links, one at a time ──────────────
				for (const item of existingItems) {
					try {
						await contentService.addExistingPhotoToAlbum(albumId, item.photo.id);
						nextResults.push({ key: item.key, status: 'success' });
					} catch (err) {
						const message = err instanceof Error ? err.message : 'Failed to add this photo.';
						nextResults.push({ key: item.key, status: 'error', error: message });
						stillStaged.push(item);
					}
					setProgress({ done: ++done, total });
				}

				// ── New files: upload straight to Cloudinary  ──────────────
				if (newItems.length > 0) {
					try {
						const signature = await contentService.getAlbumUploadSignature(albumId);

						const successfulUploads: { item: NewStagedPhoto; input: CloudinaryPhotoInput }[] = [];
						const failedNew: { item: NewStagedPhoto; error: string }[] = [];

						await Promise.all(
							newItems.map(async (item) => {
								try {
									const input = await uploadFileToCloudinary(item.file, signature);
									successfulUploads.push({ item, input });
								} catch (err) {
									failedNew.push({
										item,
										error: err instanceof Error ? err.message : 'Upload failed.',
									});
								} finally {
									setProgress({ done: ++done, total });
								}
							})
						);

						failedNew.forEach(({ item, error }) => {
							nextResults.push({ key: item.key, status: 'error', error });
							stillStaged.push(item);
						});

						if (successfulUploads.length > 0) {
							try {
								await contentService.addPhotosToAlbumBatch(
									albumId,
									successfulUploads.map((u) => u.input)
								);
								successfulUploads.forEach(({ item }) =>
									nextResults.push({ key: item.key, status: 'success' })
								);
							} catch (err) {
								// Whole batch rolled back server-side (e.g. album became
								// full) — keep every uploaded-but-unsaved item staged.
								const message =
									err instanceof Error ? err.message : 'Failed to save uploaded photos.';
								successfulUploads.forEach(({ item }) => {
									nextResults.push({ key: item.key, status: 'error', error: message });
									stillStaged.push(item);
								});
							}
						}
					} catch (err) {
						// Couldn't get a signature — every new file stays staged.
						const message = err instanceof Error ? err.message : 'Failed to prepare photo uploads.';
						newItems.forEach((item) => {
							nextResults.push({ key: item.key, status: 'error', error: message });
							stillStaged.push(item);
						});
					}
				}

				setResults(nextResults);
				setStaged(stillStaged);

				return { albumId, allSucceeded: stillStaged.length === 0 };
			} finally {
				setSubmitting(false);
				setProgress(null);
			}
		},
		[staged, createdAlbumId]
	);

	return {
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
	};
}
