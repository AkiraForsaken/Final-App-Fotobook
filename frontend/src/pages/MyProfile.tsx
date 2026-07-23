import { useProfile } from '../hooks/useProfile.ts';
import { ProfileView } from '../components/profile/ProfileView.tsx';
import type { User } from '../types/index.ts';

interface MyProfileProps {
	currentUser: User;
}

/**
 * MyProfilePage — the authenticated user's own profile.
 * Shows private content, Edit buttons, Add Photo/Album actions.
 * Protected by RequireAuth in App.tsx.
 */
export const MyProfile = ({ currentUser }: MyProfileProps) => {
	const { profile, isOwner, loading, error, photos, albums, following, followers, toggleFollow } =
		useProfile(currentUser.id, currentUser);

	if (loading) {
		return <div className="text-center py-20 text-text-muted">Loading profile...</div>;
	}

	if (!profile || error) {
		return <div className="text-center py-20 text-text-muted">Profile data unavailable.</div>;
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
