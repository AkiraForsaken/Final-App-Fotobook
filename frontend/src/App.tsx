import { APP_ROUTE } from './utils/routes.ts';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Feeds } from './pages/Feeds.tsx';
import { Discovery } from './pages/Discovery.tsx';
import { Login } from './pages/Login.tsx';
import { Signup } from './pages/Signup.tsx';
import { PublicProfile } from './pages/PublicProfile.tsx';
import { MyProfile } from './pages/MyProfile.tsx';
import { AddPhoto } from './pages/AddPhoto.tsx';
import { EditPhoto } from './pages/EditPhoto.tsx';
import { AddAlbum } from './pages/AddAlbum.tsx';
import { EditAlbum } from './pages/EditAlbum.tsx';
import { EditProfile } from './pages/EditProfile.tsx';
import { Home } from './pages/Home.tsx';
import { NotFound } from './pages/NotFound.tsx';
import { AuthLayout } from './components/layouts/AuthLayout.tsx';
import { ContentLayout } from './components/layouts/ContentLayout.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { useAuth } from './hooks/useAuth.ts';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
	const { currentUser, checkingSession } = useAuth();
	const location = useLocation();

	if (checkingSession) {
		return <div className="text-center py-20 text-text-muted">Loading...</div>;
	}

	if (!currentUser) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
};

const AppContent = () => {
	const { currentUser, login } = useAuth();

	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Routes>
					<Route element={<AuthLayout />}>
						<Route path={APP_ROUTE.LOGIN} element={<Login onLogin={login} />} />
						<Route path={APP_ROUTE.SIGNUP} element={<Signup onLogin={login} />} />
					</Route>

					<Route element={<ContentLayout />}>
						{/* Public / guest-accessible */}
						<Route path={APP_ROUTE.HOME} element={<Home currentUser={currentUser} />} />
						<Route path={APP_ROUTE.DISCOVER} element={<Discovery currentUser={currentUser} />} />
						<Route
							path={APP_ROUTE.PUBLIC_PROFILE}
							element={<PublicProfile currentUser={currentUser} />}
						/>

						{/* Authenticated only */}
						<Route
							path={APP_ROUTE.FEEDS}
							element={
								<RequireAuth>
									<Feeds />
								</RequireAuth>
							}
						/>
						<Route
							path={APP_ROUTE.MY_PROFILE}
							element={
								<RequireAuth>
									<MyProfile currentUser={currentUser!} />
								</RequireAuth>
							}
						/>
						<Route
							path={APP_ROUTE.EDIT_PROFILE}
							element={
								<RequireAuth>
									<EditProfile />
								</RequireAuth>
							}
						/>

						{/* Photo create / edit */}
						<Route
							path={APP_ROUTE.ADD_PHOTO}
							element={
								<RequireAuth>
									<AddPhoto />
								</RequireAuth>
							}
						/>
						<Route
							path={APP_ROUTE.EDIT_PHOTO}
							element={
								<RequireAuth>
									<EditPhoto />
								</RequireAuth>
							}
						/>

						{/* Album create / edit */}
						<Route
							path={APP_ROUTE.ADD_ALBUM}
							element={
								<RequireAuth>
									<AddAlbum />
								</RequireAuth>
							}
						/>
						<Route
							path={APP_ROUTE.EDIT_ALBUM}
							element={
								<RequireAuth>
									<EditAlbum />
								</RequireAuth>
							}
						/>

						<Route path="*" element={<NotFound />} />
					</Route>
				</Routes>
			</ErrorBoundary>
		</BrowserRouter>
	);
};

const App = () => {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
};

export default App;
