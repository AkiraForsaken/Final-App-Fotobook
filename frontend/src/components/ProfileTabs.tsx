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
		<div className="border-b border-gray-200">
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
									? 'border-blue-800 text-blue-800'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
