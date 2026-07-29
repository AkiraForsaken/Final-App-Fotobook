import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import type { User } from '../types/index.ts';
import { validateLogin } from '../utils/validation.ts';
import { Button } from '../components/myUI/Button.tsx';
import { Toast } from '../components/myUI/Toast.tsx';
import { FormField } from '../components/myUI/FormField.tsx';
import { APP_ROUTE } from '../utils/routes.ts';
import { authService } from '../service/authService.ts';

const REDIRECT_TOAST_KEY = 'fotobook.redirectToast';

const consumeRedirectToast = () => {
	if (typeof window === 'undefined') return null;

	const raw = window.sessionStorage.getItem(REDIRECT_TOAST_KEY);
	if (!raw) return null;

	window.sessionStorage.removeItem(REDIRECT_TOAST_KEY);
	try {
		return JSON.parse(raw) as { message: string; type: 'success' | 'error' };
	} catch {
		return null;
	}
};

type LoginLocationState = {
	toast?: {
		message: string;
		type: 'success' | 'error';
	};
};

export const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const [formData, setFormData] = useState({ email: '', password: '' });
	const [authError, setAuthError] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState<LoginLocationState['toast'] | null>(() => {
		return (location.state as LoginLocationState)?.toast ?? consumeRedirectToast() ?? null;
	});

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		const validation = validateLogin(formData);
		if (Object.keys(validation).length) {
			setErrors(validation);
			setAuthError(null);
			return;
		}

		setErrors({});
		setAuthError(null);
		setLoading(true);

		try {
			const data = await authService.login(formData);
			onLogin(data.user);
			navigate(APP_ROUTE.FEEDS);
		} catch (error) {
			console.log('/auth/login error: ', error);
			setAuthError(
				error instanceof Error ? error.message : 'Network error. Please try again later.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4">
			{/* Login Card */}
			<div className="w-full max-w-lg bg-surface rounded-xl shadow-md p-8">
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-nav-active-text tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-text-secondary">Sign in to your account</p>
				</div>

				{/* Toast notification from redirects */}
				{toast && (
					<Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
				)}

				{/* Error banner */}
				{authError && (
					<div className="mb-4 rounded-lg bg-error-bg border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
						<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
						<span>{authError}</span>
					</div>
				)}

				{/* Log in form */}
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					<FormField
						id="login-email"
						label="Email"
						type="email"
						value={formData.email}
						onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
						error={errors.email}
						placeholder="john@example.com"
						autoFocus
					/>

					<FormField
						id="login-password"
						label="Password"
						type="password"
						value={formData.password}
						onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
						error={errors.password}
						placeholder="******"
					/>

					<div className="text-right">
						<Link to={APP_ROUTE.FORGOT_PASSWORD} className="text-blue-700 hover:underline">
							Forgot password?
						</Link>
					</div>

					<Button type="submit" disabled={loading} className="w-full py-3">
						{loading && <i className="fa-solid fa-spinner fa-spin" />}
						{loading ? 'Signing in…' : 'Sign in'}
					</Button>
				</form>

				<div className="my-6 flex items-center gap-3">
					<div className="flex-1 border-t border-border" />
					<span className="text-sm text-text-muted">or continue with</span>
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
					Don't have an account?{' '}
					<Link to={APP_ROUTE.SIGNUP} className="font-medium text-blue-700 hover:underline">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
};
