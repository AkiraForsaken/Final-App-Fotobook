import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index.ts';

const LOCAL_STORAGE_USER = 'fotobook.currentUser';

interface AuthContextValue {
	currentUser: User | null;
	isAuthenticated: boolean;
	login: (user: User) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUser = (): User | null => {
	if (typeof window === 'undefined') return null;

	const stored = window.localStorage.getItem(LOCAL_STORAGE_USER);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as User;
	} catch {
		return null;
	}
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());

	const login = useCallback((user: User) => {
		setCurrentUser(user);
		window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
	}, []);

	const logout = useCallback(() => {
		setCurrentUser(null);
		window.localStorage.removeItem(LOCAL_STORAGE_USER);
	}, []);

	useEffect(() => {
		if (!currentUser) {
			window.localStorage.removeItem(LOCAL_STORAGE_USER);
			return;
		}

		window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(currentUser));
	}, [currentUser]);

	const value = useMemo(
		() => ({
			currentUser,
			isAuthenticated: Boolean(currentUser),
			login,
			logout,
		}),
		[currentUser, login, logout]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
