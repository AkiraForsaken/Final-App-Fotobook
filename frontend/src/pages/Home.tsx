import { Button } from '../components/myUI/Button';
import { Link } from 'react-router';
import type { User } from '../types';
import { APP_ROUTE } from '../utils/routes';

export const Home = ({ currentUser }: { currentUser: User | null }) => {
	return (
		<div className="w-full min-h-[87vh] px-4 py-8">
			<div
				className="mx-auto h-full max-w-7xl flex-col rounded-lg border border-gray-200/50 
        bg-gradient-to-br from-blue-100 via-white to-sky-100 
        dark:bg-transparent dark:from-slate-900 dark:via-blue-950 dark:to-sky-900
        p-6 shadow-md sm:p-8 lg:p-10"
			>
				<div className="flex items-center h-full gap-10">
					<div className="flex flex-col h-full justify-center gap-6">
						<span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
							Share stories through photos
						</span>
						<div className="space-y-4">
							<h1 className="text-4xl font-semibold text-text-primary sm:text-5xl lg:text-6xl">
								Welcome to Fotobook.
							</h1>
							<p className="max-w-xl text-lg text-text-secondary sm:text-xl">
								A warm, visual space to share moments, discover creators, and keep your favorite
								memories close.
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Button variant="primary" size="lg">
								<Link to={currentUser ? APP_ROUTE.FEEDS : APP_ROUTE.LOGIN}>
									{currentUser ? 'Go to Feeds' : 'Log in'}
								</Link>
							</Button>
							<Button variant="primary" size="lg">
								<Link to={APP_ROUTE.DISCOVER}>Discover</Link>
							</Button>
						</div>

						<div className="flex flex-wrap gap-4 bg- text-sm text-text-secondary">
							<div className="rounded-full border border-gray-200 bg-surface px-3 py-1.5">
								Explore albums
							</div>
							<div className="rounded-full border border-gray-200 bg-surface px-3 py-1.5">
								Follow friends
							</div>
							<div className="rounded-full border border-gray-200 bg-surface px-3 py-1.5">
								Share your world
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
