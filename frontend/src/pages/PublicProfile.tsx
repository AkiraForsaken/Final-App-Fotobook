import { useParams } from 'react-router';
import { useProfile } from '../hooks/useProfile.ts';
import { ProfileView } from '../components/profile/ProfileView.tsx';
import type { User } from '../types/index.ts';

interface PublicProfileProps {
	currentUser: User | null;
}

const ProfileNotFound = ({ userId }: { userId: string }) => (
	<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
		<i className="fa-solid fa-user-slash text-5xl text-gray-300" />
		<h2 className="text-xl font-semibold text-text-secondary">User not found</h2>
		<p className="text-sm text-text-muted max-w-xs">
			There's no account at <span className="font-mono text-text-secondary">/profile/{userId}</span>
			. The user may have been deleted or the link may be incorrect.
		</p>
	</div>
);

/**
 * PublicProfile — accessible to guests and authenticated users.
 * Looks up the profile by :userId; renders ProfileNotFound if no match.
 */
export const PublicProfile = ({ currentUser }: PublicProfileProps) => {
	const { userId } = useParams<{ userId: string }>();
	const numericId = userId ? parseInt(userId, 10) : NaN;
	const validId = !isNaN(numericId) ? numericId : null;

	const { profile, isOwner, loading, error, photos, albums, following, followers, toggleFollow } =
		useProfile(validId, currentUser);

	if (loading) {
		return <div className="text-center py-20 text-text-muted">Loading profile...</div>;
	}

	if (!profile || error) {
		return <ProfileNotFound userId={userId ?? ''} />;
	}

	return (
		<ProfileView
			profile={profile}
			currentUser={currentUser}
			isOwner={isOwner}
			photos={photos}
			albums={albums}
			following={following}
			followers={followers}
			onFollowToggle={toggleFollow}
		/>
	);
};
