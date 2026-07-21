import { useCallback, useState } from 'react';
import { contentService, type MediaPayload } from '../service/contentService.ts';
import type { Photo, Album } from '../types/index.ts';

// Creation-flow UI cap. Independent of the backend's lifetime MAX_ALBUM_PHOTOS
// (25, matching the requirements doc) — this is just how many you can attach
// in one sitting while creating the album.
export const MAX_ALBUM_PHOTOS = 25;

interface NewStagedPhoto {
	kind: 'new';
	key: string; // stable React key
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
 * then submits them: create the album, then attach every staged photo
 * ONE AT A TIME (sequential, not Promise.all — see chat for why: the
 * backend computes each photo's album position inside its own transaction,
 * and concurrent calls could race on that).
 *
 * On partial failure, the album is kept (with whatever succeeded) and only
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
				const nextResults: StagedPhotoResult[] = [];
				const stillStaged: StagedPhoto[] = [];
				setProgress({ done: 0, total: toAttach.length });

				for (let i = 0; i < toAttach.length; i++) {
					const item = toAttach[i];
					try {
						if (item.kind === 'new') {
							await contentService.addNewPhotoToAlbum(albumId, {}, item.file);
						} else {
							await contentService.addExistingPhotoToAlbum(albumId, item.photo.id);
						}
						nextResults.push({ key: item.key, status: 'success' });
					} catch (err) {
						const message = err instanceof Error ? err.message : 'Failed to add this photo.';
						nextResults.push({ key: item.key, status: 'error', error: message });
						stillStaged.push(item); // keep failed items staged so the user can retry
					}
					setProgress({ done: i + 1, total: toAttach.length });
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
		progress, // { done, total } while attaching photos, else null
		remainingSlots,
		createdAlbumId,
		addNewFiles,
		addExistingPhotos,
		removeStaged,
		submit,
	};
}
