import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index.ts';
import { authService } from '../service/authService.ts';
import { setAuthFailureHandler } from '../service/api.ts';
import { userService } from '../service/userService.ts';

interface AuthContextValue {
	currentUser: User | null;
	isAuthenticated: boolean;
	checkingSession: boolean;
	login: (user: User) => void;
	logout: () => Promise<void>;
	updateCurrentUser: (updater: (prev: User) => User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	// The httpOnly cookie is the real source of truth — this is just a cache
	// so a page refresh doesn't flash a logged-out UI while we verify.
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [checkingSession, setCheckingSession] = useState(true);
	const hasCheckedOnce = useRef(false);

	const login = useCallback((user: User) => {
		setCurrentUser(user);

		userService
			.getCurrentProfile()
			.then((fullProfile) => {
				setCurrentUser(fullProfile);
			})
			.catch(() => {
				// Ignore error if offline / user payload was already valid
			});
	}, []);

	const clearLocalSession = useCallback(() => {
		setCurrentUser(null);
	}, []);

	const logout = useCallback(async () => {
		try {
			await authService.logout(); // clears the refresh-token cookie server-side
		} catch {
			// Even if the network call fails, don't strand the user in a
			// logged-in-looking UI they have no way to act on.
		} finally {
			clearLocalSession();
		}
	}, [clearLocalSession]);

	// api.ts calls this whenever a request 401s and a silent refresh also
	// fails — e.g. the refresh token expired or was revoked elsewhere.
	useEffect(() => {
		setAuthFailureHandler(() => clearLocalSession());
		return () => setAuthFailureHandler(null);
	}, [clearLocalSession]);

	// Verify the cookie is still valid on first load, and refresh the cached
	// user with the authoritative server copy (counts, isActive, etc.).
	useEffect(() => {
		if (hasCheckedOnce.current) return;
		hasCheckedOnce.current = true;

		const verifySession = async () => {
			try {
				// 1. Refresh the access token in memory first using the HttpOnly cookie
				await authService.refresh();
				// 2. Fetch the profile with a valid token attached
				const profile = await userService.getCurrentProfile();
				login(profile);
			} catch {
				// If the refresh token is missing/expired, silently clear the local cache
				clearLocalSession();
			} finally {
				setCheckingSession(false);
			}
		};

		verifySession();
	}, [login, clearLocalSession]);

	const updateCurrentUser = useCallback((updater: (prev: User) => User) => {
		setCurrentUser((prev) => {
			if (!prev) return null;
			const updated = updater(prev);
			return updated;
		});
	}, []);

	const value = useMemo(
		() => ({
			currentUser,
			isAuthenticated: Boolean(currentUser),
			checkingSession,
			login,
			logout,
			updateCurrentUser,
		}),
		[currentUser, checkingSession, login, logout, updateCurrentUser]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
