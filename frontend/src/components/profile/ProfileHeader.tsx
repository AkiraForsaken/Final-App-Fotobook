import { Avatar } from '../myUI/Avatar';
import { FollowButton } from '../FollowButton';
import type { UserProfile } from '../../types/index';
import { Button } from '../myUI/Button';
import { cn } from '../../utils/cn';

interface ProfileHeaderProps {
	profile: UserProfile;
	isEmailVerified?: boolean;
	isOwner: boolean;
	currentUserId?: number;
	isFollowing: boolean;
	onFollowToggle: (userId: number) => void;
	onEditProfile?: () => void;
}

const Stat = ({ value, label }: { value?: number | null; label: string }) => {
	// Safe number extraction: default to 0 if value is null or undefined
	const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
	return (
		<div className="flex flex-col items-center sm:items-start">
			<span className="text-lg font-bold text-text-primary">{numericValue.toLocaleString()}</span>
			<span className="text-sm text-text-secondary">{label}</span>
		</div>
	);
};

export const ProfileHeader = ({
	profile,
	isEmailVerified,
	isOwner,
	currentUserId,
	isFollowing,
	onFollowToggle,
	onEditProfile,
}: ProfileHeaderProps) => {
	const fullName = `${profile.firstName} ${profile.lastName}`;

	return (
		<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-border">
			{/* Avatar */}
			<Avatar
				firstName={profile.firstName}
				lastName={profile.lastName}
				src={profile.avatarUrl}
				size="w-24 h-24 sm:w-32 sm:h-32"
				className="text-3xl"
			/>

			{/* Info */}
			<div className="flex flex-col items-center sm:items-start gap-2 flex-1">
				{/* Name + action buttons */}
				<div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-6">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">{fullName}</h1>
						{isOwner && typeof isEmailVerified === 'boolean' && (
							<span
								className={cn(
									'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
									isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
								)}
							>
								<i
									className={
										isEmailVerified
											? 'fa-solid fa-circle-check'
											: 'fa-solid fa-triangle-exclamation'
									}
								/>
								{isEmailVerified ? 'Verified' : 'Unverified'}
							</span>
						)}
					</div>

					{isOwner ? (
						<Button onClick={onEditProfile} variant="primary" size="md">
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
