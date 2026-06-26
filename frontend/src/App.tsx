import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Feeds } from './pages/Feeds.tsx';
import { Discovery } from './pages/Discovery.tsx';
import { LoginPage } from './pages/Login.tsx';
import { SignupPage } from './pages/Signup.tsx';
import { PublicProfile } from './pages/PublicProfile.tsx';
import { MyProfile } from './pages/MyProfile.tsx';
import type { User } from './types/index.ts';
import { AuthLayout } from './components/layouts/AuthLayout.tsx';
import { ContentLayout } from './components/layouts/ContentLayout.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

const RequireAuth = ({
	currentUser,
	children,
}: {
	currentUser: User | null;
	children: React.ReactNode;
}) => {
	const location = useLocation();
	if (!currentUser) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}
	return <>{children}</>;
};

const App = () => {
	// Implement backend authentication later
	const LOCAL_STORAGE_USER = 'fotobook.currentUser';
	const [currentUser, setCurrentUser] = useState<User | null>(() => {
		if (typeof window === 'undefined') return null;
		const stored = window.localStorage.getItem(LOCAL_STORAGE_USER);
		if (!stored) return null;
		try {
			return JSON.parse(stored) as User;
		} catch {
			return null;
		}
	});

	const handleLogin = (user: User) => {
		setCurrentUser(user);
		window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
	};

	const handleLogout = () => {
		setCurrentUser(null);
		window.localStorage.removeItem(LOCAL_STORAGE_USER);
	};

	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(currentUser));
	}, [currentUser]);

	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Routes>
					{/* Auth pages (TopBar only, no sidebar) */}
					<Route element={<AuthLayout currentUser={currentUser} onLogout={handleLogout} />}>
						<Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
						<Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
					</Route>

					<Route element={<ContentLayout currentUser={currentUser} onLogout={handleLogout} />}>
						{/* Guests allowed */}
						<Route path="/discover" element={<Discovery currentUser={currentUser} />} />
						<Route path="/profile/:userId" element={<PublicProfile currentUser={currentUser} />} />

						{/* Login required */}
						<Route
							path="/feeds"
							element={
								<RequireAuth currentUser={currentUser}>
									<Feeds />
								</RequireAuth>
							}
						/>
						<Route
							path="/my-profile"
							element={
								<RequireAuth currentUser={currentUser}>
									<MyProfile currentUser={currentUser!} />
								</RequireAuth>
							}
						/>

						{/* Fall Back */}
						<Route path="*" element={<Navigate to="/not-found" replace />} />
					</Route>
				</Routes>
			</ErrorBoundary>
		</BrowserRouter>
	);
};

export default App;
