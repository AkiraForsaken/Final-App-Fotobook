import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import type { User } from '../types/index.ts';
import { validateLogin } from '../utils/validation.ts';
import { cn } from '../utils/cn.ts';

export const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
	const navigate = useNavigate();

	const [formData, setFormData] = useState({ email: '', password: '' });
	const [authError, setAuthError] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

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
			const response = await fetch('http://localhost:4000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				setAuthError(data.error || 'An error occurred during login.');
			} else {
				onLogin(data.user);
				navigate('/feeds');
			}
		} catch (error) {
			console.log('/auth/login error: ', error);
			setAuthError('Network error. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	// Reuseable form field
	const field = (
		id: string,
		label: string,
		type: string,
		value: string,
		onChange: (v: string) => void,
		opts?: { placeholder?: string; autoComplete?: string; autoFocus?: boolean }
	) => (
		<div>
			<label htmlFor={id} className="block font-medium text-gray-700 mb-1">
				{label}
			</label>
			<input
				id={id}
				type={type}
				autoComplete={opts?.autoComplete}
				autoFocus={opts?.autoFocus}
				required
				placeholder={opts?.placeholder}
				value={value}
				onChange={(ev) => onChange(ev.target.value)}
				className={cn(
					'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
					'focus:outline-none focus:ring-1',
					errors[id.replace('login-', '')]
						? 'border-red-400 focus:border-red-500 focus:ring-red-400'
						: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
				)}
			/>
			{errors[id.replace('login-', '')] && (
				<p className="mt-1 text-red-600">{errors[id.replace('login-', '')]}</p>
			)}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
			{/* Login Card */}
			<div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-blue-800 tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
				</div>

				{/* Error banner */}
				{authError && (
					<div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
						<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
						<span>{authError}</span>
					</div>
				)}

				{/* Log in form */}
				<form onSubmit={handleSubmit} className="space-y-4">
					{field(
						'login-email',
						'Email',
						'email',
						formData.email,
						(value) => setFormData((prev) => ({ ...prev, email: value })),
						{
							placeholder: 'john@example.com',
							autoComplete: 'email',
							autoFocus: true,
						}
					)}

					{field(
						'login-password',
						'Password',
						'password',
						formData.password,
						(value) => setFormData((prev) => ({ ...prev, password: value })),
						{
							placeholder: '******',
							autoComplete: 'current-password',
						}
					)}

					{/* Forgot password */}
					<div className="text-right">
						<a href="#" className="text-blue-700 hover:underline">
							Forgot password?
						</a>
					</div>

					{/* Submit button */}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-blue-800 py-3 font-semibold text-white hover:bg-blue-700 transition-colors 
            disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{loading && <i className="fa-solid fa-spinner fa-spin" />}
						{loading ? 'Signing in…' : 'Sign in'}
					</button>
				</form>

				{/* Divider */}
				<div className="my-6 flex items-center gap-3">
					<div className="flex-1 border-t border-gray-200" />
					<span className="text-sm text-gray-400">or continue with</span>
					<div className="flex-1 border-t border-gray-200" />
				</div>

				{/* Social login placeholders */}
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

				{/* Sign up link */}
				<p className="mt-8 text-center text-gray-500">
					Don't have an account?{' '}
					<Link to="/signup" className="font-medium text-blue-700 hover:underline">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
};
