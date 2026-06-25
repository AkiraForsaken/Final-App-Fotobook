import { useState } from 'react';
// import { useDataContext } from "../contexts/DataContext.tsx";
import { useDataContext } from '../hooks/useDataContext.ts';
import { SideBar } from '../components/SideBar.tsx';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { AlbumCard } from '../components/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { FollowButton } from '../components/FollowButton.tsx';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.ts';
import type { FeedMode, Photo, Album, User } from '../types/index.ts';
// import { DISCOVERY_PHOTOS, DISCOVERY_ALBUMS } from "../mockData.ts";

const NAV_ITEMS = [
	{ label: 'Feeds', to: '/feeds', icon: 'fa-solid fa-house' },
	{ label: 'Discovery', to: '/discover', icon: 'fa-solid fa-compass' },
];

// 6 cards per load
const PAGE_SIZE = 6;

const ScrollFooter = ({ hasMore }: { hasMore: boolean }) => {
	return hasMore ? (
		<span className="text-sm text-gray-400 flex items-center gap-2">
			<i className="fa-solid fa-spinner fa-spin" />
			Loading more…
		</span>
	) : (
		<span className="text-sm text-gray-400">
			<i className="fa-solid fa-check-circle mr-1" />
			You've seen everything!
		</span>
	);
};

export const Discovery = ({
	currentUser,
	mobileOpen,
	setMobileOpen,
}: {
	currentUser: User;
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
}) => {
	const { discoveryPhotos, discoveryAlbums, loading, toggleLikePhoto, toggleLikeAlbum } =
		useDataContext();
	const [feedMode, setFeedMode] = useState<FeedMode>('photos');
	// Track which author IDs the current user follows
	const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
	const photoScroll = useInfiniteScroll(discoveryPhotos, PAGE_SIZE);
	const albumScroll = useInfiniteScroll(discoveryAlbums, PAGE_SIZE);

	if (loading) {
		return <div className="flex h-screen items-center justify-center">Loading Content...</div>;
	}

	const handleFollowToggle = (authorId: number) => {
		setFollowedIds((prev) => {
			const next = new Set(prev);
			if (next.has(authorId)) {
				next.delete(authorId);
			} else {
				next.add(authorId);
			}
			return next;
		});
	};

	const followBtn = (authorId: number) => (
		<FollowButton
			authorId={authorId}
			currentUserId={currentUser.id}
			isFollowing={followedIds.has(authorId)}
			onToggle={handleFollowToggle}
		/>
	);

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="mx-auto flex max-w-screen gap-6">
				<SideBar items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

				<main className="flex flex-col flex-1 px-4 sm:px-6 py-6 min-w-0">
					<FeedToggle mode={feedMode} onChange={setFeedMode} />

					<div className="mt-6">
						{/* Photos grid */}
						<div className={feedMode === 'photos' ? '' : 'hidden'}>
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{(photoScroll.visibleItems as Photo[]).map((photo) => (
									<div key={photo.id} className="relative">
										<PhotoCard
											photo={photo}
											onLike={toggleLikePhoto}
											onClickPhoto={(p) => console.log('open photo', p.id)}
											onClickAuthor={(id) => console.log('go to profile', id)}
										/>
										<div className="absolute top-3 right-3">{followBtn(photo.author.id)}</div>
									</div>
								))}
							</div>
							{/* Photo sentinel */}
							<div
								ref={(node) => photoScroll.sentinelRef(node)}
								className="mt-4 flex justify-center py-6"
							>
								<ScrollFooter hasMore={photoScroll.hasMore || photoScroll.loading} />
							</div>
						</div>

						{/* Albums grid */}
						<div className={feedMode === 'albums' ? '' : 'hidden'}>
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{(albumScroll.visibleItems as Album[]).map((album) => (
									<div key={album.id} className="relative">
										<AlbumCard
											album={album}
											onLike={toggleLikeAlbum}
											onClickAlbum={(a) => console.log('open album', a.id)}
											onClickAuthor={(id) => console.log('go to profile', id)}
										/>
										<div className="absolute top-3 right-3">{followBtn(album.author.id)}</div>
									</div>
								))}
							</div>
							{/* Album sentinel */}
							<div
								ref={(node) => albumScroll.sentinelRef(node)}
								className="mt-4 flex justify-center py-6"
							>
								<ScrollFooter hasMore={albumScroll.hasMore || albumScroll.loading} />
							</div>
						</div>
					</div>
				</main>

				<div className="hidden xl:block min-w-[13%] shrink-0 bg-gray-100" />
			</div>
		</div>
	);
};
