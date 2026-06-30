import { Outlet } from 'react-router';
import { TopBar } from '../TopBar';

export const AuthLayout = () => {
	return (
		<>
			<TopBar />
			<Outlet />
		</>
	);
};
