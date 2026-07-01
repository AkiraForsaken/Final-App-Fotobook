import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';
import type { User } from '../types';
// import { MY_USER_ID } from '../data/profileMockData';

interface MyProfileProps {
	currentUser: User;
}

/**
 * MyProfilePage — the authenticated user's own profile.
 * Shows private content, Edit buttons, Add Photo/Album actions.
 * Protected by RequireAuth in App.tsx.
 */

export const MyProfile = ({ currentUser }: MyProfileProps) => {
	const { profile, photos, albums, following, followers, loading, toggleFollowUser, profilesMap } =
		useProfile(currentUser.id, currentUser);

	if (!profile) {
		return <div className="text-center py-20 text-text-muted">Profile data unavailable.</div>;
	}

	if (loading) {
		return <div className="text-center py-20 text-text-muted">Loading profile...</div>;
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
			isOwner={true}
			onFollowToggle={(id) => toggleFollowUser(id)}
		/>
	);
};
