import { useCallback, useEffect, useRef, useState } from 'react';
import { validateEditProfile } from '../utils/validation.ts';
import { userService } from '../service/userService.ts';
import { adminService } from '../service/adminService.ts';
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

export interface UseProfileInfoFormOptions {
	/** When set, edits THIS user via the admin endpoint instead of the
	 *  caller's own profile — used by /admin/users/:id/edit. */
	adminTargetId?: number;
}

const EMPTY_VALUES: ProfileInfoValues = {
	firstName: '',
	lastName: '',
	email: '',
	avatarFile: null,
};

/**
 * useProfileInfoForm — manages the "basic info" half of Edit Profile
 * (avatar, first name, last name, email).
 *
 * `user` may be null momentarily in admin mode, since the target user is
 * fetched async (GET /admin/users/:id) rather than being available
 * synchronously like `currentUser` is for self-edit
 */
export function useProfileInfoForm(user: User | null, options: UseProfileInfoFormOptions = {}) {
	const { login } = useAuth();
	const isAdminEdit = options.adminTargetId !== undefined;

	const [values, setValues] = useState<ProfileInfoValues>(
		user
			? { firstName: user.firstName, lastName: user.lastName, email: user.email, avatarFile: null }
			: EMPTY_VALUES
	);
	const [errors, setErrors] = useState<ProfileInfoErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const initialized = useRef(Boolean(user));
	useEffect(() => {
		if (!user || initialized.current) return;
		setValues({
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			avatarFile: null,
		});
		initialized.current = true;
	}, [user]);

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
				const payload = {
					firstName: values.firstName.trim(),
					lastName: values.lastName.trim(),
					email: values.email.trim(),
					avatarFile: values.avatarFile,
				};

				const updatedUser = isAdminEdit
					? await adminService.updateUser(options.adminTargetId!, payload)
					: await userService.updateProfile(payload);

				// Only refresh AuthContext when the caller edited THEMSELVES —
				// an admin editing someone else must never overwrite their own
				// session with the target user's data.
				if (!isAdminEdit) {
					login(updatedUser);
				}
				return updatedUser;
			} catch {
				return null;
			} finally {
				setSubmitting(false);
			}
		},
		[values, isAdminEdit, options.adminTargetId, login]
	);

	return { values, errors, submitting, handleChange, handleAvatarError, handleSubmit };
}
