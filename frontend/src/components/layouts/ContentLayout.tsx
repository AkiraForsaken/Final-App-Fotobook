import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBar } from '../TopBar.tsx';
import { SideBar, type NavItem } from '../SideBar.tsx';
import { APP_ROUTE } from '../../utils/routes.ts';
import { useAuth } from '../../hooks/useAuth.ts';

const BASE_NAV_ITEMS = [
	{ label: 'Feeds', to: APP_ROUTE.FEEDS, icon: 'fa-solid fa-house' },
	{ label: 'Discovery', to: APP_ROUTE.DISCOVER, icon: 'fa-solid fa-compass' },
];

/**
 * ContentLayout — wraps all authenticated content pages.
 * Owns the mobile sidebar toggle state.
 */
export const ContentLayout = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const { currentUser } = useAuth();

	const navItems: NavItem[] = currentUser?.isAdmin
		? [
				...BASE_NAV_ITEMS,
				{ label: 'Admin Dashboard', to: APP_ROUTE.ADMIN, icon: 'fa-solid fa-shield-halved' },
			]
		: BASE_NAV_ITEMS;

	return (
		<div>
			<TopBar onMenuToggle={() => setMobileOpen(true)} />
			<div className="min-h-screen bg-bg-page">
				<div className="mx-auto flex max-w-screen gap-6">
					<SideBar items={navItems} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
					<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
						<Outlet />
					</main>
					{/* Right spacer — keeps content centred on wide screens */}
					<div className="hidden 2xl:block min-w-[13%] min-h-screen shrink-0 bg-bg-page" />
				</div>
			</div>
		</div>
	);
};
