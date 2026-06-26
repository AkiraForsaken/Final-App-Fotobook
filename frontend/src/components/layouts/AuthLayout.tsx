import { Outlet } from 'react-router';
import { TopBar } from '../TopBar';
import type { User } from '../../types/index.ts';

interface AuthLayoutProps {
	currentUser: User | null;
	onLogout: () => void;
}

export const AuthLayout = ({ currentUser, onLogout }: AuthLayoutProps) => {
	return (
		<>
			<TopBar currentUser={currentUser} onLogout={onLogout} />
			<Outlet />
		</>
	);
};
