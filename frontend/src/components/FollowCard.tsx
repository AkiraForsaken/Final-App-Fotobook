import { useNavigate } from 'react-router';
import { Avatar } from './myUI/Avatar';
import { FollowButton } from './FollowButton';
import type { FollowRelation } from '../types/index';
import { routeUtils } from '../utils/routes';

interface FollowCardProps {
	user: FollowRelation;
	currentUserId?: number;
	onFollowToggle: (userId: number) => void;
}

/**
 * FollowCard — compact user card shown in Following / Followers tabs.
 * Clicking the name/avatar navigates to that user's public profile.
 */
export const FollowCard = ({ user, currentUserId, onFollowToggle }: FollowCardProps) => {
	const navigate = useNavigate();
	const fullName = `${user.firstName} ${user.lastName}`;
	const isFollowing = currentUserId ? Boolean(user.isFollowedByMe) : false;

	return (
		<div className="flex flex-col items-center gap-3 p-4 bg-surface rounded-xl border border-border shadow-sm">
			<button
				onClick={() => navigate(routeUtils.getPublicProfile(user.id))}
				className="shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-full"
				aria-label={`View ${fullName}'s profile`}
			>
				<Avatar
					firstName={user.firstName}
					lastName={user.lastName}
					src={user.avatarUrl}
					size="w-36 h-36"
				/>
				<p className="font-medium text-text-primary mt-4 truncate max-w-36 hover:underline">
					{fullName}
				</p>
			</button>

			<FollowButton
				authorId={user.id}
				currentUserId={currentUserId}
				isFollowing={isFollowing}
				onToggle={onFollowToggle}
			/>
		</div>
	);
};
