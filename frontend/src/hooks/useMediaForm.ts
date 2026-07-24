import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaFormState, MediaFormErrors } from '../components/MediaFormFields.tsx';
import type { SharingMode } from '../types/index.ts';

const TITLE_MAX = 140;
const DESC_MAX = 300;

interface UseMediaFormOptions {
	mode?: 'photo' | 'album';
	initialValues?: Partial<MediaFormState>;
	requireFile?: boolean;
}

export interface MediaPayload {
	title: string;
	description: string;
	sharingMode: SharingMode;
}

function validate(
	values: MediaFormState,
	mode: 'photo' | 'album',
	requireFile: boolean
): MediaFormErrors {
	const errors: MediaFormErrors = {};

	if (!values.title.trim()) {
		errors.title = 'Title is required.';
	} else if (values.title.length > TITLE_MAX) {
		errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
	}

	if (!values.description.trim()) {
		errors.description = 'Description is required.';
	} else if (values.description.length > DESC_MAX) {
		errors.description = `Description must be ${DESC_MAX} characters or fewer.`;
	}

	if (!values.sharingMode) {
		errors.sharingMode = 'Please choose a sharing mode.';
	}

	if (requireFile) {
		if (mode === 'album' && values.files.length === 0) {
			errors.file = 'Please add at least one image.';
		} else if (mode === 'photo' && !values.file) {
			errors.file = 'Please select an image.';
		}
	}

	return errors;
}

/**
 * useMediaForm — manages form state and validation for photo / album create & edit pages.
 *
 * @param onSubmit  Called with the validated MediaPayload and the currently
 *                  selected single file (or null) once validation passes.
 *                  Should return the saved resource or throw on failure.
 * @param options   mode, initialValues, requireFile.
 */
export function useMediaForm<T>(
	onSubmit: (payload: MediaPayload, file: File | null) => Promise<T>,
	options: UseMediaFormOptions = {}
) {
	const { mode = 'photo', initialValues, requireFile = true } = options;

	const [values, setValues] = useState<MediaFormState>({
		title: initialValues?.title ?? '',
		description: initialValues?.description ?? '',
		sharingMode: (initialValues?.sharingMode as SharingMode) ?? 'public',
		file: initialValues?.file ?? null,
		files: initialValues?.files ?? [],
	});

	const [errors, setErrors] = useState<MediaFormErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const initialized = useRef<boolean>(false);

	useEffect(() => {
		if (!initialValues || initialized.current) {
			return;
		}

		setValues({
			title: initialValues.title ?? '',
			description: initialValues.description ?? '',
			sharingMode: (initialValues.sharingMode as SharingMode) ?? 'public',
			file: initialValues.file ?? null,
			files: initialValues.files ?? [],
		});
		initialized.current = true;
	}, [initialValues]);

	const handleChange = useCallback((patch: Partial<MediaFormState>) => {
		setValues((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => {
			const next = { ...prev };
			(Object.keys(patch) as (keyof MediaFormState)[]).forEach((k) => {
				// 'files' changes clear the 'file' error key
				const errorKey = k === 'files' ? 'file' : k;
				delete next[errorKey as keyof MediaFormErrors];
			});
			return next;
		});
	}, []);

	const handleFileError = useCallback((message: string) => {
		setErrors((prev) => ({ ...prev, file: message }));
	}, []);

	const handleSubmit = useCallback(
		async (e?: React.SubmitEvent) => {
			e?.preventDefault();

			const validationErrors = validate(values, mode, requireFile);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return null;
			}

			setSubmitting(true);
			setSubmitError(null);
			setSubmitSuccess(false);

			try {
				const payload: MediaPayload = {
					title: values.title.trim(),
					description: values.description.trim(),
					sharingMode: values.sharingMode,
				};

				// Only "photo" mode ever sends a single file through this hook.
				// Album creation happens empty; attaching photos to an album goes
				// through contentService.addNewPhotoToAlbum directly, not here.
				const result = await onSubmit(payload, values.file);
				setSubmitSuccess(true);
				return result;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Something went wrong.';
				setSubmitError(message);
				return null;
			} finally {
				setSubmitting(false);
			}
		},
		[values, mode, requireFile, onSubmit]
	);

	return {
		values,
		errors,
		submitting,
		submitError,
		submitSuccess,
		handleChange,
		handleFileError,
		handleSubmit,
	};
}
