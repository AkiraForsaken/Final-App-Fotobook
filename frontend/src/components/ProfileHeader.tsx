import { Avatar } from './myUI/Avatar';
import { FollowButton } from './FollowButton';
import type { UserProfile } from '../types/index';
import { Button } from './myUI/Button';

interface ProfileHeaderProps {
	profile: UserProfile;
	isOwner: boolean;
	currentUserId?: number;
	isFollowing: boolean;
	onFollowToggle: (userId: number) => void;
	onEditProfile?: () => void;
}

const Stat = ({ value, label }: { value: number; label: string }) => (
	<div className="flex flex-col items-center sm:items-start">
		<span className="text-lg font-bold text-gray-900">{value.toLocaleString()}</span>
		<span className="text-sm text-gray-500">{label}</span>
	</div>
);

export const ProfileHeader = ({
	profile,
	isOwner,
	currentUserId,
	isFollowing,
	onFollowToggle,
	onEditProfile,
}: ProfileHeaderProps) => {
	const fullName = `${profile.firstName} ${profile.lastName}`;

	return (
		<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-gray-200">
			{/* Avatar */}
			<Avatar
				firstName={profile.firstName}
				lastName={profile.lastName}
				src={profile.avatarUrl}
				size="w-24 h-24 sm:w-32 sm:h-32"
				className="text-3xl"
			/>

			{/* Info */}
			<div className="flex flex-col items-center sm:items-start gap-3 flex-1">
				{/* Name + action buttons */}
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-xl font-semibold text-gray-900">{fullName}</h1>

					{isOwner ? (
						<Button
							onClick={onEditProfile}
							variant="primary"
							size="md"
							className="border border-gray-300 bg-blue-400 hover:bg-blue-600 transition-colors"
						>
							Edit profile
						</Button>
					) : (
						<FollowButton
							authorId={profile.id}
							currentUserId={currentUserId}
							isFollowing={isFollowing}
							onToggle={onFollowToggle}
						/>
					)}
				</div>

				{/* Stats row */}
				<div className="flex gap-6">
					<Stat value={profile.publicPhotoCount} label="photos" />
					<Stat value={profile.publicAlbumCount} label="albums" />
					<Stat value={profile.followingCount} label="following" />
					<Stat value={profile.followerCount} label="followers" />
				</div>
			</div>
		</div>
	);
};
