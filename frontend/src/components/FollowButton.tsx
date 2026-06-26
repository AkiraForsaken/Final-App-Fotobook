interface FollowButtonProps {
	authorId: number;
	currentUserId?: number;
	isFollowing: boolean;
	onToggle: (authorId: number) => void;
}

/**
 * FollowButton - renders a Follow / Following toggle.
 * Hidden when the author is the currently logged-in user.
 */
export const FollowButton = ({
	authorId,
	currentUserId,
	isFollowing,
	onToggle,
}: FollowButtonProps) => {
	if (authorId === currentUserId) return null;

	return (
		<button
			onClick={(e) => {
				e.stopPropagation(); // don't bubble up to card click handlers
				onToggle(authorId);
			}}
			className={[
				'text-xs font-semibold px-3 py-1 rounded-full border transition-colors',
				isFollowing
					? 'bg-blue-800 text-white border-blue-800 hover:bg-blue-700 hover:border-blue-700'
					: 'bg-white text-blue-800 border-blue-800 hover:bg-blue-50',
			].join(' ')}
		>
			{isFollowing ? (
				<>
					<i className="fa-solid fa-user-check mr-1" />
					Following
				</>
			) : (
				<>
					<i className="fa-solid fa-user-plus mr-1" />
					Follow
				</>
			)}
		</button>
	);
};
