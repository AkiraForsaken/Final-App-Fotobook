import { useCallback, useState } from 'react';
import { adminService } from '../service/adminService.ts';

export interface AdminPasswordValues {
	newPassword: string;
	confirmNewPassword: string;
}

export interface AdminPasswordErrors {
	newPassword?: string;
	confirmNewPassword?: string;
}

const EMPTY_VALUES: AdminPasswordValues = { newPassword: '', confirmNewPassword: '' };
const MIN_LENGTH = 10;
const MAX_LENGTH = 64;

function validate(values: AdminPasswordValues): AdminPasswordErrors {
	const errors: AdminPasswordErrors = {};

	if (!values.newPassword) {
		errors.newPassword = 'New password is required.';
	} else if (values.newPassword.length < MIN_LENGTH) {
		errors.newPassword = `Password must be at least ${MIN_LENGTH} characters.`;
	} else if (values.newPassword.length > MAX_LENGTH) {
		errors.newPassword = `Password must be ${MAX_LENGTH} characters or fewer.`;
	}

	if (values.confirmNewPassword !== values.newPassword) {
		errors.confirmNewPassword = 'Passwords do not match.';
	}

	return errors;
}

/**
 * useAdminPasswordForm — lets an admin set ANY user's password directly.
 *
 * Deliberately NOT a variant of usePasswordChangeForm:
 *  - No currentPassword field — the admin isn't proving they know the old
 *    password, they're overriding it.
 *  - Does not log anyone out client-side. The backend revokes only the
 *    TARGET user's sessions (adminSetPassword), forcing them to sign in
 *    again — the admin's own session is completely untouched.
 *  - No redirect on success — the admin stays on the edit-user page.
 */
export function useAdminPasswordForm(targetUserId: number) {
	const [values, setValues] = useState<AdminPasswordValues>(EMPTY_VALUES);
	const [errors, setErrors] = useState<AdminPasswordErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleChange = useCallback((patch: Partial<AdminPasswordValues>) => {
		setValues((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => {
			const next = { ...prev };
			(Object.keys(patch) as (keyof AdminPasswordValues)[]).forEach((k) => {
				delete next[k];
			});
			return next;
		});
	}, []);

	const handleSubmit = useCallback(
		async (e?: React.SubmitEvent): Promise<boolean> => {
			e?.preventDefault();

			const validationErrors = validate(values);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return false;
			}

			setSubmitting(true);
			setSubmitError(null);
			try {
				await adminService.setUserPassword(targetUserId, values.newPassword);
				setValues(EMPTY_VALUES);
				return true;
			} catch (err) {
				setSubmitError(err instanceof Error ? err.message : 'Failed to update password.');
				return false;
			} finally {
				setSubmitting(false);
			}
		},
		[values, targetUserId]
	);

	return { values, errors, submitting, submitError, handleChange, handleSubmit };
}
