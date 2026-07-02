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
	const { currentUser } = useAuth();
	const location = useLocation();

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
						<Route path="/login" element={<Login onLogin={login} />} />
						<Route path="/signup" element={<Signup onLogin={login} />} />
					</Route>

					<Route element={<ContentLayout />}>
						{/* Public / guest-accessible */}
						<Route path="/" element={<Home currentUser={currentUser} />} />
						<Route path="/discover" element={<Discovery currentUser={currentUser} />} />
						<Route path="/profile/:userId" element={<PublicProfile currentUser={currentUser} />} />

						{/* Authenticated only */}
						<Route
							path="/feeds"
							element={
								<RequireAuth>
									<Feeds />
								</RequireAuth>
							}
						/>
						<Route
							path="/my-profile"
							element={
								<RequireAuth>
									<MyProfile currentUser={currentUser!} />
								</RequireAuth>
							}
						/>
						<Route
							path="/my-profile/edit"
							element={
								<RequireAuth>
									<EditProfile />
								</RequireAuth>
							}
						/>

						{/* Photo create / edit */}
						<Route
							path="/photos/add"
							element={
								<RequireAuth>
									<AddPhoto />
								</RequireAuth>
							}
						/>
						<Route
							path="/photos/:id/edit"
							element={
								<RequireAuth>
									<EditPhoto />
								</RequireAuth>
							}
						/>

						{/* Album create / edit */}
						<Route
							path="/albums/new"
							element={
								<RequireAuth>
									<AddAlbum />
								</RequireAuth>
							}
						/>
						<Route
							path="/albums/:id/edit"
							element={
								<RequireAuth>
									<EditAlbum />
								</RequireAuth>
							}
						/>

						{/* Photo create / edit */}
						<Route
							path="/photos/add"
							element={
								<RequireAuth>
									<AddPhoto />
								</RequireAuth>
							}
						/>
						<Route
							path="/photos/:id/edit"
							element={
								<RequireAuth>
									<EditPhoto />
								</RequireAuth>
							}
						/>

						{/* Album create / edit */}
						<Route
							path="/albums/new"
							element={
								<RequireAuth>
									<AddAlbum />
								</RequireAuth>
							}
						/>
						<Route
							path="/albums/:id/edit"
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
