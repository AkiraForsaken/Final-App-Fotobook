import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { authService } from '../service/authService.ts';
import { Button } from '../components/myUI/Button.tsx';
import { APP_ROUTE } from '../utils/routes.ts';

type VerifyState = 'verifying' | 'success' | 'error';

/**
 * VerifyEmail — /verify-email?token=...
 * Fires the verification call once on mount; no form, just a status view.
 */
export const VerifyEmail = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const [state, setState] = useState<VerifyState>(() => (!token ? 'error' : 'verifying'));
	const [message, setMessage] = useState<string | null>(() =>
		!token ? 'This verification link is missing a token.' : null
	);
	const hasRun = useRef(false);

	useEffect(() => {
		if (!token || hasRun.current) return;
		hasRun.current = true;

		authService
			.verifyEmail({ token })
			.then((res) => {
				setState('success');
				setMessage(res.message);
			})
			.catch((err) => {
				setState('error');
				setMessage(
					err instanceof Error ? err.message : 'This verification link is invalid or has expired.'
				);
			});
	}, [token]);

	return (
		<div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-md bg-surface rounded-xl shadow-md p-8 text-center">
				<span className="text-4xl font-bold text-nav-active-text tracking-tight">FotoBook</span>

				<div className="mt-8 flex flex-col items-center gap-4">
					{state === 'verifying' && (
						<>
							<i className="fa-solid fa-spinner fa-spin text-3xl text-text-secondary" />
							<p className="text-text-secondary">Verifying your email…</p>
						</>
					)}

					{state === 'success' && (
						<>
							<i className="fa-solid fa-circle-check text-4xl text-green-600" />
							<p className="text-text-primary font-medium">
								{message ?? 'Your email has been verified.'}
							</p>
							<Button variant="primary" className="mt-2">
								<Link to={APP_ROUTE.LOGIN}>Go to sign in</Link>
							</Button>
						</>
					)}

					{state === 'error' && (
						<>
							<i className="fa-solid fa-circle-exclamation text-4xl text-red-600" />
							<p className="text-text-primary font-medium">{message}</p>
							<Button variant="ghost" className="mt-2">
								<Link to={APP_ROUTE.LOGIN}>Back to sign in</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
