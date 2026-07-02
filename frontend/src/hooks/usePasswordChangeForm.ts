import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { validatePasswordChange } from '../utils/validation.ts';
import { userService } from '../service/userService.ts';
import { useAuth } from './useAuth.ts';
import type { User } from '../types/index.ts';

export interface PasswordChangeValues {
	currentPassword: string;
	newPassword: string;
	confirmNewPassword: string;
}

export interface PasswordChangeErrors {
	currentPassword?: string;
	newPassword?: string;
	confirmNewPassword?: string;
}

const EMPTY_VALUES: PasswordChangeValues = {
	currentPassword: '',
	newPassword: '',
	confirmNewPassword: '',
};

/**
 * usePasswordChangeForm — manages the "change password" half of Edit Profile.
 * On success, logs the user out and redirects to /login — changing a
 * credential invalidates the current session as a security precaution.
 */
export function usePasswordChangeForm(currentUser: User) {
	const { logout } = useAuth();
	const navigate = useNavigate();

	const [values, setValues] = useState<PasswordChangeValues>(EMPTY_VALUES);
	const [errors, setErrors] = useState<PasswordChangeErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleChange = useCallback((patch: Partial<PasswordChangeValues>) => {
		setValues((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => {
			const next = { ...prev };
			(Object.keys(patch) as (keyof PasswordChangeValues)[]).forEach((k) => {
				delete next[k];
			});
			return next;
		});
	}, []);

	const handleSubmit = useCallback(
		async (e?: React.SubmitEvent): Promise<boolean> => {
			e?.preventDefault();

			const validationErrors = validatePasswordChange(values);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return false;
			}

			setSubmitting(true);
			setSubmitError(null);
			try {
				await userService.changePassword(currentUser.id, {
					currentPassword: values.currentPassword,
					newPassword: values.newPassword,
				});

				setValues(EMPTY_VALUES);
				logout();
				navigate('/login', { replace: true });
				return true;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to change password.';
				setSubmitError(message);
				return false;
			} finally {
				setSubmitting(false);
			}
		},
		[values, currentUser, logout, navigate]
	);

	return { values, errors, submitting, submitError, handleChange, handleSubmit };
}
