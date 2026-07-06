import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBar } from '../TopBar.tsx';
import { SideBar } from '../SideBar.tsx';

const NAV_ITEMS = [
	{ label: 'Feeds', to: '/feeds', icon: 'fa-solid fa-house' },
	{ label: 'Discovery', to: '/discover', icon: 'fa-solid fa-compass' },
];

/**
 * ContentLayout — wraps all authenticated content pages.
 * Owns the mobile sidebar toggle state.
 */
export const ContentLayout = () => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div>
			<TopBar onMenuToggle={() => setMobileOpen(true)} />
			<div className="min-h-screen bg-bg-page">
				<div className="mx-auto flex max-w-screen gap-6">
					<SideBar items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
					<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
						<Outlet />
					</main>
					{/* Right spacer — keeps content centred on wide screens */}
					<div className="hidden xl:block min-w-[13%] min-h-screen shrink-0 bg-bg-page" />
				</div>
			</div>
		</div>
	);
};
