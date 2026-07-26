import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfileInfoForm } from '../hooks/useProfileInfoForm.ts';
import { usePasswordChangeForm } from '../hooks/usePasswordChangeForm.ts';
import { useAdminPasswordForm } from '../hooks/useAdminPasswordForm.ts';
import { adminService } from '../service/adminService.ts';
import { EditProfileFields } from '../components/profile/EditProfileFields.tsx';
import { PasswordChangeFields } from '../components/PasswordChangeFields.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
import type { User } from '../types/index.ts';

/**
 * EditProfile — two modes sharing one page:
 *  - Self mode:  /my-profile/edit        — currentUser edits their own info + password.
 *  - Admin mode: /admin/users/:id/edit   — an admin edits another user's basic info only
 */
export const EditProfile = () => {
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const { id } = useParams<{ id: string }>();
	const isAdminMode = id !== undefined;
	const targetUserId = isAdminMode ? Number(id) : undefined;

	const [targetUser, setTargetUser] = useState<User | null>(null);
	const [targetLoading, setTargetLoading] = useState(isAdminMode);
	const [targetError, setTargetError] = useState<string | null>(null);
	// Track the ID to reset loading/error state during render
	const [prevTargetUserId, setPrevTargetUserId] = useState(targetUserId);

	if (targetUserId !== prevTargetUserId) {
		setPrevTargetUserId(targetUserId);
		setTargetUser(null);
		setTargetLoading(isAdminMode);
		setTargetError(null);
	}

	useEffect(() => {
		if (!isAdminMode || targetUserId === undefined || Number.isNaN(targetUserId)) return;
		let active = true;

		adminService
			.getUserById(targetUserId)
			.then((user) => {
				if (active) setTargetUser(user);
			})
			.catch((err: unknown) => {
				if (!active) return;
				setTargetUser(null);
				setTargetError(err instanceof Error ? err.message : 'Could not load this user.');
			})
			.finally(() => {
				if (active) setTargetLoading(false);
			});

		return () => {
			active = false;
		};
	}, [isAdminMode, targetUserId]);

	const editUser = isAdminMode ? targetUser : currentUser;

	const [infoToast, setInfoToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
		null
	);
	const [passwordToast, setPasswordToast] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);
	const [adminPasswordToast, setAdminPasswordToast] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);

	const profileForm = useProfileInfoForm(
		editUser,
		isAdminMode ? { adminTargetId: targetUserId } : {}
	);
	// Two DIFFERENT password flows, both called unconditionally (Rules of
	// Hooks) — only one is ever rendered, based on isAdminMode:
	//  - usePasswordChangeForm: self mode. Requires currentPassword, logs the
	//    caller out afterward (changing your own credential invalidates your
	//    own session).
	//  - useAdminPasswordForm: admin mode. No currentPassword — the admin is
	//    overriding, not proving they know the old one. Doesn't touch the
	//    admin's own session; only the TARGET user's sessions are revoked
	//    server-side.
	const passwordForm = usePasswordChangeForm();
	const adminPasswordForm = useAdminPasswordForm(targetUserId ?? -1);

	if (!isAdminMode && !currentUser) {
		return null;
	}

	if (isAdminMode && targetLoading) {
		return <div className="text-center py-20 text-text-muted">Loading user...</div>;
	}

	if (isAdminMode && (targetError || !targetUser)) {
		return (
			<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
				<i className="fa-solid fa-user-slash text-4xl text-gray-300" />
				<p className="text-text-secondary">{targetError ?? 'User not found.'}</p>
				<Button variant="ghost" onClick={() => navigate(APP_ROUTE.ADMIN_USERS)}>
					Back to Manage Users
				</Button>
			</div>
		);
	}

	const onSubmitInfo = async (e: React.SubmitEvent) => {
		const result = await profileForm.handleSubmit(e);
		if (result) {
			setInfoToast({ message: 'Profile updated.', type: 'success' });
			if (isAdminMode) {
				setTargetUser(result);
				setTimeout(() => navigate(APP_ROUTE.ADMIN_USERS), 1000);
			}
		} else {
			setInfoToast({ message: 'Failed to update profile. Please try again.', type: 'error' });
		}
	};

	const onSubmitPassword = async (e: React.SubmitEvent) => {
		const result = await passwordForm.handleSubmit(e);
		if (!result) {
			setPasswordToast({
				message: passwordForm.submitError ?? 'Failed to change password. Please try again.',
				type: 'error',
			});
		}
	};

	const onSubmitAdminPassword = async (e: React.SubmitEvent) => {
		const result = await adminPasswordForm.handleSubmit(e);
		if (result) {
			setAdminPasswordToast({
				message: 'Password updated. The user will need to log in again.',
				type: 'success',
			});
		} else {
			setAdminPasswordToast({
				message: adminPasswordForm.submitError ?? 'Failed to update password. Please try again.',
				type: 'error',
			});
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
			<div className="flex items-center gap-3">
				<button
					aria-label="Go back"
					onClick={() => (isAdminMode ? navigate(APP_ROUTE.ADMIN_USERS) : navigate(-1))}
					className="p-2 rounded-lg text-text-secondary cursor-pointer hover:bg-bg-page hover:text-text-secondary transition-colors"
				>
					<i className="fa-solid fa-arrow-left" />
				</button>
				<div>
					<h1 className="text-xl font-semibold text-text-primary">
						{isAdminMode ? `Edit ${targetUser!.firstName} ${targetUser!.lastName}` : 'Edit profile'}
					</h1>
					<p className="text-sm text-text-secondary mt-0.5">
						{isAdminMode
							? "Update this user's personal information"
							: 'Update your personal information'}
					</p>
				</div>
			</div>

			<form onSubmit={onSubmitInfo} noValidate>
				<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
					<h2 className="text-xl font-semibold text-text-primary mb-4">Basic information</h2>
					<EditProfileFields
						values={profileForm.values}
						errors={profileForm.errors}
						existingAvatarUrl={editUser?.avatarUrl}
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

			{/* Self mode: standard change-password flow */}
			{!isAdminMode && (
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
			)}

			{/* Admin mode: set a new password directly. */}
			{isAdminMode && (
				<form onSubmit={onSubmitAdminPassword} noValidate>
					<div className="bg-surface rounded-xl border border-border shadow-sm p-6">
						<h2 className="text-xl font-semibold text-text-primary mb-1">Set new password</h2>
						<p className="text-sm text-text-secondary mb-4">
							This user will be signed out everywhere and must log in again with the new password.
						</p>
						<div className="flex flex-col gap-4">
							<div>
								<label
									htmlFor="admin-newPassword"
									className="block text-sm font-medium text-text-secondary mb-1"
								>
									New password <span className="text-red-500">*</span>
								</label>
								<input
									id="admin-newPassword"
									type="password"
									autoComplete="new-password"
									value={adminPasswordForm.values.newPassword}
									onChange={(e) => adminPasswordForm.handleChange({ newPassword: e.target.value })}
									className="w-full rounded-lg bg-input-bg border border-input-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:border-blue-600 focus:ring-blue-600"
								/>
								{adminPasswordForm.errors.newPassword && (
									<p className="mt-1 text-xs text-red-600">
										{adminPasswordForm.errors.newPassword}
									</p>
								)}
							</div>
							<div>
								<label
									htmlFor="admin-confirmNewPassword"
									className="block text-sm font-medium text-text-secondary mb-1"
								>
									Confirm new password <span className="text-red-500">*</span>
								</label>
								<input
									id="admin-confirmNewPassword"
									type="password"
									autoComplete="new-password"
									value={adminPasswordForm.values.confirmNewPassword}
									onChange={(e) =>
										adminPasswordForm.handleChange({ confirmNewPassword: e.target.value })
									}
									className="w-full rounded-lg bg-input-bg border border-input-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:border-blue-600 focus:ring-blue-600"
								/>
								{adminPasswordForm.errors.confirmNewPassword && (
									<p className="mt-1 text-xs text-red-600">
										{adminPasswordForm.errors.confirmNewPassword}
									</p>
								)}
							</div>
						</div>
					</div>
					<div className="flex justify-end mt-4">
						<Button type="submit" variant="primary" disabled={adminPasswordForm.submitting}>
							{adminPasswordForm.submitting && <i className="fa-solid fa-spinner fa-spin" />}
							{adminPasswordForm.submitting ? 'Updating…' : 'Set password'}
						</Button>
					</div>
				</form>
			)}

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
			{adminPasswordToast && (
				<Toast
					message={adminPasswordToast.message}
					type={adminPasswordToast.type}
					onDismiss={() => setAdminPasswordToast(null)}
				/>
			)}
		</div>
	);
};
