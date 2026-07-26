import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBar } from '../TopBar.tsx';
import { SideBar, type NavItem } from '../SideBar.tsx';
import { APP_ROUTE } from '../../utils/routes.ts';

const ADMIN_NAV_ITEMS: NavItem[] = [
	{ label: 'Manage Users', to: APP_ROUTE.ADMIN_USERS, icon: 'fa-solid fa-users' },
	{ label: 'Manage Photos', to: APP_ROUTE.ADMIN_PHOTOS, icon: 'fa-solid fa-image' },
	{ label: 'Manage Albums', to: APP_ROUTE.ADMIN_ALBUMS, icon: 'fa-solid fa-images' },
	{ label: 'Return to Fotobook', to: APP_ROUTE.FEEDS, icon: 'fa-solid fa-arrow-left' },
];

/**
 * AdminLayout — wraps all /admin/* pages. Mirrors ContentLayout's shell
 * (TopBar + SideBar + Outlet) but swaps in the admin-only nav list. Route
 * guarding (RequireAdmin) happens per-route in App.tsx, same pattern as
 * RequireAuth — this component only handles layout.
 */
export const AdminLayout = () => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div>
			<TopBar adminLayout={true} onMenuToggle={() => setMobileOpen(true)} />
			<div className="min-h-screen bg-bg-page">
				<div className="mx-auto flex max-w-screen gap-6">
					<SideBar
						items={ADMIN_NAV_ITEMS}
						mobileOpen={mobileOpen}
						onClose={() => setMobileOpen(false)}
					/>
					<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
						<Outlet />
					</main>
					<div className="hidden xl:block min-w-[13%] min-h-screen shrink-0 bg-bg-page" />
				</div>
			</div>
		</div>
	);
};
