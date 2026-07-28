import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { APP_ROUTE } from '../../utils/routes';

export const RequireVerifiedEmail = ({ children }: { children: React.ReactNode }) => {
	const { currentUser, checkingSession } = useAuth();
	const location = useLocation();

	if (checkingSession) {
		return <div className="text-center py-20 text-text-muted">Loading...</div>;
	}

	if (!currentUser) {
		return <Navigate to={APP_ROUTE.LOGIN} state={{ from: location }} replace />;
	}

	if (!currentUser.isEmailVerified) {
		return <Navigate to={APP_ROUTE.EDIT_PROFILE} state={{ verificationRequired: true }} replace />;
	}

	return <>{children}</>;
};
