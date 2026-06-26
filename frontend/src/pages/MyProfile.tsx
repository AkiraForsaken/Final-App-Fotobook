import { useDataContext } from '../hooks/useDataContext';
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
	const { profilesMap, toggleFollowUser, loading } = useDataContext();
	// In the real app, use currentUser.id. Mock always resolves to MY_USER_ID.
	const profileInfo = profilesMap[currentUser.id];

	if (!profileInfo) {
		return <div className="text-center py-20 text-gray-400">Profile data unavailable.</div>;
	}

	if (loading) {
		return <div className="text-center py-20 text-gray-400">Loading profile...</div>;
	}

	return (
		<ProfileView
			profile={profileInfo.profile}
			photos={profileInfo.ownerPhotos}
			albums={profileInfo.ownerAlbums}
			following={profileInfo.following}
			followers={profileInfo.followers}
			currentUser={currentUser}
			isOwner={true}
			onFollowToggle={(id) => toggleFollowUser(id)}
		/>
	);
};
