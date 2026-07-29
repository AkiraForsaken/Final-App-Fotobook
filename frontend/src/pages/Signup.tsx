import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import type { User } from '../types/index.ts';
import { validateSignup } from '../utils/validation.ts';
import { Button } from '../components/myUI/Button.tsx';
import { FormField } from '../components/myUI/FormField.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
import { authService } from '../service/authService.ts';

export const Signup = ({ onLogin }: { onLogin: (user: User) => void }) => {
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
	});
	const [authError, setAuthError] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		const validation = validateSignup(formData);
		if (Object.keys(validation).length) {
			setErrors(validation);
			setAuthError(null);
			return;
		}

		setErrors({});
		setAuthError(null);
		setLoading(true);

		try {
			const data = await authService.signup(formData);
			onLogin(data.user);
			navigate(APP_ROUTE.FEEDS);
		} catch (error) {
			console.log('/auth/signup error: ', error);
			setAuthError(
				error instanceof Error ? error.message : 'Network error. Please try again later.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4 py-10">
			<div className="w-full max-w-lg bg-surface rounded-xl shadow-md p-8">
				{/* Logo */}
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-nav-active-text tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-text-secondary">Create your free account</p>
				</div>

				{/* Error banner */}
				{authError && (
					<div className="mb-4 rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
						<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
						<span>{authError}</span>
					</div>
				)}

				{/* Sign up form */}
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					{/* Name row */}
					<div className="grid grid-cols-2 gap-3">
						<FormField
							id="signup-firstName"
							label="First name"
							value={formData.firstName}
							onChange={(value) => setFormData((prev) => ({ ...prev, firstName: value }))}
							error={errors.firstName}
							placeholder="John"
							maxLength={25}
							autoFocus
						/>
						<FormField
							id="signup-lastName"
							label="Last name"
							value={formData.lastName}
							onChange={(value) => setFormData((prev) => ({ ...prev, lastName: value }))}
							error={errors.lastName}
							placeholder="Smith"
							maxLength={25}
						/>
					</div>

					<FormField
						id="signup-email"
						label="Email"
						type="email"
						value={formData.email}
						onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
						error={errors.email}
						placeholder="john@example.com"
						maxLength={255}
					/>

					<FormField
						id="signup-password"
						label="Password"
						type="password"
						value={formData.password}
						onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
						error={errors.password}
						placeholder="******"
						maxLength={64}
						autoComplete="new-password"
					/>

					<Button type="submit" disabled={loading} className="w-full py-3">
						{loading && <i className="fa-solid fa-spinner fa-spin" />}
						{loading ? 'Creating account…' : 'Create account'}
					</Button>
				</form>

				<div className="my-6 flex items-center gap-3">
					<div className="flex-1 border-t border-border" />
					<span className="text-sm text-text-muted">or register with</span>
					<div className="flex-1 border-t border-border" />
				</div>

				<div className="w-full flex items-center justify-around text-5xl space-y-2">
					<button id="google-btn" className="rounded-lg cursor-pointer">
						<i className={'fa-brands fa-google text-red-600'} />
					</button>
					<button id="facebook-btn" className="rounded-lg cursor-pointer">
						<i className={'fa-brands fa-facebook text-blue-600'} />
					</button>
					<button id="twitter-btn" className="rounded-lg cursor-pointer">
						<i className={'fa-brands fa-twitter text-sky-600'} />
					</button>
				</div>

				<p className="mt-8 text-center text-text-secondary">
					Already have an account?{' '}
					<Link to={APP_ROUTE.LOGIN} className="font-medium text-blue-700 hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};
