import React from 'react';
import { cn } from '../../utils/cn.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-blue-800 text-white hover:bg-blue-700 focus-visible:outline-blue-800',
	secondary:
		'bg-btn-secondary-bg text-btn-secondary-text border border-btn-secondary-border hover:bg-btn-secondary-hover focus-visible:outline-blue-800',
	ghost:
		'bg-transparent text-btn-ghost-text hover:bg-btn-ghost-hover focus-visible:outline-gray-400',
	danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'px-2.5 py-1.5 text-sm rounded',
	md: 'px-4 py-2 text-md rounded-md',
	lg: 'px-5 py-2.5 text-lg rounded-lg',
};

export const Button = ({
	variant = 'primary',
	size = 'md',
	className = '',
	children,
	...props
}: ButtonProps) => {
	return (
		<button
			className={cn(
				'inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer',
				'transition-colors duration-150',
				'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
				'disabled:opacity-50 disabled:cursor-not-allowed',
				variantClasses[variant],
				sizeClasses[size],
				className
			)}
			{...props}
		>
			{children}
		</button>
	);
};
