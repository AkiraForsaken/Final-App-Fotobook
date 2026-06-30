import { useNavigate } from 'react-router';
import { Avatar } from './myUI/Avatar.tsx';
import { SearchBar } from './myUI/SearchBar.tsx';
import { Button } from './myUI/Button.tsx';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';

interface TopBarProps {
	onMenuToggle?: () => void;
	onSearch?: (query: string) => void;
}

export const TopBar = ({ onMenuToggle, onSearch }: TopBarProps) => {
	const navigate = useNavigate();
	const { currentUser, logout } = useAuth();
	const handleLogout = () => {
		logout();
		navigate('/login');
	};
	return (
		<header className="bg-blue-800 sticky top-0 z-20">
			<div className="w-full px-4 lg:px-8">
				<div className="flex h-14 items-center justify-between">
					{/* Left: hamburger + logo + search */}
					<div className="flex items-center gap-2 lg:gap-6 min-w-0 lg:ml-8">
						{/* Hamburger - mobile only */}
						<button
							onClick={onMenuToggle}
							aria-label="Open menu"
							className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-blue-700 transition-colors"
						>
							<i className="fa-solid fa-bars" />
						</button>

						<span
							className="shrink-0 text-3xl font-bold text-white tracking-tight cursor-pointer"
							onClick={() => navigate('/')}
						>
							FotoBook
						</span>

						{/* Desktop search */}
						<SearchBar
							className="hidden sm:block w-64 md:w-80"
							placeholder="Search photos / albums…"
							onSearch={onSearch}
						/>
					</div>

					{/* Right: user control */}
					<div className="flex items-center gap-4 mr-2 lg:mr-8">
						{currentUser ? (
							<>
								<div
									className="flex items-center gap-2 cursor-pointer"
									onClick={() => navigate('/my-profile')}
								>
									<Avatar
										src={currentUser.avatarUrl}
										firstName={currentUser.firstName}
										lastName={currentUser.lastName}
									/>
									<span className="hidden md:block text-md font-medium text-white">
										{currentUser.firstName} {currentUser.lastName}
									</span>
								</div>
								<Button size="md" variant="secondary" onClick={handleLogout}>
									Logout
								</Button>
							</>
						) : (
							<Button size="md" variant="secondary">
								<Link to="/login">Log in</Link>
							</Button>
						)}
					</div>
				</div>

				{/* Mobile search - below main row */}
				<div className="block sm:hidden pb-3">
					<SearchBar placeholder="Search photos / albums…" onSearch={onSearch} />
				</div>
			</div>
		</header>
	);
};
