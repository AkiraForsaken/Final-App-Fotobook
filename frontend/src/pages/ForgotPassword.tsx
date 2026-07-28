import { useState } from 'react';
import { Link } from 'react-router';
import { authService } from '../service/authService.ts';
import { Button } from '../components/myUI/Button.tsx';
import { cn } from '../utils/cn.ts';
import { APP_ROUTE } from '../utils/routes.ts';

/**
 * ForgotPassword — /forgot-password
 * Always shows the same confirmation message whether or not the email
 * belongs to an account, matching the backend's anti-enumeration behavior.
 */
export const ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!email.trim()) {
			setError('Please enter your email address.');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			await authService.forgotPassword({ email: email.trim() });
			setSubmitted(true);
		} catch {
			setError('Something went wrong. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-lg bg-surface rounded-xl shadow-md p-8">
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-nav-active-text tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-text-secondary">Reset your password</p>
				</div>

				{submitted ? (
					<div className="text-center space-y-4">
						<i className="fa-solid fa-envelope-circle-check text-4xl text-green-600" />
						<p className="text-text-primary">
							If an account exists for <span className="font-medium">{email.trim()}</span>, we've
							sent a link to reset your password.
						</p>
						<Button variant="ghost">
							<Link to={APP_ROUTE.LOGIN}>Back to sign in</Link>
						</Button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4" noValidate>
						{error && (
							<div className="rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
								<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<div>
							<label htmlFor="forgot-email" className="block font-medium text-text-secondary mb-1">
								Email
							</label>
							<input
								id="forgot-email"
								type="email"
								autoComplete="email"
								autoFocus
								required
								placeholder="john@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={cn(
									'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
									'focus:outline-none focus:ring-1 border-input-border focus:border-blue-600 focus:ring-blue-600'
								)}
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full py-3">
							{loading && <i className="fa-solid fa-spinner fa-spin" />}
							{loading ? 'Sending…' : 'Send reset link'}
						</Button>
					</form>
				)}

				<p className="mt-8 text-center text-text-secondary">
					Remembered your password?{' '}
					<Link to={APP_ROUTE.LOGIN} className="font-medium text-blue-700 hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};
