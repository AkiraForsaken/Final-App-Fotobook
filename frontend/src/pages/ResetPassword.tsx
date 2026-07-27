import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { authService } from '../service/authService.ts';
import { Button } from '../components/myUI/Button.tsx';
import { cn } from '../utils/cn.ts';
import { APP_ROUTE } from '../utils/routes.ts';

const PASSWORD_MAX = 64;

interface ResetPasswordErrors {
	newPassword?: string;
	confirmPassword?: string;
}

/**
 * ResetPassword — /reset-password?token=...
 */
export const ResetPassword = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<ResetPasswordErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();

		const validationErrors: ResetPasswordErrors = {};
		if (!newPassword) validationErrors.newPassword = 'New password is required.';
		else if (newPassword.length > PASSWORD_MAX)
			validationErrors.newPassword = `Password must be ${PASSWORD_MAX} characters or fewer.`;
		if (confirmPassword !== newPassword)
			validationErrors.confirmPassword = 'Passwords do not match.';

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		if (!token) {
			setSubmitError('This reset link is missing a token. Please request a new one.');
			return;
		}

		setErrors({});
		setSubmitError(null);
		setLoading(true);
		try {
			await authService.resetPassword({ token, newPassword });
			setSuccess(true);
			setTimeout(() => navigate(APP_ROUTE.LOGIN, { replace: true }), 1500);
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : 'This reset link is invalid or has expired.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-lg bg-surface rounded-xl shadow-md p-8">
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-nav-active-text tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-text-secondary">Choose a new password</p>
				</div>

				{success ? (
					<div className="text-center space-y-4">
						<i className="fa-solid fa-circle-check text-4xl text-green-600" />
						<p className="text-text-primary">
							Your password has been reset. Redirecting to sign in…
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4" noValidate>
						{submitError && (
							<div className="rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
								<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
								<span>{submitError}</span>
							</div>
						)}

						<div>
							<label
								htmlFor="reset-new-password"
								className="block font-medium text-text-secondary mb-1"
							>
								New password
							</label>
							<input
								id="reset-new-password"
								type="password"
								autoComplete="new-password"
								autoFocus
								required
								maxLength={PASSWORD_MAX}
								placeholder="******"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className={cn(
									'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
									'focus:outline-none focus:ring-1',
									errors.newPassword
										? 'border-red-400 focus:border-red-500 focus:ring-red-400'
										: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
								)}
							/>
							{errors.newPassword && <p className="mt-1 text-red-600">{errors.newPassword}</p>}
						</div>

						<div>
							<label
								htmlFor="reset-confirm-password"
								className="block font-medium text-text-secondary mb-1"
							>
								Confirm new password
							</label>
							<input
								id="reset-confirm-password"
								type="password"
								autoComplete="new-password"
								required
								maxLength={PASSWORD_MAX}
								placeholder="******"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className={cn(
									'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
									'focus:outline-none focus:ring-1',
									errors.confirmPassword
										? 'border-red-400 focus:border-red-500 focus:ring-red-400'
										: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
								)}
							/>
							{errors.confirmPassword && (
								<p className="mt-1 text-red-600">{errors.confirmPassword}</p>
							)}
						</div>

						<Button type="submit" disabled={loading} className="w-full py-3">
							{loading && <i className="fa-solid fa-spinner fa-spin" />}
							{loading ? 'Resetting…' : 'Reset password'}
						</Button>
					</form>
				)}

				<p className="mt-8 text-center text-text-secondary">
					<Link to={APP_ROUTE.LOGIN} className="font-medium text-blue-700 hover:underline">
						Back to sign in
					</Link>
				</p>
			</div>
		</div>
	);
};
