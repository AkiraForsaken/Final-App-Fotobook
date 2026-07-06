export const APP_ROUTE = {
	HOME: '/',
	LOGIN: '/login',
	SIGNUP: '/signup',
	DISCOVER: '/discover',
	FEEDS: '/feeds',

	// Profile Routes
	MY_PROFILE: '/my-profile',
	EDIT_PROFILE: '/my-profile/edit',
	PUBLIC_PROFILE: '/profile/:userId',
	// Photos
	ADD_PHOTO: '/photos/add',
	EDIT_PHOTO: '/photos/:id/edit',
	// Albums
	ADD_ALBUM: '/albums/add',
	EDIT_ALBUM: '/albums/:id/edit',

	NOT_FOUND: '*',
} as const;

/**
 * Utility functions to generate dynamic paths for navigation
 */
export const routeUtils = {
	getPublicProfile: (userId: string | number) => `/profile/${userId}`,
	getEditPhoto: (id: string | number) => `/photos/${id}/edit`,
	getEditAlbum: (id: string | number) => `/albums/${id}/edit`,
};
