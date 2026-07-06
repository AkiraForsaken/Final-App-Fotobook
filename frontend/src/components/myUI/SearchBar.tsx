import React, { useRef } from 'react';
import { cn } from '../../utils/cn.ts';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
	onSearch?: (value: string) => void;
}

export const SearchBar = ({ onSearch, className = '', ...props }: SearchBarProps) => {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			onSearch?.(e.target.value);
		}, 500);
	};

	return (
		<div className={cn('relative', className)}>
			<div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
				<i className="fa-solid fa-magnifying-glass text-text-muted text-xs" />
			</div>
			<input
				type="search"
				className="block w-full rounded-md border-0 bg-input-bg py-2 pl-8 pr-4 
        text-sm text-text-primary shadow-xs placeholder:text-input-placeholder
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
				{...props}
				onChange={handleChange}
			/>
		</div>
	);
};
