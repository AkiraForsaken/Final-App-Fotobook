import { useCallback, useState } from 'react';
import { validateEditProfile } from '../utils/validation.ts';
import { userService } from '../service/userService.ts';
import { useAuth } from './useAuth.ts';
import type { User } from '../types/index.ts';

export interface ProfileInfoValues {
	firstName: string;
	lastName: string;
	email: string;
	avatarFile: File | null;
}

export interface ProfileInfoErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
	avatar?: string;
}

/**
 * useProfileInfoForm — manages the "basic info" half of Edit Profile
 * (avatar, first name, last name, email). Kept independent from the
 * password form so the two can be validated and saved separately.
 */
export function useProfileInfoForm(currentUser: User) {
	const { login } = useAuth();

	const [values, setValues] = useState<ProfileInfoValues>({
		firstName: currentUser.firstName,
		lastName: currentUser.lastName,
		email: currentUser.email,
		avatarFile: null,
	});
	const [errors, setErrors] = useState<ProfileInfoErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const handleChange = useCallback((patch: Partial<ProfileInfoValues>) => {
		setValues((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => {
			const next = { ...prev };
			(Object.keys(patch) as (keyof ProfileInfoValues)[]).forEach((k) => {
				const errorKey = k === 'avatarFile' ? 'avatar' : k;
				delete next[errorKey as keyof ProfileInfoErrors];
			});
			return next;
		});
	}, []);

	const handleAvatarError = useCallback((message: string) => {
		setErrors((prev) => ({ ...prev, avatar: message }));
	}, []);

	const handleSubmit = useCallback(
		async (e?: React.SubmitEvent): Promise<User | null> => {
			e?.preventDefault();

			const validationErrors = validateEditProfile(values);
			if (Object.keys(validationErrors).length > 0) {
				setErrors((prev) => ({ ...prev, ...validationErrors }));
				return null;
			}

			setSubmitting(true);
			try {
				// User identified server-side from session cookie.
				const updatedUser = await userService.updateProfile({
					firstName: values.firstName.trim(),
					lastName: values.lastName.trim(),
					email: values.email.trim(),
					avatarFile: values.avatarFile,
				});

				login(updatedUser); // refreshes AuthContext + localStorage (TopBar, etc. update immediately)
				return updatedUser;
			} catch {
				return null;
			} finally {
				setSubmitting(false);
			}
		},
		[values, login]
	);

	return { values, errors, submitting, handleChange, handleAvatarError, handleSubmit };
}
