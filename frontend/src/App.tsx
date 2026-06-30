import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Feeds } from './pages/Feeds.tsx';
import { Discovery } from './pages/Discovery.tsx';
import { LoginPage } from './pages/Login.tsx';
import { SignupPage } from './pages/Signup.tsx';
import { PublicProfile } from './pages/PublicProfile.tsx';
import { MyProfile } from './pages/MyProfile.tsx';
import { AuthLayout } from './components/layouts/AuthLayout.tsx';
import { ContentLayout } from './components/layouts/ContentLayout.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { useAuth } from './hooks/useAuth.ts';
import NotFound from './pages/NotFound.tsx';

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
						<Route path="/login" element={<LoginPage onLogin={login} />} />
						<Route path="/signup" element={<SignupPage onLogin={login} />} />
					</Route>

					<Route element={<ContentLayout />}>
						<Route path="/discover" element={<Discovery currentUser={currentUser} />} />
						<Route path="/profile/:userId" element={<PublicProfile currentUser={currentUser} />} />

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
