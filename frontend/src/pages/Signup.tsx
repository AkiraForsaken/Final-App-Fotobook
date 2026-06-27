import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import type { User } from '../types/index.ts';
import { validateSignup } from '../utils/validation.ts';
import { cn } from '../utils/cn.ts';

export const SignupPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
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
			const response = await fetch('http://localhost:4000/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				setAuthError(data.error || 'An error occurred during signup.');
			} else {
				onLogin(data.user);
				navigate('/feeds');
			}
		} catch (error) {
			console.log('/auth/signup error: ', error);
			setAuthError('Network error. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const field = (
		id: string,
		label: string,
		type: string,
		value: string,
		onChange: (v: string) => void,
		opts?: { placeholder?: string; maxLength?: number; autoComplete?: string }
	) => (
		<div>
			<label htmlFor={id} className="block font-medium text-gray-700 mb-1">
				{label}
			</label>
			<input
				id={id}
				type={type}
				autoComplete={opts?.autoComplete}
				required
				placeholder={opts?.placeholder}
				maxLength={opts?.maxLength}
				value={value}
				onChange={(ev) => onChange(ev.target.value)}
				className={cn(
					'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
					'focus:outline-none focus:ring-1',
					errors[id.replace('signup-', '')]
						? 'border-red-400 focus:border-red-500 focus:ring-red-400'
						: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
				)}
			/>
			{errors[id.replace('signup-', '')] && (
				<p className="mt-1 text-red-600">{errors[id.replace('signup-', '')]}</p>
			)}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
			<div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
				{/* Logo */}
				<div className="mb-8 text-center">
					<span className="text-5xl font-bold text-blue-800 tracking-tight">FotoBook</span>
					<p className="mt-1 text-sm text-gray-500">Create your free account</p>
				</div>

				{/* Error banner */}
				{authError && (
					<div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
						<i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
						<span>{authError}</span>
					</div>
				)}

				{/* Sign up form */}
				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					{/* Name row */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="signup-firstName" className="block font-medium text-gray-700 mb-1">
								First name
							</label>
							<input
								id="signup-firstName"
								type="text"
								autoComplete="given-name"
								required
								autoFocus
								placeholder="John"
								maxLength={25}
								value={formData.firstName}
								onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
								className={cn(
									'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
									'focus:outline-none focus:ring-1',
									errors.firstName
										? 'border-red-400 focus:border-red-500 focus:ring-red-400'
										: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
								)}
							/>
							{errors.firstName && <p className="mt-1 text-red-600">{errors.firstName}</p>}
						</div>

						<div>
							<label htmlFor="signup-lastName" className="block font-medium text-gray-700 mb-1">
								Last name
							</label>
							<input
								id="signup-lastName"
								type="text"
								autoComplete="family-name"
								required
								placeholder="Smith"
								maxLength={25}
								value={formData.lastName}
								onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
								className={cn(
									'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
									'focus:outline-none focus:ring-1',
									errors.lastName
										? 'border-red-400 focus:border-red-500 focus:ring-red-400'
										: 'border-gray-300 focus:border-blue-600 focus:ring-blue-600'
								)}
							/>
							{errors.lastName && <p className="mt-1 text-red-600">{errors.lastName}</p>}
						</div>
					</div>

					{/* Email */}
					{field(
						'signup-email',
						'Email',
						'email',
						formData.email,
						(value) => setFormData((prev) => ({ ...prev, email: value })),
						{
							placeholder: 'john@example.com',
							maxLength: 255,
							autoComplete: 'email',
						}
					)}

					{/* Password */}
					{field(
						'signup-password',
						'Password',
						'password',
						formData.password,
						(value) => setFormData((prev) => ({ ...prev, password: value })),
						{
							placeholder: '******',
							maxLength: 64,
							autoComplete: 'new-password',
						}
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-blue-800 py-3 font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
					>
						{loading && <i className="fa-solid fa-spinner fa-spin" />}
						{loading ? 'Creating account…' : 'Create account'}
					</button>
				</form>

				{/* Divider */}
				<div className="my-6 flex items-center gap-3">
					<div className="flex-1 border-t border-gray-200" />
					<span className="text-sm text-gray-400">or register with</span>
					<div className="flex-1 border-t border-gray-200" />
				</div>

				{/* Social placeholders */}
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

				<p className="mt-8 text-center text-gray-500">
					Already have an account?{' '}
					<Link to="/login" className="font-medium text-blue-700 hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};
