import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfileInfoForm } from '../hooks/useProfileInfoForm.ts';
import { usePasswordChangeForm } from '../hooks/usePasswordChangeForm.ts';
import { EditProfileFields } from '../components/EditProfileFields.tsx';
import { PasswordChangeFields } from '../components/PasswordChangeFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';

/**
 * EditProfile — /my-profile/edit
 */
export const EditProfile = () => {
	const navigate = useNavigate();
	const { currentUser } = useAuth();

	const [infoToast, setInfoToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
		null
	);
	const [passwordToast, setPasswordToast] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);

	// currentUser is guaranteed by RequireAuth, but guard below keeps hooks safe.
	const profileForm = useProfileInfoForm(currentUser!);
	const passwordForm = usePasswordChangeForm();

	if (!currentUser) {
		return null;
	}

	const onSubmitInfo = async (e: React.SubmitEvent) => {
		const result = await profileForm.handleSubmit(e);
		if (result) {
			setInfoToast({ message: 'Profile updated.', type: 'success' });
		} else {
			setInfoToast({ message: 'Failed to update profile. Please try again.', type: 'error' });
		}
	};

	const onSubmitPassword = async (e: React.SubmitEvent) => {
		const result = await passwordForm.handleSubmit(e);
		// On success, usePasswordChangeForm redirects to /login
		if (!result) {
			setPasswordToast({
				message: passwordForm.submitError ?? 'Failed to change password. Please try again.',
				type: 'error',
			});
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
			{/* Page header */}
			<div className="flex items-center gap-3">
				<button
					aria-label="Go back"
					onClick={() => navigate(-1)}
					className="p-2 rounded-lg text-text-secondary cursor-pointer hover:bg-bg-page hover:text-text-secondary transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-text-primary">Edit profile</h1>
					<p className="text-sm text-text-secondary mt-0.5">Update your personal information</p>
				</div>
			</div>

			{/* Basic info form */}
			<form onSubmit={onSubmitInfo} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<h2 className="text-xl font-semibold text-text-primary mb-4">Basic information</h2>
					<EditProfileFields
						values={profileForm.values}
						errors={profileForm.errors}
						existingAvatarUrl={currentUser.avatarUrl}
						onChange={profileForm.handleChange}
						onAvatarError={profileForm.handleAvatarError}
					/>
				</div>
				<div className="flex justify-end mt-4">
					<Button type="submit" variant="primary" disabled={profileForm.submitting}>
						{profileForm.submitting && <i className="fa-solid fa-spinner fa-spin" />}
						{profileForm.submitting ? 'Saving…' : 'Save changes'}
					</Button>
				</div>
			</form>

			{/* Password form */}
			<form onSubmit={onSubmitPassword} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<h2 className="text-xl font-semibold text-text-primary mb-4">Change password</h2>
					<PasswordChangeFields
						values={passwordForm.values}
						errors={passwordForm.errors}
						onChange={passwordForm.handleChange}
					/>
				</div>
				<div className="flex justify-end mt-4">
					<Button type="submit" variant="primary" disabled={passwordForm.submitting}>
						{passwordForm.submitting && <i className="fa-solid fa-spinner fa-spin" />}
						{passwordForm.submitting ? 'Updating…' : 'Update password'}
					</Button>
				</div>
			</form>

			{infoToast && (
				<Toast
					message={infoToast.message}
					type={infoToast.type}
					onDismiss={() => setInfoToast(null)}
				/>
			)}
			{passwordToast && (
				<Toast
					message={passwordToast.message}
					type={passwordToast.type}
					onDismiss={() => setPasswordToast(null)}
				/>
			)}
		</div>
	);
};
