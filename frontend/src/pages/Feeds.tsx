import { useState } from 'react';
// import { useDataContext } from "../contexts/DataContext.tsx";
import { useDataContext } from '../hooks/useDataContext.ts';
import { SideBar } from '../components/SideBar.tsx';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { AlbumCard } from '../components/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.ts';
import type { FeedMode, Photo, Album } from '../types/index.ts';
// import { FEED_ALBUMS, FEED_PHOTO_META } from "../mockData.ts";

// Nav items

const NAV_ITEMS = [
	{ label: 'Feeds', to: '/feeds', icon: 'fa-solid fa-house' },
	{ label: 'Discovery', to: '/discover', icon: 'fa-solid fa-compass' },
];

const PAGE_SIZE = 6;

const ScrollFooter = ({ hasMore }: { hasMore: boolean; isFeeds: boolean }) => {
	return hasMore ? (
		<span className="text-sm text-gray-400 flex items-center gap-2">
			<i className="fa-solid fa-spinner fa-spin" />
			Loading more…
		</span>
	) : (
		<span className="text-sm text-gray-400">
			<i className="fa-solid fa-check-circle mr-1" />
			You're all caught up!
		</span>
	);
};

export const Feeds = ({
	mobileOpen,
	setMobileOpen,
}: {
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
}) => {
	const { feedPhotos, feedAlbums, loading, toggleLikePhoto, toggleLikeAlbum } = useDataContext();
	const [feedMode, setFeedMode] = useState<FeedMode>('photos');

	// Separate infinite-scroll instances for each mode
	const photoScroll = useInfiniteScroll(feedPhotos, PAGE_SIZE);
	const albumScroll = useInfiniteScroll(feedAlbums, PAGE_SIZE);

	if (loading) {
		return <div className="flex h-screen items-center justify-center">Loading Content...</div>;
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="mx-auto flex max-w-screen gap-6">
				<SideBar items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

				{/* Main content */}
				<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
					<FeedToggle mode={feedMode} onChange={setFeedMode} />

					<div className="mt-6">
						{/* Photos grid  */}
						<div className={feedMode === 'photos' ? '' : 'hidden'}>
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{(photoScroll.visibleItems as Photo[]).map((photo) => (
									<PhotoCard
										key={photo.id}
										photo={photo}
										onLike={toggleLikePhoto}
										onClickPhoto={(p) => console.log('open photo', p.id)}
										onClickAuthor={(id) => console.log('go to profile', id)}
									/>
								))}
							</div>
							{/* Photo sentinel */}
							<div
								ref={(node) => photoScroll.sentinelRef(node)}
								className="mt-4 flex justify-center py-6"
							>
								<ScrollFooter hasMore={photoScroll.hasMore || photoScroll.loading} isFeeds />
							</div>
						</div>

						{/* Albums grid */}
						<div className={feedMode === 'albums' ? '' : 'hidden'}>
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{(albumScroll.visibleItems as Album[]).map((album) => (
									<AlbumCard
										key={album.id}
										album={album}
										onLike={toggleLikeAlbum}
										onClickAlbum={(p) => console.log('open photo', p.id)}
										onClickAuthor={(id) => console.log('go to profile', id)}
									/>
								))}
							</div>
							{/* Album sentinel */}
							<div
								ref={(node) => albumScroll.sentinelRef(node)}
								className="mt-4 flex justify-center py-6"
							>
								<ScrollFooter hasMore={albumScroll.hasMore || albumScroll.loading} isFeeds />
							</div>
						</div>
					</div>
				</main>

				{/* Right spacer */}
				<div className="hidden xl:block min-w-[13%] shrink-0 bg-gray-100" />
			</div>
		</div>
	);
};
