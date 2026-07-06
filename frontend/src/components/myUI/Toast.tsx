import { useEffect } from 'react';
import { cn } from '../../utils/cn.ts';

export type ToastType = 'success' | 'error';

interface ToastProps {
	message: string;
	type: ToastType;
	onDismiss: () => void;
	duration?: number;
}

/**
 * Toast — fixed bottom-right notification that auto-dismisses.
 * Pair with a piece of state: { message: string; type: ToastType } | null.
 */
export const Toast = ({ message, type, onDismiss, duration = 5000 }: ToastProps) => {
	useEffect(() => {
		const timer = setTimeout(onDismiss, duration);
		return () => clearTimeout(timer);
	}, [onDismiss, duration]);

	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
				'font-medium text-white max-w-md animate-in fade-in slide-in-from-bottom-2',
				type === 'success' ? 'bg-toast-success-bg' : 'bg-toast-error-bg'
			)}
		>
			<i
				className={cn(
					'text-base shrink-0',
					type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'
				)}
			/>
			<span>{message}</span>
			<button
				aria-label="Dismiss notification"
				onClick={onDismiss}
				className="ml-auto shrink-0 opacity-80 hover:opacity-100 transition-opacity"
			>
				<i className="fa-solid fa-xmark" />
			</button>
		</div>
	);
};
