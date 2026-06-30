import { useParams } from 'react-router';
import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';
import type { User } from '../types/index';

interface PublicProfileProps {
	currentUser: User | null;
}

const ProfileNotFound = ({ userId }: { userId: string }) => (
	<div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
		<i className="fa-solid fa-user-slash text-5xl text-gray-300" />
		<h2 className="text-xl font-semibold text-gray-700">User not found</h2>
		<p className="text-sm text-gray-400 max-w-xs">
			There's no account at <span className="font-mono text-gray-500">/profile/{userId}</span>. The
			user may have been deleted or the link may be incorrect.
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
	const { profile, photos, albums, following, followers, loading, toggleFollowUser, profilesMap } =
		useProfile(!isNaN(numericId) ? numericId : null, currentUser);

	if (!profile) {
		return <ProfileNotFound userId={userId ?? ''} />;
	}

	if (loading) {
		return <div className="text-center py-20 text-gray-400">Loading profile...</div>;
	}

	return (
		<ProfileView
			profile={profile}
			photos={photos}
			albums={albums}
			following={following}
			followers={followers}
			profilesMap={profilesMap}
			currentUser={currentUser}
			isOwner={false}
			onFollowToggle={(id) => toggleFollowUser(id)}
		/>
	);
};
