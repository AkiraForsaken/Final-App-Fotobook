import { useState } from 'react';
import { cn } from '../../utils/cn.ts';

interface FormFieldProps {
	id: string;
	label: string;
	type?: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
	autoComplete?: string;
	autoFocus?: boolean;
	maxLength?: number;
	required?: boolean;
}

/**
 * FormField — shared label + input + error message used across Login/Signup
 * (and any other auth-style form). type="password" automatically gets a
 * show/hide toggle; no extra wiring needed from the parent.
 */
export const FormField = ({
	id,
	label,
	type = 'text',
	value,
	onChange,
	error,
	placeholder,
	autoComplete = 'off',
	autoFocus,
	maxLength,
	required = true,
}: FormFieldProps) => {
	const isPassword = type === 'password';
	const [reveal, setReveal] = useState(false);

	return (
		<div>
			<label htmlFor={id} className="block font-medium text-text-secondary mb-1">
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					name={id}
					type={isPassword && reveal ? 'text' : type}
					autoComplete={autoComplete}
					autoFocus={autoFocus}
					required={required}
					placeholder={placeholder}
					maxLength={maxLength}
					value={value}
					onChange={(ev) => onChange(ev.target.value)}
					className={cn(
						'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
						'focus:outline-none focus:ring-1',
						isPassword && 'pr-10',
						error
							? 'border-red-400 focus:border-red-500 focus:ring-red-400'
							: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
					)}
				/>
				{isPassword && (
					<button
						type="button"
						tabIndex={-1}
						onClick={() => setReveal((prev) => !prev)}
						aria-label={reveal ? 'Hide password' : 'Show password'}
						className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary cursor-pointer"
					>
						<i className={reveal ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
					</button>
				)}
			</div>
			{error && <p className="mt-1 text-red-600">{error}</p>}
		</div>
	);
};
