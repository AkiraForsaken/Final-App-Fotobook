import { useSearchParams } from 'react-router';
import type { ProfileTab } from '../types/index';
import { cn } from '../utils/cn.ts';

const TABS: { value: ProfileTab; label: string; icon: string }[] = [
	{ value: 'photos', label: 'Photos', icon: 'fa-solid fa-image' },
	{ value: 'albums', label: 'Albums', icon: 'fa-solid fa-images' },
	{ value: 'following', label: 'Following', icon: 'fa-solid fa-user-check' },
	{ value: 'followers', label: 'Followers', icon: 'fa-solid fa-users' },
];

interface ProfileTabsProps {
	activeTab: ProfileTab;
}

/**
 * ProfileTabs — reads/writes ?tab= in the URL.
 * Renders as a segmented bar similar to Instagram's profile nav.
 */
export const ProfileTabs = ({ activeTab }: ProfileTabsProps) => {
	const [, setSearchParams] = useSearchParams();

	const handleSelect = (tab: ProfileTab) => {
		setSearchParams({ tab }, { replace: true });
	};

	return (
		<div className="border-b border-border">
			<nav className="flex" aria-label="Profile sections">
				{TABS.map(({ value, label, icon }) => {
					const isActive = activeTab === value;
					return (
						<button
							key={value}
							onClick={() => handleSelect(value)}
							className={cn(
								'flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors',
								isActive
									? 'border-blue-800 text-nav-active-text'
									: 'border-transparent text-text-secondary hover:text-text-secondary hover:border-border-strong'
							)}
							aria-current={isActive ? 'page' : undefined}
						>
							<i className={cn(icon, 'text-xs')} />
							<span className="hidden sm:inline">{label}</span>
						</button>
					);
				})}
			</nav>
		</div>
	);
};
