import { useState } from 'react';
import { cn } from '../../utils/cn.ts';

interface AvatarProps {
	firstName: string;
	lastName: string;
	src?: string;
	size?: string;
	className?: string;
}

/**
 * Avatar — shows the user's photo, or their initials on a coloured background.
 */
export const Avatar = ({
	firstName,
	lastName,
	src,
	size = 'w-10 h-10',
	className = '',
}: AvatarProps) => {
	const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
	const [imgError, setImgError] = useState(false);
	const shared = cn(size, 'rounded-full object-cover shrink-0', className);

	if (src && !imgError) {
		return (
			<img
				src={src}
				alt={`${firstName} ${lastName}`}
				onError={() => setImgError(true)}
				className={shared}
			/>
		);
	}

	return (
		<div
			className={cn(
				shared,
				'bg-blue-600 flex items-center justify-center text-white font-semibold select-none'
			)}
		>
			<span className="leading-none">{initials}</span>
		</div>
	);
};
