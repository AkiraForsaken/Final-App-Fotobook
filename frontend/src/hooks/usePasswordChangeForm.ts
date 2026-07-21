import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { validatePasswordChange } from '../utils/validation.ts';
import { userService } from '../service/userService.ts';
import { useAuth } from './useAuth.ts';
import { APP_ROUTE } from '../utils/routes.ts';

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
export function usePasswordChangeForm() {
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
				// currentUser param no longer needed server-side — the backend
				// identifies the user from the session cookie (req.user.id),
				// same as every other /users/current/* call.
				await userService.changePassword({
					currentPassword: values.currentPassword,
					newPassword: values.newPassword,
				});

				setValues(EMPTY_VALUES);
				await logout(); // now async — clears the cookie server-side too
				navigate(APP_ROUTE.LOGIN, { replace: true });
				return true;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to change password.';
				setSubmitError(message);
				return false;
			} finally {
				setSubmitting(false);
			}
		},
		[values, logout, navigate]
	);

	return { values, errors, submitting, submitError, handleChange, handleSubmit };
}
