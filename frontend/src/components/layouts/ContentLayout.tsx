import { useCallback, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import { TopBar } from '../TopBar.tsx';
import { SideBar, type NavItem } from '../SideBar.tsx';
import { APP_ROUTE } from '../../utils/routes.ts';
import { useAuth } from '../../hooks/useAuth.ts';

export type ContentOutletContext = {
	setOnSearch: (handler: ((query: string) => void) | null) => void;
};

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

	// Holds the active page's setSearchQuery callback without forcing re-renders
	const searchHandlerRef = useRef<((query: string) => void) | null>(null);

	const setOnSearch = useCallback((handler: ((query: string) => void) | null) => {
		searchHandlerRef.current = handler;
	}, []);

	const navItems: NavItem[] = [
		...(currentUser
			? [
					{
						label: 'Profile',
						to: APP_ROUTE.MY_PROFILE,
						icon: 'fa-solid fa-user',
						className: 'sm:hidden', // Hide on desktop screens where sidebar is sticky
					},
				]
			: []),
		...BASE_NAV_ITEMS,
		...(currentUser?.isAdmin
			? [{ label: 'Admin Dashboard', to: APP_ROUTE.ADMIN, icon: 'fa-solid fa-shield-halved' }]
			: []),
	];

	return (
		<div>
			<TopBar
				onMenuToggle={() => setMobileOpen(true)}
				onSearch={(query) => searchHandlerRef.current?.(query)}
			/>
			<div className="min-h-screen bg-bg-page">
				<div className="mx-auto flex max-w-screen gap-6">
					<SideBar items={navItems} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
					<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
						<Outlet context={{ setOnSearch } satisfies ContentOutletContext} />
					</main>
					{/* Right spacer — keeps content centred on wide screens */}
					<div className="hidden 2xl:block min-w-[13%] min-h-screen shrink-0 bg-bg-page" />
				</div>
			</div>
		</div>
	);
};
