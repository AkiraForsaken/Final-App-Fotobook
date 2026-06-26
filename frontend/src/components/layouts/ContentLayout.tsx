import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBar } from '../TopBar.tsx';
import { SideBar } from '../SideBar.tsx';
import { DataProvider } from '../../contexts/DataProvider.tsx';
import type { User } from '../../types/index.ts';

const NAV_ITEMS = [
	{ label: 'Feeds', to: '/feeds', icon: 'fa-solid fa-house' },
	{ label: 'Discovery', to: '/discover', icon: 'fa-solid fa-compass' },
];

interface ContentLayoutProps {
	currentUser: User | null;
	onLogout: () => void;
}

/**
 * ContentLayout — wraps all authenticated content pages.
 * Owns the mobile sidebar toggle state.
 */
export const ContentLayout = ({ currentUser, onLogout }: ContentLayoutProps) => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<DataProvider>
			<div>
				<TopBar
					currentUser={currentUser}
					onLogout={onLogout}
					onMenuToggle={() => setMobileOpen(true)}
				/>
				<div className="min-h-screen bg-gray-100">
					<div className="mx-auto flex max-w-screen gap-6">
						<SideBar
							items={NAV_ITEMS}
							mobileOpen={mobileOpen}
							onClose={() => setMobileOpen(false)}
						/>
						<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
							<Outlet />
						</main>
						{/* Right spacer — keeps content centred on wide screens */}
						<div className="hidden xl:block min-w-[13%] min-h-screen shrink-0 bg-gray-200" />
					</div>
				</div>
			</div>
		</DataProvider>
	);
};
