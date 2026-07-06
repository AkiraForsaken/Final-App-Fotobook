import { useState } from 'react';
import { cn } from '../utils/cn.ts';
import type { PasswordChangeValues, PasswordChangeErrors } from '../hooks/usePasswordChangeForm.ts';

interface PasswordChangeFieldsProps {
	values: PasswordChangeValues;
	errors: PasswordChangeErrors;
	onChange: (patch: Partial<PasswordChangeValues>) => void;
}

const PASSWORD_MAX = 64;

interface PasswordInputProps {
	id: string;
	label: string;
	value: string;
	error?: string;
	onChange: (v: string) => void;
}
const PasswordInput = ({ id, label, value, error, onChange }: PasswordInputProps) => {
	const [locked, setLocked] = useState(true);

	return (
		<div>
			<label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
				{label} <span className="text-red-500">*</span>
			</label>
			<input
				id={id}
				name={id}
				type="password"
				placeholder="******"
				maxLength={PASSWORD_MAX}
				autoComplete="new-password"
				readOnly={locked}
				onFocus={() => setLocked(false)}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(
					'w-full rounded-lg bg-input-bg border px-3 py-2 text-sm text-text-primary placeholder:text-input-placeholder',
					'focus:outline-none focus:ring-1',
					error
						? 'border-input-border-error focus:border-red-500 focus:ring-red-400'
						: 'border-input-border focus:border-blue-600 focus:ring-blue-600'
				)}
			/>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
};

/**
 * PasswordChangeFields — shared controlled fields for the Change Password form.
 * Purely presentational; the parent page/hook owns state and submission.
 */
export const PasswordChangeFields = ({ values, errors, onChange }: PasswordChangeFieldsProps) => {
	return (
		<div className="flex flex-col gap-4">
			<PasswordInput
				id="current-password"
				label="Current password"
				value={values.currentPassword}
				error={errors.currentPassword}
				onChange={(v) => onChange({ currentPassword: v })}
			/>
			<PasswordInput
				id="new-password"
				label="New password"
				value={values.newPassword}
				error={errors.newPassword}
				onChange={(v) => onChange({ newPassword: v })}
			/>
			<PasswordInput
				id="confirm-new-password"
				label="Confirm new password"
				value={values.confirmNewPassword}
				error={errors.confirmNewPassword}
				onChange={(v) => onChange({ confirmNewPassword: v })}
			/>
		</div>
	);
};
